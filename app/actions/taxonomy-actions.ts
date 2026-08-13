"use server"

import { createClient } from "@supabase/supabase-js"
import {
  DESKS,
  CONTENT_TYPES,
  type Desk,
  type ContentType,
  parseLegacyCategory,
  validateDesk,
  validateContentType,
} from "@/lib/taxonomy"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface TaxonomyPreviewRow {
  id: string
  title: string
  excerpt: string
  legacyCategory: string | null
  suggestedDesk: Desk
  suggestedContentType: ContentType
  suggestedTags: string[]
  confidence: number
  requiresReview: boolean
  currentDesk: string | null
  currentContentType: string | null
  currentTags: string[]
  taxonomyReviewed: boolean
  wouldChange: boolean
}

export interface TaxonomyApplyInput {
  id: string
  desk: Desk
  contentType: ContentType
  tags: string[]
  reviewedBy?: string
}

export interface TaxonomyApplyResult {
  updated: number
  skipped: number
  errors: string[]
}

export interface TaxonomyStats {
  totalPosts: number
  withDesk: number
  withContentType: number
  reviewed: number
  needsReview: number
  deskBreakdown: { desk: string; count: number }[]
  contentTypeBreakdown: { contentType: string; count: number }[]
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function getSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error("Supabase environment variables are not configured")
  return createClient(url, key)
}

// ---------------------------------------------------------------------------
// Preview — parse every post's legacy_category/category into the new taxonomy
// WITHOUT writing anything. Safe to call repeatedly.
// ---------------------------------------------------------------------------

export async function previewTaxonomy(options: {
  /** Only rows missing desk or content_type */
  missingOnly?: boolean
  /** Only rows where taxonomy_reviewed is false */
  unreviewedOnly?: boolean
  /** Filter by specific legacy category value */
  legacyCategory?: string
  /** Filter by suggested desk */
  suggestedDesk?: Desk
  limit?: number
  offset?: number
}): Promise<{ rows: TaxonomyPreviewRow[]; total: number }> {
  const supabase = getSupabaseClient()
  const pageSize = Math.min(options.limit ?? 100, 500)

  let query = supabase
    .from("blog_posts")
    .select(
      "id, title, excerpt, category, legacy_category, desk, content_type, tags, taxonomy_reviewed",
      { count: "exact" }
    )
    .in("status", ["published", "draft"])
    .order("created_at", { ascending: false })

  if (options.legacyCategory) {
    query = query.eq("category", options.legacyCategory)
  }

  if (options.unreviewedOnly) {
    query = query.or("taxonomy_reviewed.is.null,taxonomy_reviewed.eq.false")
  }

  if (options.missingOnly) {
    query = query.or("desk.is.null,content_type.is.null")
  }

  if (options.suggestedDesk) {
    // Can't pre-filter on a derived value — we post-filter below
  }

  const { data, error, count } = await query.range(
    options.offset ?? 0,
    (options.offset ?? 0) + pageSize - 1
  )

  if (error) throw new Error(`Failed to fetch posts: ${error.message}`)

  const rows: TaxonomyPreviewRow[] = []

  for (const row of data ?? []) {
    const rawLegacy = (row.legacy_category ?? row.category ?? "") as string
    const parsed = parseLegacyCategory(rawLegacy)

    const currentDesk = (row.desk as string | null) ?? null
    const currentContentType = (row.content_type as string | null) ?? null
    const currentTags: string[] = Array.isArray(row.tags) ? (row.tags as string[]) : []
    const taxonomyReviewed = Boolean(row.taxonomy_reviewed)

    const suggestedDesk = parsed.desk
    const suggestedContentType = parsed.contentType
    const suggestedTags = parsed.tags

    // Post-filter for suggestedDesk if requested
    if (options.suggestedDesk && suggestedDesk !== options.suggestedDesk) continue

    const wouldChange =
      currentDesk !== suggestedDesk ||
      currentContentType !== suggestedContentType ||
      JSON.stringify([...currentTags].sort()) !== JSON.stringify([...suggestedTags].sort())

    rows.push({
      id: row.id as string,
      title: (row.title as string) ?? "(untitled)",
      excerpt: (row.excerpt as string) ?? "",
      legacyCategory: rawLegacy || null,
      suggestedDesk,
      suggestedContentType,
      suggestedTags,
      confidence: parsed.confidence,
      requiresReview: parsed.requiresReview,
      currentDesk,
      currentContentType,
      currentTags,
      taxonomyReviewed,
      wouldChange,
    })
  }

  return { rows, total: count ?? 0 }
}

