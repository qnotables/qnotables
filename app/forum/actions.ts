"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { isAdminEmail } from "@/lib/admin"
import { isApprovedIframeSrc } from "@/lib/media-utils"
import {
  parseTags,
  serializeTags,
  buildExcerpt,
  generateThreadSlug,
  normalizeDeskSlug,
  checkTitleQuality,
} from "@/lib/forum-utils"
import {
  checkRateLimit,
  sanitizeBody,
  containsScriptTags,
  containsUnsafeHtml,
  hasTooManyLinks,
  hasTooManyEmbeds,
  isNewUser,
  flagBodyAutomatic,
  stripMediaFromBody,
  SPAM_LIMITS,
} from "@/lib/forum-spam-guard"

const ALLOWED_TIPTAP_NODES = new Set([
  "doc", "paragraph", "text", "heading", "bulletList", "orderedList", "listItem",
  "blockquote", "codeBlock", "hardBreak", "horizontalRule", "image", "videoBlock", "embedBlock",
])

function collectMediaUrls(document: unknown): string[] {
  const urls = new Set<string>()
  const walk = (node: unknown) => {
    if (!node || typeof node !== "object") return
    const item = node as { type?: string; attrs?: Record<string, unknown>; content?: unknown[] }
    if (["image", "videoBlock"].includes(item.type ?? "")) {
      const src = item.attrs?.src
      if (typeof src === "string" && src.startsWith("https://")) urls.add(src)
    }
    item.content?.forEach(walk)
  }
  walk(document)
  return [...urls]
}

function parseRichContent(raw: string, format: string) {
  if (format !== "tiptap") {
    const clean = sanitizeBody(raw)
    return { body: clean, contentJson: null, plainText: clean.replace(/<[^>]*>/g, " ") }
  }

  let document: unknown
  try {
    document = JSON.parse(raw)
  } catch {
    throw new Error("The rich-text document is invalid. Please refresh and try again.")
  }

  if (!document || typeof document !== "object" || (document as { type?: string }).type !== "doc") {
    throw new Error("The rich-text document is invalid.")
  }

  const textParts: string[] = []
  const walk = (node: unknown) => {
    if (!node || typeof node !== "object") throw new Error("Invalid editor content.")
    const item = node as { type?: string; text?: string; content?: unknown[]; attrs?: Record<string, unknown> }
    if (!item.type || !ALLOWED_TIPTAP_NODES.has(item.type)) throw new Error("Unsupported editor content.")
    if (item.type === "text" && typeof item.text === "string") textParts.push(item.text)
    if (item.attrs) {
      for (const key of ["src", "originalUrl", "embedUrl"] as const) {
        const value = item.attrs[key]
        if (typeof value === "string" && value && !/^https:\/\//i.test(value)) {
          throw new Error("Media and embed URLs must use HTTPS.")
        }
      }
      if (item.type === "embedBlock") {
        const embedUrl = item.attrs.embedUrl
        if (typeof embedUrl !== "string" || !isApprovedIframeSrc(embedUrl)) {
          throw new Error("That embed provider is not approved for Town Hall posts.")
        }
      }
    }
    item.content?.forEach(walk)
  }
  walk(document)

  const plainText = textParts.join(" ").replace(/\s+/g, " ").trim()
  return { body: JSON.stringify(document), contentJson: document, plainText }
}

