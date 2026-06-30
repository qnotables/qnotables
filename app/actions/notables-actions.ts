"use server"

import { createClient } from "@supabase/supabase-js"
import { revalidatePath } from "next/cache"
import { validateDashboardAccess } from "@/lib/dashboard-auth"
import { runNotablesScrape } from "@/lib/notables/ingest"
import type { NotablesFilters } from "@/lib/notables/types"

// Shape returned from blog_posts for the notables feed
export type NotablesPost = {
  id: string
  slug: string | null
  title: string
  excerpt: string | null
  body: string | null
  tag: string | null
  post_type: string | null
  status: string | null
  source_url: string | null
  source_name: string | null
  published_at: string | null
  imported_at: string | null
  created_at: string
}

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error("Supabase not configured")
  return createClient(url, key)
}

// ── Public: Fetch notables with filters & pagination ─────────────────────────

export async function getNotables(filters: NotablesFilters = {}): Promise<{
  items: NotablesPost[]
  total: number
}> {
  const supabase = getSupabase()
  const { search, tag, dateFrom, dateTo, page = 1, pageSize = 20 } = filters
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  let query = supabase
    .from("blog_posts")
    .select("id, slug, title, excerpt, body, tag, post_type, status, source_url, source_name, published_at, imported_at, created_at", { count: "exact" })
    .eq("source_name", "Qnotables")
    .order("published_at", { ascending: false, nullsFirst: false })
    .range(from, to)

  if (tag && tag !== "all") {
    query = query.eq("tag", tag)
  }

  if (dateFrom) {
    query = query.gte("published_at", new Date(dateFrom).toISOString())
  }
  if (dateTo) {
    const end = new Date(dateTo)
    end.setDate(end.getDate() + 1)
    query = query.lt("published_at", end.toISOString())
  }

  if (search && search.trim()) {
    query = query.or(`title.ilike.%${search.trim()}%,excerpt.ilike.%${search.trim()}%,body.ilike.%${search.trim()}%`)
  }

  const { data, error, count } = await query

  if (error) throw new Error(`Failed to fetch notables: ${error.message}`)

  return {
    items: (data ?? []) as NotablesPost[],
    total: count ?? 0,
  }
}

// ── Public: Get distinct tags for filter dropdown ─────────────────────────────

export async function getNotablesBoards(): Promise<string[]> {
  const supabase = getSupabase()
  const { data, error } = await supabase
    .from("blog_posts")
    .select("tag")
    .eq("source_name", "Qnotables")
    .not("tag", "is", null)

  if (error) return []

  const tags = [...new Set((data ?? []).map((r: { tag: string }) => r.tag))]
  return tags.filter(Boolean)
}

// ── Admin: Trigger a manual notables scrape ───────────────────────────────────

export async function triggerNotablesScrape(): Promise<{
  success: boolean
  newItems: number
  skippedDupes: number
  errors: string[]
  message: string
}> {
  const ok = await validateDashboardAccess()
  if (!ok) {
    return { success: false, newItems: 0, skippedDupes: 0, errors: ["Unauthorized"], message: "Unauthorized" }
  }

  try {
    const result = await runNotablesScrape("manual")
    revalidatePath("/notables")
    revalidatePath("/dashboard/scraper")

    return {
      success: true,
      newItems: result.newItems,
      skippedDupes: result.skippedDupes,
      errors: result.errors,
      message: `Notables scrape complete. ${result.newItems} new item(s), ${result.skippedDupes} duplicate(s) skipped.`,
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return { success: false, newItems: 0, skippedDupes: 0, errors: [msg], message: msg }
  }
}
