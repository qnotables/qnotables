"use server"

import { createClient } from "@supabase/supabase-js"
import { revalidatePath } from "next/cache"
import { validateDashboardAccess } from "@/lib/dashboard-auth"
import { runNotablesScrape } from "@/lib/notables/ingest"
import type { NotablesRecord, NotablesFilters } from "@/lib/notables/types"

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error("Supabase not configured")
  return createClient(url, key)
}

// ── Public: Fetch notables with filters & pagination ─────────────────────────

export async function getNotables(filters: NotablesFilters = {}): Promise<{
  items: NotablesRecord[]
  total: number
}> {
  const supabase = getSupabase()
  const { search, board, dateFrom, dateTo, page = 1, pageSize = 20 } = filters
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  let query = supabase
    .from("notables")
    .select("*", { count: "exact" })
    .order("scraped_at", { ascending: false })
    .range(from, to)

  if (board && board !== "all") {
    query = query.eq("board", board)
  }

  if (dateFrom) {
    query = query.gte("scraped_at", new Date(dateFrom).toISOString())
  }
  if (dateTo) {
    // include the full end day
    const end = new Date(dateTo)
    end.setDate(end.getDate() + 1)
    query = query.lt("scraped_at", end.toISOString())
  }

  if (search && search.trim()) {
    // Text search on title and body
    query = query.or(`title.ilike.%${search.trim()}%,body.ilike.%${search.trim()}%`)
  }

  const { data, error, count } = await query

  if (error) throw new Error(`Failed to fetch notables: ${error.message}`)

  return {
    items: (data ?? []) as NotablesRecord[],
    total: count ?? 0,
  }
}

// ── Public: Get distinct boards for filter dropdown ───────────────────────────

export async function getNotablesBoards(): Promise<string[]> {
  const supabase = getSupabase()
  const { data, error } = await supabase
    .from("notables")
    .select("board")
    .order("board")

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