export async function createThread(formData: FormData) {
  const title = String(formData.get("title") ?? "").trim()
  const rawBody = String(formData.get("body") ?? "").trim()
  const category = String(formData.get("category") ?? "").trim() || null
  const desk = normalizeDeskSlug(String(formData.get("desk") ?? category ?? "other"))
  const rawTags = String(formData.get("tags") ?? "").trim()
  const source_url = String(formData.get("source_url") ?? "").trim() || null
  const intent = String(formData.get("intent") ?? "publish")
  const status = intent === "draft" ? "draft" : "published"
  const contentFormat = String(formData.get("content_format") ?? "markdown")
  const tags = rawTags ? serializeTags(parseTags(rawTags)) : null
  let richContent: ReturnType<typeof parseRichContent>
  try {
    richContent = parseRichContent(rawBody, contentFormat)
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Invalid post content." }
  }

  if (title.length < 4 || richContent.plainText.length < 4) {
    return { error: "Title and body must each be at least 4 characters." }
  }
  const titleIssue = checkTitleQuality(title)
  if (titleIssue) return { error: titleIssue }

  // Hard safety checks — no sanitizing, just reject
  if (containsScriptTags(rawBody) || containsScriptTags(title)) {
    return { error: "Post contains disallowed content." }
  }
  if (containsUnsafeHtml(rawBody)) {
    return { error: "Post contains unsafe HTML." }
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: "You must be signed in to post." }

  // Rate limit: 1 post per 30 s
  const rl = checkRateLimit(user.id, "post", SPAM_LIMITS.POST_COOLDOWN_MS, 1)
  if (!rl.allowed) {
    const secs = Math.ceil(rl.retryAfterMs / 1000)
    return { error: `Posting too fast. Please wait ${secs}s before posting again.` }
  }

  // Load site settings for per-site limits
  const admin = createAdminClient()
  const { data: settings } = await admin
    .from("site_settings")
    .select("forum_max_links, forum_max_embeds, forum_moderation_mode")
    .eq("id", 1)
    .maybeSingle()

  const maxLinks = settings?.forum_max_links ?? SPAM_LIMITS.MAX_LINKS_PER_POST
  const maxEmbeds = settings?.forum_max_embeds ?? SPAM_LIMITS.MAX_EMBEDS_PER_POST
  const moderationMode = settings?.forum_moderation_mode ?? false

  const linkCheck = hasTooManyLinks(rawBody, maxLinks)
  if (!linkCheck.ok) {
    return { error: `Too many links (${linkCheck.count}). Maximum allowed: ${linkCheck.max}.` }
  }
  const embedCheck = hasTooManyEmbeds(rawBody, maxEmbeds)
  if (!embedCheck.ok) {
    return { error: `Too many embeds (${embedCheck.count}). Maximum allowed: ${embedCheck.max}.` }
  }

  const body = richContent.body

  // Check if user is new — for moderation queue
  const { data: profile } = await supabase
    .from("profiles")
    .select("created_at, post_count")
    .eq("id", user.id)
    .maybeSingle()

  const userIsNew = isNewUser(profile ?? {})
  const isPending = moderationMode && userIsNew

  const now = new Date().toISOString()
  const slug = generateThreadSlug(title, crypto.randomUUID())
  const excerpt = buildExcerpt(richContent.plainText, 200)
  const { data, error } = await supabase
    .from("forum_threads")
    .insert({
      title,
      body,
      excerpt,
      slug,
      author_id: user.id,
      category,
      desk,
      tags,
      source_url,
      status,
      content_format: contentFormat,
      content_json: richContent.contentJson,
      content_version: 1,
      is_pending: isPending,
      last_activity_at: now,
      updated_at: now,
      published_at: status === "published" ? now : null,
    })
    .select("id, slug")
    .single()

  if (error) return { error: error.message }

  const mediaUrls = collectMediaUrls(richContent.contentJson)
  if (mediaUrls.length > 0) {
    const { error: attachmentError } = await supabase
      .from("forum_attachments")
      .update({ thread_id: data.id, status: "active", attached_at: now, updated_at: now })
      .eq("owner_id", user.id)
      .eq("status", "orphaned")
      .in("url", mediaUrls)
    if (attachmentError) return { error: "Thread was saved, but its uploaded media could not be attached." }
  }

  // Auto-flag if body looks spammy (even if not hard-rejected)
  const flagReason = flagBodyAutomatic(body, maxLinks, maxEmbeds)
  if (flagReason) {
    await admin.from("moderation_flags").insert({
      content_type: "forum_thread",
      content_id: data.id,
      reason: flagReason,
      status: "open",
      auto_flagged: true,
    })
  }

  revalidatePath("/forum")

  if (isPending) {
    return { error: null, pending: true, message: "Your post is pending review by a moderator." }
  }
  if (status === "draft") {
    return { error: null, draft: true, id: data.id, slug: data.slug, message: "Draft saved." }
  }

  redirect(`/forum/${data.slug || data.id}`)
}