// ---------------------------------------------------------------------------
// Apply — write taxonomy fields for the given rows. Never overwrites a row
// where taxonomy_reviewed = true unless allowOverwriteReviewed is set.
// ---------------------------------------------------------------------------

export async function applyTaxonomy(
  rows: TaxonomyApplyInput[],
  options: {
    allowOverwriteReviewed?: boolean
    reviewedBy?: string
  } = {}
): Promise<TaxonomyApplyResult> {
  if (rows.length === 0) return { updated: 0, skipped: 0, errors: [] }

  const supabase = getSupabaseClient()
  const ids = rows.map((r) => r.id)

  // Fetch current reviewed status
  const { data: existing, error: fetchError } = await supabase
    .from("blog_posts")
    .select("id, taxonomy_reviewed")
    .in("id", ids)

  if (fetchError) throw new Error(`Failed to fetch rows: ${fetchError.message}`)

  const reviewedSet = new Set(
    (existing ?? [])
      .filter((r) => r.taxonomy_reviewed === true)
      .map((r) => r.id as string)
  )

  const now = new Date().toISOString()
  let updated = 0
  let skipped = 0
  const errors: string[] = []

  for (const input of rows) {
    try {
      // Guard: don't overwrite reviewed rows unless explicitly allowed
      if (reviewedSet.has(input.id) && !options.allowOverwriteReviewed) {
        skipped++
        continue
      }

      // Validate values against allowlists before writing
      if (validateDesk(input.desk) !== input.desk) {
        errors.push(`Row ${input.id}: invalid desk "${input.desk}"`)
        continue
      }
      if (validateContentType(input.contentType) !== input.contentType) {
        errors.push(`Row ${input.id}: invalid content_type "${input.contentType}"`)
        continue
      }

      const { error: updateError } = await supabase
        .from("blog_posts")
        .update({
          desk: input.desk,
          content_type: input.contentType,
          tags: input.tags,
          taxonomy_reviewed: true,
          taxonomy_updated_at: now,
          taxonomy_updated_by: options.reviewedBy ?? input.reviewedBy ?? "admin",
          updated_at: now,
        })
        .eq("id", input.id)

      if (updateError) {
        errors.push(`Row ${input.id}: ${updateError.message}`)
      } else {
        updated++
      }
    } catch (err) {
      errors.push(
        `Row ${input.id}: ${err instanceof Error ? err.message : String(err)}`
      )
    }
  }

  return { updated, skipped, errors }
}

// ---------------------------------------------------------------------------
// Single-row manual override — used by the editor's inline controls
// ---------------------------------------------------------------------------

export async function setTaxonomyForPost(
  id: string,
  desk: Desk,
  contentType: ContentType,
  tags: string[],
  reviewedBy = "admin"
): Promise<{ ok: boolean; error?: string }> {
  if (!isValidDesk(desk)) return { ok: false, error: `Invalid desk: ${desk}` }
  if (!isValidContentType(contentType))
    return { ok: false, error: `Invalid content_type: ${contentType}` }

  const supabase = getSupabaseClient()
  const now = new Date().toISOString()

  const { error } = await supabase
    .from("blog_posts")
    .update({
      desk,
      content_type: contentType,
      tags,
      taxonomy_reviewed: true,
      taxonomy_updated_at: now,
      taxonomy_updated_by: reviewedBy,
      updated_at: now,
    })
    .eq("id", id)

  if (error) return { ok: false, error: error.message }
  return { ok: true }
}

