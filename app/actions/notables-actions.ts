"use server"

import { createClient } from "@supabase/supabase-js"
import { revalidatePath } from "next/cache"
import { validateDashboardAccess } from "@/lib/dashboard-auth"
import { runNotablesScrape } from "@/lib/notables/ingest"
import type { NotablesFilters } from "@/lib/notables/types"

// Shape returned from the notables table for the notables feed
export type NotablesPost = {
  id: string
  title: string
  body: string | null
  raw_text: string | null
  source: string | null        // e.g. "8kun-rss"
  board: string | null         // e.g. "qresearch"
  thread_url: string | null    // used as source_url
  post_number: string | null
  links: string[]
  media: string[]              // image/video URLs — used as cover image
  created_at_source: string | null
  scraped_at: string
  hash_unique: string
  // mapped aliases used by NotablesCard
  cover_image: string | null
  og_image_url: string | null
  excerpt: string | null
  tag: string | null
  source_url: string | null
  published_at: string | null
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
    .from("notables")
    .select("id, title, body, raw_text, source, board, thread_url, post_number, links, media, created_at_source, scraped_at, hash_unique", { count: "exact" })
    .order("scraped_at", { ascending: false })
    .range(from, to)

  if (tag && tag !== "all") {
    query = query.eq("board", tag)
  }

  if (dateFrom) {
    query = query.gte("scraped_at", new Date(dateFrom).toISOString())
  }
  if (dateTo) {
    const end = new Date(dateTo)
    end.setDate(end.getDate() + 1)
    query = query.lt("scraped_at", end.toISOString())
  }

  if (search && search.trim()) {
    query = query.or(`title.ilike.%${search.trim()}%,body.ilike.%${search.trim()}%,raw_text.ilike.%${search.trim()}%`)
  }

  const { data, error, count } = await query

  if (error) throw new Error(`Failed to fetch notables: ${error.message}`)

  // Map notables table columns to what NotablesCard expects
  const items: NotablesPost[] = (data ?? []).map((row: Record<string, unknown>) => {
    const media = Array.isArray(row.media) ? row.media as string[] : []
    const links = Array.isArray(row.links) ? row.links as string[] : []
    const firstImage = media.find((m) => /\.(jpg|jpeg|png|gif|webp)(\?.*)?$/i.test(m)) ?? null
    return {
      id: row.id as string,
      title: row.title as string,
      body: row.body as string | null,
      raw_text: row.raw_text as string | null,
      source: row.source as string | null,
      board: row.board as string | null,
      thread_url: row.thread_url as string | null,
      post_number: row.post_number as string | null,
      links,
      media,
      created_at_source: row.created_at_source as string | null,
      scraped_at: row.scraped_at as string,
      hash_unique: row.hash_unique as string,
      // aliases for NotablesCard
      cover_image: firstImage,
      og_image_url: null,
      excerpt: row.raw_text ? (row.raw_text as string).slice(0, 300) : null,
      tag: row.board as string | null,
      source_url: row.thread_url as string | null,
      published_at: (row.created_at_source as string | null) ?? (row.scraped_at as string),
      created_at: row.scraped_at as string,
    }
  })

  return { items, total: count ?? 0 }
}

// ── Public: Get distinct tags for filter dropdown ─────────────────────────────

export async function getNotablesBoards(): Promise<string[]> {
  const supabase = getSupabase()
  const { data, error } = await supabase
    .from("notables")
    .select("board")
    .not("board", "is", null)

  if (error) return []

  const boards = [...new Set((data ?? []).map((r: { board: string }) => r.board))]
  return boards.filter(Boolean)
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