export async function updateThread(formData: FormData) {
  const id = String(formData.get("thread_id") ?? "")
  const title = String(formData.get("title") ?? "").trim()
  const rawBody = String(formData.get("body") ?? "").trim()
  const category = String(formData.get("category") ?? "").trim() || null
  const desk = normalizeDeskSlug(String(formData.get("desk") ?? category ?? "other"))
  const rawTags = String(formData.get("tags") ?? "").trim()
  const tags = rawTags ? serializeTags(parseTags(rawTags)) : null
  const contentFormat = String(formData.get("content_format") ?? "markdown")
  const expectedVersion = Number(formData.get("content_version") ?? 1)
  let richContent: ReturnType<typeof parseRichContent>
  try {
    richContent = parseRichContent(rawBody, contentFormat)
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Invalid post content." }
  }

  if (!id) return { error: "Missing thread." }
  if (title.length < 4 || richContent.plainText.length < 4) {
    return { error: "Title and body must each be at least 4 characters." }
  }
  const titleIssue = checkTitleQuality(title)
  if (titleIssue) return { error: titleIssue }
  if (containsScriptTags(rawBody) || containsUnsafeHtml(rawBody)) {
    return { error: "Post contains unsafe content." }
  }
  const body = richContent.body

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: "You must be signed in to edit." }

  const { data: current } = await supabase
    .from("forum_threads")
    .select("body, content_json, content_format, content_version")
    .eq("id", id)
    .eq("author_id", user.id)
    .maybeSingle()
  if (!current) return { error: "You do not have permission to edit this thread." }
  if (current.content_version !== expectedVersion) {
    return { error: "This thread changed in another tab. Reload before saving.", conflict: true }
  }

  const { error: revisionError } = await supabase.from("forum_revisions").insert({
    content_type: "thread",
    content_id: id,
    author_id: user.id,
    body: current.body ?? "",
    content_json: current.content_json,
    content_format: current.content_format ?? "markdown",
    content_version: current.content_version ?? 1,
  })
  if (revisionError) return { error: revisionError.message }

  const { data: updated, error } = await supabase
    .from("forum_threads")
    .update({
      title,
      body,
      content_json: richContent.contentJson,
      content_format: contentFormat,
      content_version: expectedVersion + 1,
      excerpt: buildExcerpt(richContent.plainText, 200),
      category,
      desk,
      tags,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("author_id", user.id)
    .eq("content_version", expectedVersion)
    .select("id")
    .maybeSingle()

  if (error) return { error: error.message }
  if (!updated) return { error: "This thread changed in another tab. Reload before saving.", conflict: true }

  revalidatePath(`/forum/${id}`)
  revalidatePath("/forum")
  return { error: null }
}

export async function deleteThread(formData: FormData) {
  const id = String(formData.get("thread_id") ?? "")
  if (!id) return { error: "Missing thread." }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: "You must be signed in to delete." }

  const { error } = await supabase
    .from("forum_threads")
    .delete()
    .eq("id", id)
    .eq("author_id", user.id)

  if (error) return { error: error.message }

  revalidatePath("/forum")
  redirect("/forum")
}

export async function updateDisplayName(formData: FormData) {
  const displayName = String(formData.get("display_name") ?? "").trim()

  if (displayName.length < 2 || displayName.length > 32) {
    return { error: "Display name must be between 2 and 32 characters." }
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: "You must be signed in." }

  const { error } = await supabase
    .from("profiles")
    .update({ display_name: displayName })
    .eq("id", user.id)

  if (error) return { error: error.message }

  revalidatePath(`/u/${user.id}`)
  revalidatePath("/forum")
  return { error: null }
}

