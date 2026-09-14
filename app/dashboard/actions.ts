"use server"

import { revalidatePath } from "next/cache"
import { createAdminClient } from "@/lib/supabase/admin"
import { validateDashboardAccess } from "@/lib/dashboard-auth"
import { logActivity } from "@/lib/dashboard-data"
import { compactSearchText, normalizeComparableText } from "@/lib/search-utils"

type Result = { success: boolean; error?: string }

async function guard(): Promise<boolean> {
  return validateDashboardAccess()
}

/* ----------------------------- Blog ----------------------------- */

export async function setBlogStatus(id: string, status: string): Promise<Result> {
  if (!(await guard())) return { success: false, error: "Not authorized." }
  const db = createAdminClient()
  const publishedAt = status === "published" ? new Date().toISOString() : null
  const { error } = await db
    .from("blog_posts")
    .update({ status, published_at: publishedAt, updated_at: new Date().toISOString() })
    .eq("id", id)
  if (error) return { success: false, error: error.message }
  await logActivity({ action: `set blog post to ${status}`, targetType: "blog_post", targetId: id })
  revalidatePath("/dashboard/blog")
  revalidatePath("/dashboard/archives")
  revalidatePath("/archives")
  return { success: true }
}

export async function toggleBlogFeatured(id: string, featured: boolean): Promise<Result> {
  if (!(await guard())) return { success: false, error: "Not authorized." }
  const db = createAdminClient()
  const { error } = await db
    .from("blog_posts")
    .update({ featured, updated_at: new Date().toISOString() })
    .eq("id", id)
  if (error) return { success: false, error: error.message }
  await logActivity({ action: `${featured ? "featured" : "unfeatured"} blog post`, targetType: "blog_post", targetId: id })
  revalidatePath("/dashboard/blog")
  return { success: true }
}

export async function deleteBlogPost(id: string): Promise<Result> {
  if (!(await guard())) return { success: false, error: "Not authorized." }
  const db = createAdminClient()
  const { error } = await db.from("blog_posts").delete().eq("id", id)
  if (error) return { success: false, error: error.message }
  await logActivity({ action: "deleted blog post", targetType: "blog_post", targetId: id })
  revalidatePath("/dashboard/blog")
  revalidatePath("/dashboard/archives")
  return { success: true }
}

export async function updateArchiveDates(
  id: string,
  publishedAt: string | null,
): Promise<Result> {
  if (!(await guard())) return { success: false, error: "Not authorized." }
  const db = createAdminClient()
  const { error } = await db
    .from("blog_posts")
    .update({ published_at: publishedAt, updated_at: new Date().toISOString() })
    .eq("id", id)
  if (error) return { success: false, error: error.message }
  await logActivity({ action: "updated archive date", targetType: "blog_post", targetId: id })
  revalidatePath("/dashboard/archives")
  return { success: true }
}

/* ----------------------------- Forum ----------------------------- */

export async function moderateThread(
  id: string,
  field: "is_locked" | "is_pinned" | "is_featured" | "is_soft_deleted",
  value: boolean,
): Promise<Result> {
  if (!(await guard())) return { success: false, error: "Not authorized." }
  const db = createAdminClient()
  const { error } = await db.from("forum_threads").update({ [field]: value }).eq("id", id)
  if (error) return { success: false, error: error.message }
  await logActivity({ action: `set thread ${field}=${value}`, targetType: "forum_thread", targetId: id })
  revalidatePath("/dashboard/forum")
  revalidatePath("/forum")
  return { success: true }
}

export async function deleteThreadAdmin(id: string): Promise<Result> {
  if (!(await guard())) return { success: false, error: "Not authorized." }
  const db = createAdminClient()
  // Remove dependent replies first to avoid FK issues.
  await db.from("forum_replies").delete().eq("thread_id", id)
  const { error } = await db.from("forum_threads").delete().eq("id", id)
  if (error) return { success: false, error: error.message }
  await logActivity({ action: "deleted forum thread", targetType: "forum_thread", targetId: id })
  revalidatePath("/dashboard/forum")
  revalidatePath("/forum")
  return { success: true }
}

export async function deleteReplyAdmin(id: string): Promise<Result> {
  if (!(await guard())) return { success: false, error: "Not authorized." }
  const db = createAdminClient()
  const { error } = await db.from("forum_replies").delete().eq("id", id)
  if (error) return { success: false, error: error.message }
  await logActivity({ action: "deleted forum reply", targetType: "forum_reply", targetId: id })
  revalidatePath("/dashboard/forum")
  return { success: true }
}

