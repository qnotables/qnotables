"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { isAdminEmail } from "@/lib/admin"
import { generateThreadSlug, normalizeDeskSlug } from "@/lib/forum-utils"
import { isValidUrl } from "@/lib/rss-utils"

export type RssImportResult = {
  success: boolean
  error?: string
  duplicate?: boolean
  threadId?: string
  slug?: string | null
}

function clean(value: FormDataEntryValue | null, maxLength: number): string {
  return String(value ?? "").trim().slice(0, maxLength)
}

export async function importRssToTownHall(formData: FormData): Promise<RssImportResult> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user || !isAdminEmail(user.email)) {
    return { success: false, error: "Admin access is required." }
  }

  const title = clean(formData.get("title"), 300)
  const content = clean(formData.get("content"), 100_000)
  const sourceUrl = clean(formData.get("source_url"), 2_000)
  const sourceName = clean(formData.get("source_name"), 160) || "RSS source"
  const author = clean(formData.get("author"), 160) || sourceName
  const publishedAt = clean(formData.get("published_at"), 80)
  const imageUrl = clean(formData.get("image_url"), 2_000)
  const category = clean(formData.get("category"), 80) || "Other"
  const tags = clean(formData.get("tags"), 1_000)

  if (title.length < 4 || content.length < 4) {
    return { success: false, error: "The imported story needs a title and content." }
  }
  if (!isValidUrl(sourceUrl)) {
    return { success: false, error: "The imported story needs a valid source link." }
  }
  if (imageUrl && !isValidUrl(imageUrl)) {
    return { success: false, error: "The imported image link is invalid." }
  }

  const existing = await supabase
    .from("forum_threads")
    .select("id, slug")
    .eq("source_url", sourceUrl)
    .maybeSingle()

  if (existing.error) return { success: false, error: existing.error.message }
  if (existing.data) {
    return {
      success: false,
      duplicate: true,
      threadId: existing.data.id,
      slug: existing.data.slug,
      error: "This source has already been imported to Town Hall.",
    }
  }

  const now = new Date().toISOString()
  const sourceLine = `Source: [${sourceName}](${sourceUrl})`
  const metadata = [
    `Author: ${author}`,
    publishedAt ? `Published: ${publishedAt}` : null,
    `Category: ${category}`,
    tags ? `Tags: ${tags}` : null,
  ].filter(Boolean).join("\n")
  const body = [imageUrl ? `![${title}](${imageUrl})` : null, content, sourceLine, metadata]
    .filter(Boolean)
    .join("\n\n")
  const slug = generateThreadSlug(title, crypto.randomUUID())

  const { data, error } = await supabase
    .from("forum_threads")
    .insert({
      title,
      body,
      excerpt: content.slice(0, 240),
      slug,
      author_id: user.id,
      category,
      desk: normalizeDeskSlug(category),
      tags: tags || null,
      source_url: sourceUrl,
      status: "published",
      is_pending: true,
      content_format: "markdown",
      content_version: 1,
      last_activity_at: now,
      updated_at: now,
      published_at: publishedAt || now,
    })
    .select("id, slug")
    .single()

  if (error) {
    if (error.code === "23505") {
      const duplicate = await supabase
        .from("forum_threads")
        .select("id, slug")
        .eq("source_url", sourceUrl)
        .maybeSingle()
      return {
        success: false,
        duplicate: true,
        threadId: duplicate.data?.id,
        slug: duplicate.data?.slug,
        error: "This source has already been imported to Town Hall.",
      }
    }
    return { success: false, error: error.message }
  }

  revalidatePath("/dashboard/moderation")
  revalidatePath("/forum")
  return { success: true, threadId: data.id, slug: data.slug }
}

export async function getAdminImportAccess(): Promise<boolean> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  return Boolean(user && isAdminEmail(user.email))
}