export async function createReply(formData: FormData) {
  const threadId = String(formData.get("thread_id") ?? "")
  const rawBody = String(formData.get("body") ?? "").trim()
  const parentReplyId = String(formData.get("parent_reply_id") ?? "") || null
  const contentFormat = String(formData.get("content_format") ?? "markdown")
  let richContent: ReturnType<typeof parseRichContent>
  try {
    richContent = parseRichContent(rawBody, contentFormat)
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Invalid reply content." }
  }

  if (!threadId) return { error: "Missing thread." }
  if (richContent.plainText.length < 2) return { error: "Reply is too short." }

  // Hard safety checks
  if (containsScriptTags(rawBody)) return { error: "Reply contains disallowed content." }
  if (containsUnsafeHtml(rawBody)) return { error: "Reply contains unsafe HTML." }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: "You must be signed in to reply." }

  // Rate limit: 1 reply per 30 s
  const rl = checkRateLimit(user.id, "post", SPAM_LIMITS.POST_COOLDOWN_MS, 1)
  if (!rl.allowed) {
    const secs = Math.ceil(rl.retryAfterMs / 1000)
    return { error: `Posting too fast. Please wait ${secs}s before replying again.` }
  }

  // Load per-site limits
  const admin = createAdminClient()
  const { data: settings } = await admin
    .from("site_settings")
    .select("forum_max_links, forum_max_embeds, forum_moderation_mode")
    .eq("id", 1)
    .maybeSingle()

  const maxLinks = settings?.forum_max_links ?? SPAM_LIMITS.MAX_LINKS_PER_POST
  const maxEmbeds = settings?.forum_max_embeds ?? SPAM_LIMITS.MAX_EMBEDS_PER_POST
  const moderationMode = settings?.forum_moderation_mode ?? false

  const linkCheck = hasTooManyLinks(rawBody, maxLinks)
  if (!linkCheck.ok) {
    return { error: `Too many links (${linkCheck.count}). Maximum allowed: ${linkCheck.max}.` }
  }
  const embedCheck = hasTooManyEmbeds(rawBody, maxEmbeds)
  if (!embedCheck.ok) {
    return { error: `Too many embeds (${embedCheck.count}). Maximum allowed: ${embedCheck.max}.` }
  }

  const body = richContent.body

  // Check new-user status
  const { data: profile } = await supabase
    .from("profiles")
    .select("created_at, post_count")
    .eq("id", user.id)
    .maybeSingle()

  const isPending = moderationMode && isNewUser(profile ?? {})

  const { data: replyData, error } = await supabase
    .from("forum_replies")
    .insert({
      thread_id: threadId,
      body,
      author_id: user.id,
      parent_reply_id: parentReplyId,
      content_format: contentFormat,
      content_json: richContent.contentJson,
      content_version: 1,
      is_pending: isPending,
    })
    .select("id")
    .single()

  if (error) return { error: error.message }

  const mediaUrls = collectMediaUrls(richContent.contentJson)
  if (mediaUrls.length > 0 && replyData?.id) {
    const now = new Date().toISOString()
    const { error: attachmentError } = await supabase
      .from("forum_attachments")
      .update({ reply_id: replyData.id, status: "active", attached_at: now, updated_at: now })
      .eq("owner_id", user.id)
      .eq("status", "orphaned")
      .in("url", mediaUrls)
    if (attachmentError) return { error: "Reply was saved, but its uploaded media could not be attached." }
  }

  // Auto-flag
  const flagReason = flagBodyAutomatic(body, maxLinks, maxEmbeds)
  if (flagReason && replyData?.id) {
    await admin.from("moderation_flags").insert({
      content_type: "forum_reply",
      content_id: replyData.id,
      reason: flagReason,
      status: "open",
      auto_flagged: true,
    })
  }

  if (!isPending) {
    const { count } = await admin
      .from("forum_replies")
      .select("id", { count: "exact", head: true })
      .eq("thread_id", threadId)
      .eq("is_hidden", false)
      .eq("is_pending", false)

    await admin
      .from("forum_threads")
      .update({
        reply_count: count ?? 0,
        last_activity_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", threadId)
  }

  revalidatePath(`/forum/${threadId}`)
  if (isPending) {
    return { error: null, pending: true, message: "Your reply is pending review by a moderator." }
  }
  return { error: null }
}

export async function updateReply(formData: FormData) {
  const replyId = String(formData.get("reply_id") ?? "")
  const rawBody = String(formData.get("body") ?? "").trim()
  const contentFormat = String(formData.get("content_format") ?? "markdown")
  const expectedVersion = Number(formData.get("content_version") ?? 1)
  let richContent: ReturnType<typeof parseRichContent>
  try {
    richContent = parseRichContent(rawBody, contentFormat)
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Invalid reply content." }
  }
  if (!replyId) return { error: "Missing reply." }
  if (richContent.plainText.length < 2) return { error: "Reply is too short." }
  if (containsScriptTags(rawBody) || containsUnsafeHtml(rawBody)) {
    return { error: "Reply contains unsafe content." }
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: "You must be signed in to edit." }

  const { data: reply } = await supabase
    .from("forum_replies")
    .select("thread_id, author_id, body, content_json, content_format, content_version")
    .eq("id", replyId)
    .maybeSingle()

  if (!reply || reply.author_id !== user.id) {
    return { error: "You do not have permission to edit this reply." }
  }

  const { data: thread } = await supabase
    .from("forum_threads")
    .select("is_locked")
    .eq("id", reply.thread_id)
    .maybeSingle()
  if (thread?.is_locked) return { error: "This thread is locked." }

  if (reply.content_version !== expectedVersion) {
    return { error: "This reply changed in another tab. Reload before saving your edits.", conflict: true }
  }

  const { error: revisionError } = await supabase.from("forum_revisions").insert({
    content_type: "reply",
    content_id: replyId,
    author_id: user.id,
    body: reply.body ?? "",
    content_json: reply.content_json,
    content_format: reply.content_format ?? "markdown",
    content_version: reply.content_version ?? 1,
  })
  if (revisionError) return { error: revisionError.message }

  const body = richContent.body
  const { data: updated, error } = await supabase
    .from("forum_replies")
    .update({
      body,
      content_json: richContent.contentJson,
      content_format: contentFormat,
      content_version: expectedVersion + 1,
      updated_at: new Date().toISOString(),
    })
    .eq("id", replyId)
    .eq("author_id", user.id)
    .eq("content_version", expectedVersion)
    .select("id")
    .maybeSingle()

  if (error) return { error: error.message }
  if (!updated) return { error: "This reply changed in another tab. Reload before saving.", conflict: true }
  revalidatePath(`/forum/${reply.thread_id}`)
  return { error: null }
}

/** Best-effort view counter. Uses the service client so anonymous views count. */
export async function incrementThreadViewCount(threadId: string) {
  if (!threadId) return { error: "Missing thread." }
  const admin = createAdminClient()
  const { data: thread, error: readError } = await admin
    .from("forum_threads")
    .select("view_count")
    .eq("id", threadId)
    .eq("status", "published")
    .maybeSingle()

  if (readError || !thread) return { error: readError?.message ?? "Thread not found." }
  const { error } = await admin
    .from("forum_threads")
    .update({ view_count: Math.max(0, Number(thread.view_count) || 0) + 1 })
    .eq("id", threadId)

  return { error: error?.message ?? null }
}

// ─── Rich-media moderation actions ───────────────────────────────────────────

/** Strip all embedded images/video/embeds from a thread body (admin only). */
export async function removeThreadMedia(threadId: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user || !isAdminEmail(user.email)) {
    return { error: "You do not have permission." }
  }

  const { data: thread } = await supabase
    .from("forum_threads")
    .select("body")
    .eq("id", threadId)
    .maybeSingle()

  if (!thread) return { error: "Thread not found." }

  const cleanBody = stripMediaFromBody(thread.body ?? "")
  const { error } = await supabase
    .from("forum_threads")
    .update({ body: cleanBody, content_json: null, content_format: "markdown" })
    .eq("id", threadId)

  if (error) return { error: error.message }
  await supabase
    .from("forum_attachments")
    .update({ status: "hidden", updated_at: new Date().toISOString() })
    .eq("thread_id", threadId)
    .eq("status", "active")
  await supabase.from("forum_audit_logs").insert({
    actor_id: user.id,
    action: "thread_media_hidden",
    target_type: "thread",
    target_id: threadId,
  })
  revalidatePath(`/forum/${threadId}`)
  revalidatePath("/forum")
  return { error: null, cleanBody }
}