export async function hideReply(id: string): Promise<Result> {
  if (!(await guard())) return { success: false, error: "Not authorized." }
  const db = createAdminClient()
  const { error } = await db.from("forum_replies").update({ is_hidden: true }).eq("id", id)
  if (error) return { success: false, error: error.message }
  await logActivity({ action: "hid forum reply", targetType: "forum_reply", targetId: id })
  revalidatePath("/dashboard/forum")
  revalidatePath("/forum")
  return { success: true }
}

export async function unhideReply(id: string): Promise<Result> {
  if (!(await guard())) return { success: false, error: "Not authorized." }
  const db = createAdminClient()
  const { error } = await db.from("forum_replies").update({ is_hidden: false }).eq("id", id)
  if (error) return { success: false, error: error.message }
  await logActivity({ action: "restored forum reply", targetType: "forum_reply", targetId: id })
  revalidatePath("/dashboard/forum")
  revalidatePath("/forum")
  return { success: true }
}

/* ----------------------------- Users ----------------------------- */

export async function setUserRole(id: string, role: string): Promise<Result> {
  if (!(await guard())) return { success: false, error: "Not authorized." }
  const db = createAdminClient()
  const { error } = await db
    .from("profiles")
    .update({ role, updated_at: new Date().toISOString() })
    .eq("id", id)
  if (error) return { success: false, error: error.message }
  await logActivity({ action: `set user role to ${role}`, targetType: "profile", targetId: id })
  revalidatePath("/dashboard/users")
  return { success: true }
}

export async function setUserStatus(id: string, status: string): Promise<Result> {
  if (!(await guard())) return { success: false, error: "Not authorized." }
  const db = createAdminClient()
  const { error } = await db
    .from("profiles")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", id)
  if (error) return { success: false, error: error.message }
  await logActivity({ action: `set user status to ${status}`, targetType: "profile", targetId: id })
  revalidatePath("/dashboard/users")
  return { success: true }
}

/* ----------------------------- RSS ----------------------------- */

export async function saveRssItem(formData: FormData): Promise<Result> {
  if (!(await guard())) return { success: false, error: "Not authorized." }
  const db = createAdminClient()

  const id = String(formData.get("id") ?? "").trim()
  const title = String(formData.get("title") ?? "").trim()
  if (title.length < 2) return { success: false, error: "Title is required." }

  const status = String(formData.get("status") ?? "draft")
  const payload = {
    title,
    link: String(formData.get("link") ?? "").trim() || null,
    guid: String(formData.get("guid") ?? "").trim() || null,
    description: String(formData.get("description") ?? "").trim() || null,
    category: String(formData.get("category") ?? "").trim() || null,
    source_name: String(formData.get("source_name") ?? "").trim() || null,
    source_url: String(formData.get("source_url") ?? "").trim() || null,
    image_url: String(formData.get("image_url") ?? "").trim() || null,
    priority: String(formData.get("priority") ?? "medium"),
    research_status: String(formData.get("research_status") ?? "unverified").trim() || "unverified",
    status,
    published_at:
      status === "published"
        ? String(formData.get("published_at") ?? "").trim() || new Date().toISOString()
        : null,
    updated_at: new Date().toISOString(),
  }

  if (id) {
    const { error } = await db.from("rss_items").update(payload).eq("id", id)
    if (error) return { success: false, error: error.message }
  } else {
    const { error } = await db.from("rss_items").insert(payload)
    if (error) return { success: false, error: error.message }
  }
  await logActivity({ action: id ? "updated RSS item" : "created RSS item", targetType: "rss_item", targetId: id })
  revalidatePath("/dashboard/rss")
  return { success: true }
}

export async function deleteRssItem(id: string): Promise<Result> {
  if (!(await guard())) return { success: false, error: "Not authorized." }
  const db = createAdminClient()
  const { error } = await db.from("rss_items").delete().eq("id", id)
  if (error) return { success: false, error: error.message }
  revalidatePath("/dashboard/rss")
  return { success: true }
}

/* ----------------------------- Media ----------------------------- */