// ---------------------------------------------------------------------------
// Rollback — restores desk/content_type/tags to null and copies legacy_category
// back into category. Clears taxonomy_reviewed.
// ---------------------------------------------------------------------------

export async function rollbackTaxonomy(ids: string[]): Promise<TaxonomyApplyResult> {
  if (ids.length === 0) return { updated: 0, skipped: 0, errors: [] }

  const supabase = getSupabaseClient()
  const now = new Date().toISOString()

  // Fetch legacy_category for each row
  const { data, error: fetchError } = await supabase
    .from("blog_posts")
    .select("id, legacy_category")
    .in("id", ids)

  if (fetchError) throw new Error(`Fetch failed: ${fetchError.message}`)

  let updated = 0
  let skipped = 0
  const errors: string[] = []

  for (const row of data ?? []) {
    try {
      const { error: updateError } = await supabase
        .from("blog_posts")
        .update({
          desk: null,
          content_type: null,
          tags: [],
          taxonomy_reviewed: false,
          taxonomy_updated_at: now,
          taxonomy_updated_by: "rollback",
          // Restore category from legacy snapshot
          ...(row.legacy_category
            ? { category: row.legacy_category }
            : {}),
          updated_at: now,
        })
        .eq("id", row.id)

      if (updateError) {
        errors.push(`Row ${row.id}: ${updateError.message}`)
      } else {
        updated++
      }
    } catch (err) {
      errors.push(`Row ${row.id}: ${err instanceof Error ? err.message : String(err)}`)
    }
  }

  return { updated, skipped, errors }
}

// ---------------------------------------------------------------------------
// Stats — summary counts for the stats banner
// ---------------------------------------------------------------------------

export async function getTaxonomyStats(): Promise<TaxonomyStats> {
  const supabase = getSupabaseClient()

  const { data, error } = await supabase
    .from("blog_posts")
    .select("desk, content_type, taxonomy_reviewed")
    .in("status", ["published", "draft"])

  if (error) throw new Error(`Failed to fetch stats: ${error.message}`)

  const rows = data ?? []
  const totalPosts = rows.length
  const withDesk = rows.filter((r) => r.desk).length
  const withContentType = rows.filter((r) => r.content_type).length
  const reviewed = rows.filter((r) => r.taxonomy_reviewed === true).length
  const needsReview = totalPosts - reviewed

  const deskCounts = new Map<string, number>()
  const ctCounts = new Map<string, number>()

  for (const row of rows) {
    if (row.desk) deskCounts.set(row.desk, (deskCounts.get(row.desk) ?? 0) + 1)
    if (row.content_type) ctCounts.set(row.content_type, (ctCounts.get(row.content_type) ?? 0) + 1)
  }

  const deskBreakdown = Array.from(deskCounts.entries())
    .map(([desk, count]) => ({ desk, count }))
    .sort((a, b) => b.count - a.count)

  const contentTypeBreakdown = Array.from(ctCounts.entries())
    .map(([contentType, count]) => ({ contentType, count }))
    .sort((a, b) => b.count - a.count)

  return {
    totalPosts,
    withDesk,
    withContentType,
    reviewed,
    needsReview,
    deskBreakdown,
    contentTypeBreakdown,
  }
}

// ---------------------------------------------------------------------------
// Desk/content-type distribution — for filter dropdowns
// ---------------------------------------------------------------------------

export async function getLegacyCategoryList(): Promise<string[]> {
  const supabase = getSupabaseClient()

  const { data, error } = await supabase
    .from("blog_posts")
    .select("category")
    .in("status", ["published", "draft"])
    .not("category", "is", null)

  if (error) throw new Error(`Failed to fetch categories: ${error.message}`)

  const unique = [...new Set((data ?? []).map((r) => r.category as string).filter(Boolean))]
  return unique.sort()
}