/** Strip all embedded images/video/embeds from a reply body (admin only). */
export async function removeReplyMedia(replyId: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user || !isAdminEmail(user.email)) {
    return { error: "You do not have permission." }
  }

  const { data: reply } = await supabase
    .from("forum_replies")
    .select("body, thread_id")
    .eq("id", replyId)
    .maybeSingle()

  if (!reply) return { error: "Reply not found." }

  const cleanBody = stripMediaFromBody(reply.body ?? "")
  const { error } = await supabase
    .from("forum_replies")
    .update({ body: cleanBody, content_json: null, content_format: "markdown" })
    .eq("id", replyId)

  if (error) return { error: error.message }
  await supabase
    .from("forum_attachments")
    .update({ status: "hidden", updated_at: new Date().toISOString() })
    .eq("reply_id", replyId)
    .eq("status", "active")
  await supabase.from("forum_audit_logs").insert({
    actor_id: user.id,
    action: "reply_media_hidden",
    target_type: "reply",
    target_id: replyId,
  })
  if (reply.thread_id) revalidatePath(`/forum/${reply.thread_id}`)
  return { error: null, cleanBody }
}

/** Approve a pending thread (admin only). */
export async function approveThread(threadId: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user || !isAdminEmail(user.email)) {
    return { error: "You do not have permission." }
  }

  const { error } = await supabase
    .from("forum_threads")
    .update({ is_pending: false })
    .eq("id", threadId)

  if (error) return { error: error.message }
  revalidatePath("/forum")
  revalidatePath("/dashboard/moderation")
  return { error: null }
}