export async function saveMediaAsset(input: {
  fileName: string
  fileUrl: string
  fileType?: string
  fileSize?: number
  altText?: string
}): Promise<Result> {
  if (!(await guard())) return { success: false, error: "Not authorized." }
  const db = createAdminClient()
  const { error } = await db.from("media_assets").insert({
    file_name: input.fileName,
    file_url: input.fileUrl,
    file_type: input.fileType ?? null,
    file_size: input.fileSize ?? null,
    alt_text: input.altText ?? null,
  })
  if (error) return { success: false, error: error.message }
  await logActivity({ action: "uploaded media", targetType: "media_asset", details: input.fileName })
  revalidatePath("/dashboard/media")
  return { success: true }
}

export async function updateMediaAlt(id: string, altText: string): Promise<Result> {
  if (!(await guard())) return { success: false, error: "Not authorized." }
  const db = createAdminClient()
  const { error } = await db.from("media_assets").update({ alt_text: altText }).eq("id", id)
  if (error) return { success: false, error: error.message }
  revalidatePath("/dashboard/media")
  return { success: true }
}

export async function deleteMediaAsset(id: string): Promise<Result> {
  if (!(await guard())) return { success: false, error: "Not authorized." }
  const db = createAdminClient()
  const { error } = await db.from("media_assets").delete().eq("id", id)
  if (error) return { success: false, error: error.message }
  await logActivity({ action: "deleted media", targetType: "media_asset", targetId: id })
  revalidatePath("/dashboard/media")
  return { success: true }
}

/* ----------------------------- Ads ----------------------------- */

export async function saveAd(formData: FormData): Promise<Result> {
  if (!(await guard())) return { success: false, error: "Not authorized." }
  const db = createAdminClient()

  const id = String(formData.get("id") ?? "").trim()
  const title = String(formData.get("title") ?? "").trim()
  if (title.length < 2) return { success: false, error: "Title is required." }

  const payload = {
    title,
    description: String(formData.get("description") ?? "").trim(),
    image_url: String(formData.get("image_url") ?? "").trim() || null,
    button_text: String(formData.get("button_text") ?? "").trim() || "Learn More",
    button_link: String(formData.get("button_link") ?? "").trim() || "#",
    placement: String(formData.get("placement") ?? "sidebar"),
    type: String(formData.get("type") ?? "internal"),
    is_active: formData.get("is_active") === "on",
    priority: Number(formData.get("priority") ?? 0) || 0,
    updated_at: new Date().toISOString(),
  }

  if (id) {
    const { error } = await db.from("ads").update(payload).eq("id", id)
    if (error) return { success: false, error: error.message }
  } else {
    const { error } = await db.from("ads").insert(payload)
    if (error) return { success: false, error: error.message }
  }
  await logActivity({ action: id ? "updated ad" : "created ad", targetType: "ad", targetId: id })
  revalidatePath("/dashboard/ads")
  return { success: true }
}

export async function toggleAdActive(id: string, isActive: boolean): Promise<Result> {
  if (!(await guard())) return { success: false, error: "Not authorized." }
  const db = createAdminClient()
  const { error } = await db
    .from("ads")
    .update({ is_active: isActive, updated_at: new Date().toISOString() })
    .eq("id", id)
  if (error) return { success: false, error: error.message }
  revalidatePath("/dashboard/ads")
  return { success: true }
}

export async function deleteAdAction(id: string): Promise<Result> {
  if (!(await guard())) return { success: false, error: "Not authorized." }
  const db = createAdminClient()
  const { error } = await db.from("ads").delete().eq("id", id)
  if (error) return { success: false, error: error.message }
  await logActivity({ action: "deleted ad", targetType: "ad", targetId: id })
  revalidatePath("/dashboard/ads")
  return { success: true }
}

/* ----------------------------- Moderation ----------------------------- */

export async function resolveFlag(id: string, status: string): Promise<Result> {
  if (!(await guard())) return { success: false, error: "Not authorized." }
  const db = createAdminClient()
  const { error } = await db
    .from("moderation_flags")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", id)
  if (error) return { success: false, error: error.message }
  await logActivity({ action: `flag marked ${status}`, targetType: "moderation_flag", targetId: id })
  revalidatePath("/dashboard/moderation")
  return { success: true }
}

/* ----------------------------- Settings ----------------------------- */

