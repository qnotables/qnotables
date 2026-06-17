"use server"

import { createAdminClient } from "@/lib/supabase/admin"
import { createClient } from "@/lib/supabase/server"
import { isAdminEmail } from "@/lib/admin"
import { generateSlug } from "@/lib/import-utils"
import type { ImportedPost } from "@/lib/import-parsers"
import type { WixPreviewRow, WixParseOptions } from "@/lib/wix-parser"
import { parseWixRss, parseWixJson } from "@/lib/wix-parser"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface WixImportOptions {
  defaultCategory: string
  defaultPostType: string
  defaultStatus: "draft" | "published"
  includeInRss: boolean
}

export interface WixImportResult {
  success: number
  failed: number
  errors: Array<{ index: number; title?: string; error: string }>
  createdIds: string[]
}

export interface WixFetchResult {
  ok: boolean
  xml?: string
  error?: string
}

// ---------------------------------------------------------------------------
// Fetch RSS feed from URL (called from server action)
// ---------------------------------------------------------------------------

export async function fetchWixRssFeed(url: string): Promise<WixFetchResult> {
  try {
    // Validate URL
    const parsed = new URL(url)
    if (!["http:", "https:"].includes(parsed.protocol)) {
      return { ok: false, error: "Only http/https URLs are supported." }
    }

    const res = await fetch(url, {
      headers: { "User-Agent": "HOT AND FRESH RSS Importer/1.0" },
      next: { revalidate: 0 },
    })

    if (!res.ok) {
      return { ok: false, error: `HTTP ${res.status}: ${res.statusText}` }
    }

    const xml = await res.text()
    if (!xml.includes("<item>") && !xml.includes("<entry>")) {
      return { ok: false, error: "The URL does not appear to be a valid RSS/XML feed." }
    }

    return { ok: true, xml }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed to fetch feed." }
  }
}

// ---------------------------------------------------------------------------
// Parse preview rows from RSS XML (server-side, returns serialisable data)
// ---------------------------------------------------------------------------

export async function previewWixRss(
  xml: string,
  opts: WixImportOptions,
  existingSlugs: string[],
): Promise<{ rows: WixPreviewRow[]; error?: string }> {
  try {
    const rows = parseWixRss(xml, {
      defaultCategory: opts.defaultCategory,
      defaultPostType: opts.defaultPostType,
      defaultStatus: opts.defaultStatus,
      existingSlugs: new Set(existingSlugs),
    })
    return { rows }
  } catch (e) {
    return { rows: [], error: e instanceof Error ? e.message : "Failed to parse RSS." }
  }
}

// ---------------------------------------------------------------------------
// Parse preview rows from JSON text
// ---------------------------------------------------------------------------

export async function previewWixJson(
  json: string,
  opts: WixImportOptions,
  existingSlugs: string[],
): Promise<{ rows: WixPreviewRow[]; error?: string }> {
  try {
    const rows = parseWixJson(json, {
      defaultCategory: opts.defaultCategory,
      defaultPostType: opts.defaultPostType,
      defaultStatus: opts.defaultStatus,
      existingSlugs: new Set(existingSlugs),
    })
    return { rows }
  } catch (e) {
    return { rows: [], error: e instanceof Error ? e.message : "Failed to parse JSON." }
  }
}

// ---------------------------------------------------------------------------
// Get existing slugs (for dupe detection)
// ---------------------------------------------------------------------------

export async function getExistingSlugs(): Promise<string[]> {
  const admin = createAdminClient()
  const { data } = await admin.from("blog_posts").select("slug")
  return (data ?? []).map((r: any) => r.slug as string)
}

// ---------------------------------------------------------------------------
// Run the final import
// ---------------------------------------------------------------------------

export async function runWixImport(
  rows: WixPreviewRow[],
  opts: WixImportOptions,
): Promise<WixImportResult> {
  // Auth guard
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) throw new Error("Not authenticated")
  if (!isAdminEmail(user.email)) throw new Error("Unauthorized: admin only")

  const admin = createAdminClient()
  const importedAt = new Date().toISOString()
  const errors: Array<{ index: number; title?: string; error: string }> = []
  const createdIds: string[] = []

  for (const row of rows) {
    const post = row.post
    try {
      // Re-deduplicate slug against what's already been inserted this run
      const { data: existing } = await admin
        .from("blog_posts")
        .select("id")
        .eq("slug", row.slug)
        .maybeSingle()

      let slug = row.slug
      if (existing) {
        let counter = 2
        while (true) {
          const candidate = `${generateSlug(post.title)}-${counter}`
          const { data: dup } = await admin
            .from("blog_posts")
            .select("id")
            .eq("slug", candidate)
            .maybeSingle()
          if (!dup) { slug = candidate; break }
          counter++
        }
      }

      const publishedAt = post.published_at ? post.published_at.toISOString() : null
      const originalCreatedAt = post.original_created_at
        ? post.original_created_at.toISOString()
        : publishedAt

      const record: Record<string, any> = {
        title: post.title,
        slug,
        excerpt: post.excerpt ?? "",
        body: post.body,
        category: post.category ?? opts.defaultCategory,
        post_type: post.post_type ?? opts.defaultPostType,
        status: opts.defaultStatus,
        featured: false,
        published: opts.defaultStatus === "published",
        published_at: publishedAt,
        original_created_at: originalCreatedAt,
        imported_at: importedAt,
        source_url: post.source_url ?? null,
        source_name: post.source_name ?? "Wix Blog Archive",
        original_source_url: post.original_source_url ?? post.source_url ?? null,
        cover_image: post.cover_image_url ?? null,
        author_name: post.author_name ?? "HOT AND FRESH",
        read_minutes: Math.max(1, Math.ceil((post.body ?? "").split(/\s+/).length / 200)),
        include_in_rss: opts.includeInRss && opts.defaultStatus === "published",
        created_at: importedAt,
        updated_at: importedAt,
      }

      const { data: inserted, error: insertError } = await admin
        .from("blog_posts")
        .insert(record)
        .select("id")
        .single()

      if (insertError) {
        errors.push({ index: row.index, title: post.title, error: insertError.message })
      } else {
        createdIds.push(inserted.id)
      }
    } catch (e) {
      errors.push({
        index: row.index,
        title: post.title,
        error: e instanceof Error ? e.message : "Unknown error",
      })
    }
  }

  return {
    success: createdIds.length,
    failed: errors.length,
    errors,
    createdIds,
  }
}