/** Reject a pending thread by soft-deleting it (admin only). */
export async function rejectThread(threadId: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user || !isAdminEmail(user.email)) {
    return { error: "You do not have permission." }
  }

  const { error } = await supabase
    .from("forum_threads")
    .update({ is_soft_deleted: true, is_pending: false })
    .eq("id", threadId)

  if (error) return { error: error.message }
  revalidatePath("/forum")
  revalidatePath("/dashboard/moderation")
  return { error: null }
}

/** Approve a pending reply (admin only). */
export async function approveReply(replyId: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user || !isAdminEmail(user.email)) {
    return { error: "You do not have permission." }
  }

  const { data: reply } = await supabase
    .from("forum_replies")
    .select("thread_id")
    .eq("id", replyId)
    .maybeSingle()

  const { error } = await supabase
    .from("forum_replies")
    .update({ is_pending: false })
    .eq("id", replyId)

  if (error) return { error: error.message }
  if (reply?.thread_id) revalidatePath(`/forum/${reply.thread_id}`)
  revalidatePath("/dashboard/moderation")
  return { error: null }
}

/** Reject + hide a pending reply (admin only). */
export async function rejectReply(replyId: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user || !isAdminEmail(user.email)) {
    return { error: "You do not have permission." }
  }

  const { data: reply } = await supabase
    .from("forum_replies")
    .select("thread_id")
    .eq("id", replyId)
    .maybeSingle()

  const { error } = await supabase
    .from("forum_replies")
    .update({ is_hidden: true, is_pending: false })
    .eq("id", replyId)

  if (error) return { error: error.message }
  if (reply?.thread_id) revalidatePath(`/forum/${reply.thread_id}`)
  revalidatePath("/dashboard/moderation")
  return { error: null }
}