export async function saveSettings(formData: FormData): Promise<Result> {
  if (!(await guard())) return { success: false, error: "Not authorized." }
  const db = createAdminClient()
  const rawMaxLinks = parseInt(String(formData.get("forum_max_links") ?? "8"), 10)
  const rawMaxEmbeds = parseInt(String(formData.get("forum_max_embeds") ?? "4"), 10)
  const rawSignalMinScore = parseInt(String(formData.get("signal_analysis_min_score") ?? "55"), 10)
  const rawSignalMaxItems = parseInt(String(formData.get("signal_analysis_max_items") ?? "24"), 10)
  const rawPulseActiveAge = parseInt(String(formData.get("pulse_active_max_age_days") ?? "14"), 10)
  const rawPulseBackchannelAge = parseInt(String(formData.get("pulse_backchannel_max_age_days") ?? "14"), 10)
  const excludedPulseIds = String(formData.get("pulse_excluded_thread_ids") ?? "")
    .split(/[\\n,]/)
    .map((value) => value.trim())
    .filter((value, index, values) => value.length > 0 && values.indexOf(value) === index)
    .slice(0, 100)
  const payload = {
    id: 1,
    site_name: String(formData.get("site_name") ?? "").trim() || "HOT AND FRESH",
    tagline: String(formData.get("tagline") ?? "").trim() || null,
    default_image_url: String(formData.get("default_image_url") ?? "").trim() || null,
    rss_title: String(formData.get("rss_title") ?? "").trim() || null,
    rss_description: String(formData.get("rss_description") ?? "").trim() || null,
    shop_preview_mode: formData.get("shop_preview_mode") === "on",
    public_registration: formData.get("public_registration") === "on",
    maintenance_mode: formData.get("maintenance_mode") === "on",
    forum_moderation_mode: formData.get("forum_moderation_mode") === "on",
    forum_max_links: isNaN(rawMaxLinks) ? 8 : Math.max(1, Math.min(50, rawMaxLinks)),
    forum_max_embeds: isNaN(rawMaxEmbeds) ? 4 : Math.max(1, Math.min(20, rawMaxEmbeds)),
    signal_analysis_enabled: formData.get("signal_analysis_enabled") === "on",
    signal_preview_enabled: formData.get("signal_preview_enabled") === "on",
    signal_analysis_min_score: isNaN(rawSignalMinScore) ? 55 : Math.max(0, Math.min(100, rawSignalMinScore)),
    signal_analysis_max_items: isNaN(rawSignalMaxItems) ? 24 : Math.max(1, Math.min(100, rawSignalMaxItems)),
    pulse_enabled: formData.get("pulse_enabled") === "on",
    pulse_editor_thread_id: String(formData.get("pulse_editor_thread_id") ?? "").trim() || null,
    pulse_excluded_thread_ids: excludedPulseIds,
    pulse_active_max_age_days: isNaN(rawPulseActiveAge) ? 14 : Math.max(1, Math.min(90, rawPulseActiveAge)),
    pulse_backchannel_max_age_days: isNaN(rawPulseBackchannelAge) ? 14 : Math.max(1, Math.min(90, rawPulseBackchannelAge)),
    pulse_kicker: String(formData.get("pulse_kicker") ?? "").trim() || "COMMUNITY SIGNAL",
    pulse_title: String(formData.get("pulse_title") ?? "").trim() || "THE TOWN HALL",
    pulse_description: String(formData.get("pulse_description") ?? "").trim() || "Follow the signal. Examine the evidence. Add to the record.",
    pulse_enter_label: String(formData.get("pulse_enter_label") ?? "").trim() || "ENTER THE TOWN HALL",
    pulse_start_label: String(formData.get("pulse_start_label") ?? "").trim() || "START A THREAD",
    pulse_updated_by: "dashboard",
    updated_at: new Date().toISOString(),
  }
  const { error } = await db.from("site_settings").upsert(payload, { onConflict: "id" })
  if (error) return { success: false, error: error.message }
  await logActivity({ action: "updated site settings", targetType: "site_settings" })
  revalidatePath("/dashboard/settings")
  revalidatePath("/")
  revalidatePath("/forum")
  return { success: true }
}

export async function searchPulseThreads(query: string): Promise<Array<{ threadId: string; title: string; category: string; href: string; sourceStatus: "PRIMARY SOURCE" | "COMMUNITY THREAD" }>> {
  if (!(await guard())) return []
  const { searchPulseThreads: searchThreads } = await import("@/lib/pulse")
  return searchThreads(query)
}

