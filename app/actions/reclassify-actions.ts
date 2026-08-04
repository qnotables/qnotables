"use server"

import { createClient } from "@supabase/supabase-js"
import { classifyStory, validateCategory } from "@/lib/classifier"
import { categories, type Category } from "@/lib/news-data"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ReclassifyPreviewRow {
  id: string
  title: string
  excerpt: string
  currentCategory: string | null
  suggestedCategory: Category
  confidence: number
  reasoning: string
  /** True when the current category is already a valid allowlisted value */
  currentIsValid: boolean
  /** True when the suggestion differs from the current value */
  wouldChange: boolean
}

export interface ReclassifyApplyResult {
  updated: number
  skipped: number
  errors: string[]
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error("Supabase not configured")
  return createClient(url, key)
}

const VALID_CATEGORIES = new Set<string>(categories)

// ---------------------------------------------------------------------------
// Preview — runs the classifier against every post matching the filter but
// does NOT write anything to the database.
// ---------------------------------------------------------------------------

export async function previewReclassify(options: {
  /** Only include rows whose current category is NOT in the allowlist */
  invalidOnly?: boolean
  /** Restrict to a specific current category value (raw DB string) */
  currentCategory?: string
  /** Page size, default 200 */
  limit?: number
  /** Page offset, default 0 */
  offset?: number
}): Promise<{ rows: ReclassifyPreviewRow[]; totalMatched: number }> {
  const supabase = getSupabaseClient()
  const pageSize = Math.min(options.limit ?? 200, 500)

  // Build base query — only published + draft; skip archived / hidden
  let query = supabase
    .from("blog_posts")
    .select("id, title, excerpt, category", { count: "exact" })
    .in("status", ["published", "draft"])
    .order("created_at", { ascending: false })

  if (options.currentCategory) {
    query = query.eq("category", options.currentCategory)
  }

  const { data, error, count } = await query.range(
    options.offset ?? 0,
    (options.offset ?? 0) + pageSize - 1
  )

  if (error) throw new Error(`Failed to fetch posts: ${error.message}`)

  const rows: ReclassifyPreviewRow[] = []
  for (const row of data ?? []) {
    const currentIsValid = VALID_CATEGORIES.has(row.category ?? "")

    // When invalidOnly is set, skip posts that are already properly categorised
    if (options.invalidOnly && currentIsValid) continue

    const result = classifyStory(row.title ?? "", row.excerpt ?? "")

    rows.push({
      id: row.id,
      title: row.title ?? "(untitled)",
      excerpt: row.excerpt ?? "",
      currentCategory: row.category ?? null,
      suggestedCategory: result.category as Category,
      confidence: result.confidence,
      reasoning: result.reasoning,
      currentIsValid,
      wouldChange: result.category !== row.category,
    })
  }

  return { rows, totalMatched: count ?? 0 }
}

// ---------------------------------------------------------------------------
// Apply — writes only the approved subset. Ignores any row where the
// current category is a valid allowlisted value (manual-category protection)
// unless the caller explicitly sets `allowOverwriteValid = true`.
// ---------------------------------------------------------------------------

export async function applyReclassify(
  approvedIds: string[],
  options: {
    /** Allow overwriting rows that already have a valid category. Default false. */
    allowOverwriteValid?: boolean
  } = {}
): Promise<ReclassifyApplyResult> {
  if (approvedIds.length === 0) return { updated: 0, skipped: 0, errors: [] }

  const supabase = getSupabaseClient()

  // Fetch the current state for approved rows only
  const { data, error } = await supabase
    .from("blog_posts")
    .select("id, title, excerpt, category")
    .in("id", approvedIds)
    .in("status", ["published", "draft"])

  if (error) throw new Error(`Failed to fetch rows: ${error.message}`)

  const now = new Date().toISOString()
  let updated = 0
  let skipped = 0
  const errors: string[] = []

  for (const row of data ?? []) {
    try {
      const currentIsValid = VALID_CATEGORIES.has(row.category ?? "")

      // Skip rows with valid existing categories unless override is set
      if (currentIsValid && !options.allowOverwriteValid) {
        skipped++
        continue
      }

      const result = classifyStory(row.title ?? "", row.excerpt ?? "")

      // Validate the result before writing
      const safeCategory = validateCategory(result.category)

      // Skip if nothing would change
      if (safeCategory === row.category) {
        skipped++
        continue
      }

      const { error: updateError } = await supabase
        .from("blog_posts")
        .update({ category: safeCategory, updated_at: now })
        .eq("id", row.id)

      if (updateError) {
        errors.push(`"${row.title}": ${updateError.message}`)
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
// Category distribution — useful for the stats banner on the page
// ---------------------------------------------------------------------------

export async function getCategoryDistribution(): Promise<
  { category: string | null; count: number }[]
> {
  const supabase = getSupabaseClient()

  const { data, error } = await supabase
    .from("blog_posts")
    .select("category")
    .in("status", ["published", "draft"])

  if (error) throw new Error(`Failed to fetch categories: ${error.message}`)

  const counts = new Map<string, number>()
  for (const row of data ?? []) {
    const cat = row.category ?? "(none)"
    counts.set(cat, (counts.get(cat) ?? 0) + 1)
  }

  return Array.from(counts.entries())
    .map(([category, count]) => ({ category: category === "(none)" ? null : category, count }))
    .sort((a, b) => b.count - a.count)
}