export async function deleteThreadAsAdmin(threadId: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: "You must be signed in to delete." }

  // Check admin status via ADMIN_EMAILS
  if (!isAdminEmail(user.email)) {
    return { error: "You do not have permission to delete threads." }
  }

  const { error } = await supabase
    .from("forum_threads")
    .delete()
    .eq("id", threadId)

  if (error) return { error: error.message }

  revalidatePath("/forum")
  revalidatePath("/admin/forum")
  return { error: null }
}

export async function lockThread(threadId: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user || !isAdminEmail(user.email)) {
    return { error: "You do not have permission." }
  }

  const { error } = await supabase
    .from("forum_threads")
    .update({ is_locked: true })
    .eq("id", threadId)

  if (error) return { error: error.message }
  revalidatePath(`/forum/${threadId}`)
  revalidatePath("/admin/forum")
  return { error: null }
}

export async function unlockThread(threadId: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user || !isAdminEmail(user.email)) {
    return { error: "You do not have permission." }
  }

  const { error } = await supabase
    .from("forum_threads")
    .update({ is_locked: false })
    .eq("id", threadId)

  if (error) return { error: error.message }
  revalidatePath(`/forum/${threadId}`)
  revalidatePath("/admin/forum")
  return { error: null }
}

export async function pinThread(threadId: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user || !isAdminEmail(user.email)) {
    return { error: "You do not have permission." }
  }

  const { error } = await supabase
    .from("forum_threads")
    .update({ is_pinned: true })
    .eq("id", threadId)

  if (error) return { error: error.message }
  revalidatePath("/forum")
  revalidatePath("/admin/forum")
  return { error: null }
}

export async function unpinThread(threadId: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user || !isAdminEmail(user.email)) {
    return { error: "You do not have permission." }
  }

  const { error } = await supabase
    .from("forum_threads")
    .update({ is_pinned: false })
    .eq("id", threadId)

  if (error) return { error: error.message }
  revalidatePath("/forum")
  revalidatePath("/admin/forum")
  return { error: null }
}

export async function softDeleteThread(threadId: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user || !isAdminEmail(user.email)) {
    return { error: "You do not have permission." }
  }

  const { error } = await supabase
    .from("forum_threads")
    .update({ is_soft_deleted: true })
    .eq("id", threadId)

  if (error) return { error: error.message }
  revalidatePath("/forum")
  revalidatePath("/admin/forum")
  return { error: null }
}

export async function restoreThread(threadId: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user || !isAdminEmail(user.email)) {
    return { error: "You do not have permission." }
  }

  const { error } = await supabase
    .from("forum_threads")
    .update({ is_soft_deleted: false })
    .eq("id", threadId)

  if (error) return { error: error.message }
  revalidatePath("/forum")
  revalidatePath("/admin/forum")
  return { error: null }
}

export async function reportContent(
  contentType: "forum_thread" | "forum_reply",
  contentId: string,
  reason: string,
) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: "You must be signed in to report content." }

  const trimmed = reason.trim().slice(0, 500)
  if (trimmed.length < 4) return { error: "Please provide a brief reason for the report." }

  const admin = createAdminClient()

  // Avoid duplicate open reports from the same user on the same content
  const { data: existing } = await admin
    .from("moderation_flags")
    .select("id")
    .eq("content_type", contentType)
    .eq("content_id", contentId)
    .eq("reported_by", user.id)
    .eq("status", "open")
    .maybeSingle()

  if (existing) {
    return { error: null, alreadyReported: true }
  }

  const { error } = await admin.from("moderation_flags").insert({
    content_type: contentType,
    content_id: contentId,
    reason: `User report: ${trimmed}`,
    status: "open",
    auto_flagged: false,
    reported_by: user.id,
  })

  if (error) return { error: error.message }
  return { error: null }
}