export async function runSignalAnalysisAction(): Promise<Result & { scannedCount: number; createdCount: number; updatedCount: number }> {
  if (!(await guard())) return { success: false, error: "Not authorized.", scannedCount: 0, createdCount: 0, updatedCount: 0 }
  try {
    const { runSignalAnalysis } = await import("@/lib/signal-analysis")
    const result = await runSignalAnalysis("manual")
    revalidatePath("/dashboard/signal-analysis")
    return { success: result.success, error: result.errors[0], scannedCount: result.scannedCount, createdCount: result.createdCount, updatedCount: result.updatedCount }
  } catch {
    return { success: false, error: "Unable to run signal analysis.", scannedCount: 0, createdCount: 0, updatedCount: 0 }
  }
}

export async function reviewSignalAnalysisItem(
  id: string,
  status: "approved" | "dismissed",
): Promise<Result> {
  if (!(await guard())) return { success: false, error: "Not authorized." }
  const db = createAdminClient()
  const { error } = await db
    .from("signal_analysis_items")
    .update({ status, reviewed_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq("id", id)
  if (error) return { success: false, error: "Unable to update signal review status." }
  await logActivity({ action: `signal marked ${status}`, targetType: "signal_analysis_item", targetId: id })
  revalidatePath("/dashboard/signal-analysis")
  revalidatePath("/")
  return { success: true }
}

export type SearchAliasGroupInput = {
  id?: string
  label: string
  slug: string
  terms: string[]
  enabled: boolean
}

function cleanAliasTerms(values: string[]): Array<{ term: string; normalized_term: string; compact_term: string }> {
  const seen = new Set<string>()
  return values
    .flatMap((value) => value.split(/[\\n,]/))
    .map((value) => value.trim().slice(0, 120))
    .filter((term) => {
      const normalized = normalizeComparableText(term)
      const compact = compactSearchText(term)
      const key = compact || normalized
      if (!key || seen.has(key)) return false
      seen.add(key)
      return true
    })
    .map((term) => ({ term, normalized_term: normalizeComparableText(term), compact_term: compactSearchText(term) }))
    .slice(0, 30)
}

export async function saveSearchAliasGroup(input: SearchAliasGroupInput): Promise<Result> {
  if (!(await guard())) return { success: false, error: "Not authorized." }
  const label = input.label.trim().slice(0, 80)
  const slug = input.slug.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 80)
  const terms = cleanAliasTerms(input.terms)
  if (!label || !slug || terms.length === 0) return { success: false, error: "Add a label, slug, and at least one unique term." }

  try {
    const db = createAdminClient()
    let groupId = input.id
    if (groupId) {
      const { error } = await db.from("search_alias_groups").update({ label, slug, enabled: Boolean(input.enabled), updated_at: new Date().toISOString() }).eq("id", groupId)
      if (error) throw error
      const { error: deleteError } = await db.from("search_alias_terms").delete().eq("group_id", groupId)
      if (deleteError) throw deleteError
    } else {
      const { data, error } = await db.from("search_alias_groups").insert({ label, slug, enabled: Boolean(input.enabled) }).select("id").single()
      if (error) throw error
      groupId = data.id
    }
    const { error: termsError } = await db.from("search_alias_terms").insert(terms.map((term) => ({ ...term, group_id: groupId })))
    if (termsError) throw termsError
    await logActivity({ action: input.id ? "updated search alias group" : "created search alias group", targetType: "search_alias_group", targetId: groupId })
    revalidatePath("/dashboard/settings")
    return { success: true }
  } catch {
    return { success: false, error: "Unable to save the search alias group." }
  }
}

export async function deleteSearchAliasGroup(id: string): Promise<Result> {
  if (!(await guard())) return { success: false, error: "Not authorized." }
  try {
    const db = createAdminClient()
    const { error } = await db.from("search_alias_groups").delete().eq("id", id)
    if (error) throw error
    await logActivity({ action: "deleted search alias group", targetType: "search_alias_group", targetId: id })
    revalidatePath("/dashboard/settings")
    return { success: true }
  } catch {
    return { success: false, error: "Unable to delete the search alias group." }
  }
}

export async function rebuildSearchIndex(): Promise<Result> {
  if (!(await guard())) return { success: false, error: "Not authorized." }
  try {
    const db = createAdminClient()
    const { error } = await db.rpc("refresh_search_documents")
    if (error) throw error
    await logActivity({ action: "rebuilt search index", targetType: "search_documents" })
    revalidatePath("/dashboard/settings")
    return { success: true }
  } catch {
    return { success: false, error: "Unable to rebuild the search index." }
  }
}
