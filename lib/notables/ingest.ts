/**
 * Notables ingest engine.
 *
 * Orchestrates:
 *   1. RSS fetch from primary 8kun feeds.
 *   2. HTML fallback if RSS yields 0 items.
 *   3. Deduplication against the notables table.
 *   4. Insertion of new records.
 *   5. Returns a structured result summary.
 */

import { createClient } from "@supabase/supabase-js"
import { parseNotablesRss } from "./rss-parser"
import { parseNotablesHtml } from "./html-parser"
import { getExistingHashes } from "./dedup"
import type { NotablesRecord, NotablesScrapeResult } from "./types"

// ─── Source configuration ─────────────────────────────────────────────────────

const RSS_SOURCES = [
  { url: "https://8kun.top/qresearch/tripcode.xml", name: "8kun-rss-qresearch", board: "qresearch" },
  { url: "https://8kun.top/qnotables/tripcode.xml", name: "8kun-rss-qnotables", board: "qnotables" },
]

// Points to the notables catalog thread index on 8kun
const HTML_FALLBACK_URL = "https://8kun.top/qresearch/catalog.html"

// ─── Supabase ─────────────────────────────────────────────────────────────────

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error("Supabase not configured")
  return createClient(url, key)
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function insertNewNotables(
  candidates: Omit<NotablesRecord, "id">[],
): Promise<{ newItems: number; skippedDupes: number; errors: string[] }> {
  if (candidates.length === 0) return { newItems: 0, skippedDupes: 0, errors: [] }

  const errors: string[] = []
  const hashes = candidates.map((c) => c.hash_unique)
  const existing = await getExistingHashes(hashes)

  const fresh = candidates.filter((c) => !existing.has(c.hash_unique))
  const skippedDupes = candidates.length - fresh.length

  if (fresh.length === 0) return { newItems: 0, skippedDupes, errors }

  const supabase = getSupabase()

  // Insert in batches of 50 to stay within Supabase payload limits
  const BATCH = 50
  let inserted = 0

  for (let i = 0; i < fresh.length; i += BATCH) {
    const batch = fresh.slice(i, i + BATCH)
    const { error } = await supabase.from("notables").insert(batch)
    if (error) {
      // A unique constraint violation (code 23505) means a race condition dupe — skip
      if (error.code !== "23505") {
        errors.push(`Insert batch error: ${error.message}`)
      }
    } else {
      inserted += batch.length
    }
  }

  return { newItems: inserted, skippedDupes, errors }
}

// ─── Main entry point ─────────────────────────────────────────────────────────

export async function runNotablesScrape(
  triggeredBy: "cron" | "manual" = "cron",
): Promise<NotablesScrapeResult> {
  const startedAt = new Date().toISOString()
  const allErrors: string[] = []
  let allItems: Omit<NotablesRecord, "id">[] = []

  // 1. Try RSS sources
  for (const src of RSS_SOURCES) {
    const result = await parseNotablesRss(src.url, src.name)
    if (result.error) {
      allErrors.push(`[RSS:${src.name}] ${result.error}`)
      console.warn(`[notables-scraper] RSS error for ${src.name}:`, result.error)
    }
    allItems = allItems.concat(result.items)
  }

  // 2. HTML fallback if RSS returned nothing
  if (allItems.length === 0) {
    console.info("[notables-scraper] RSS returned 0 items — falling back to HTML parse")
    const fallback = await parseNotablesHtml(HTML_FALLBACK_URL)
    if (fallback.error) {
      allErrors.push(`[HTML fallback] ${fallback.error}`)
      console.warn("[notables-scraper] HTML fallback error:", fallback.error)
    }
    allItems = allItems.concat(fallback.items)
  }

  // 3. Dedup + insert
  const { newItems, skippedDupes, errors: insertErrors } = await insertNewNotables(allItems)
  allErrors.push(...insertErrors)

  const finishedAt = new Date().toISOString()

  console.info(
    `[notables-scraper] Done (${triggeredBy}): ${newItems} new, ${skippedDupes} dupes, ${allErrors.length} error(s)`,
  )

  return {
    startedAt,
    finishedAt,
    triggeredBy,
    newItems,
    skippedDupes,
    errors: allErrors,
  }
}