export async function voteOnThread(threadId: string, voteValue: 1 | -1) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: "You must be signed in to vote." }

  // Check for existing vote
  const { data: existing } = await supabase
    .from("thread_votes")
    .select("id, vote")
    .eq("thread_id", threadId)
    .eq("user_id", user.id)
    .maybeSingle()

  let error = null

  if (existing) {
    if (existing.vote === voteValue) {
      // Remove vote (toggle off)
      const { error: delError } = await supabase
        .from("thread_votes")
        .delete()
        .eq("id", existing.id)
      error = delError?.message ?? null
    } else {
      // Change vote
      const { error: updateError } = await supabase
        .from("thread_votes")
        .update({ vote: voteValue })
        .eq("id", existing.id)
      error = updateError?.message ?? null
    }
  } else {
    // New vote
    const { error: insertError } = await supabase
      .from("thread_votes")
      .insert({ thread_id: threadId, user_id: user.id, vote: voteValue })
    error = insertError?.message ?? null
  }

  if (error) return { error }

  // Update author karma
  const { data: thread } = await supabase
    .from("forum_threads")
    .select("author_id")
    .eq("id", threadId)
    .maybeSingle()

  if (thread?.author_id) {
    const { data: votes } = await supabase
      .from("thread_votes")
      .select("vote")
      .eq("thread_id", threadId)

    const netThreadKarma = (votes ?? []).reduce((sum, v) => sum + (v.vote as number), 0)

    // Get existing karma and add the net for this thread
    const { data: profile } = await supabase
      .from("profiles")
      .select("karma")
      .eq("id", thread.author_id)
      .maybeSingle()

    const currentKarma = (profile as any)?.karma ?? 0
    await supabase
      .from("profiles")
      .update({ karma: currentKarma + netThreadKarma })
      .eq("id", thread.author_id)
  }

  revalidatePath(`/forum/${threadId}`)
  return { error: null }
}

export async function voteOnReply(replyId: string, voteType: "up" | "down") {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: "You must be signed in to vote." }

  // Check if user already voted
  const { data: existing } = await supabase
    .from("reply_votes")
    .select("id, vote_type")
    .eq("reply_id", replyId)
    .eq("user_id", user.id)
    .maybeSingle()

  let error = null

  if (existing) {
    // Toggle or change vote
    if (existing.vote_type === voteType) {
      // Remove vote
      const { error: delError } = await supabase
        .from("reply_votes")
        .delete()
        .eq("id", existing.id)
      error = delError?.message || null
    } else {
      // Change vote type
      const { error: updateError } = await supabase
        .from("reply_votes")
        .update({ vote_type: voteType })
        .eq("id", existing.id)
      error = updateError?.message || null
    }
  } else {
    // Add new vote
    const { error: insertError } = await supabase
      .from("reply_votes")
      .insert({ reply_id: replyId, user_id: user.id, vote_type: voteType })
    error = insertError?.message || null
  }

  if (error) return { error }

  // Update author karma based on total votes on their reply
  const { data: votes } = await supabase
    .from("reply_votes")
    .select("vote_type")
    .eq("reply_id", replyId)

  const upVotes = votes?.filter((v) => v.vote_type === "up").length ?? 0
  const downVotes = votes?.filter((v) => v.vote_type === "down").length ?? 0
  const karma = upVotes - downVotes

  // Get reply author
  const { data: reply } = await supabase
    .from("forum_replies")
    .select("author_id")
    .eq("id", replyId)
    .maybeSingle()

  if (reply?.author_id) {
    // Calculate total karma for this user across all their replies
    const { data: allVotes } = await supabase
      .from("reply_votes")
      .select("vote_type, forum_replies(author_id)")
      .eq("forum_replies.author_id", reply.author_id)

    const totalKarma =
      allVotes?.filter((v) => v.vote_type === "up").length ?? 0 -
      (allVotes?.filter((v) => v.vote_type === "down").length ?? 0)

    await supabase.from("profiles").update({ karma: totalKarma }).eq("id", reply.author_id)
  }

  revalidatePath(`/forum/[slug]`)
  return { error: null }
}
