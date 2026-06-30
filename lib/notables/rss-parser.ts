/**
 * Notables RSS parser.
 *
 * Attempts to parse the 8kun/QResearch tripcode RSS feeds.
 * These are public XML feeds — no authentication required.
 *
 * Primary feeds:
 *   https://8ch.net/qresearch/tripcode.xml
 *   https://8ch.net/qnotables/tripcode.xml
 */

import Parser from "rss-parser"
import { NOTABLES_FETCH_HEADERS, isAllowedByRobots } from "./robots"
import type { NotablesRecord } from "./types"
import { buildHash } from "./dedup"

interface RssItem {
  title?: string
  link?: string
  guid?: string
  isoDate?: string
  pubDate?: string
  content?: string
  contentSnippet?: string
  "content:encoded"?: string
  description?: string
  summary?: string
}

const rssParser = new Parser<Record<string, unknown>, RssItem>({
  requestOptions: { headers: NOTABLES_FETCH_HEADERS },
})

/** Extract post number from a 8kun URL like .../res/THREAD.html#POST  */
function extractPostNumber(url: string): string | null {
  const match = url.match(/#(\d+)$/)
  return match ? match[1] : null
}

/** Extract board name from a 8kun URL */
function extractBoard(url: string): string {
  try {
    const path = new URL(url).pathname // e.g. /qresearch/res/12345.html
    const parts = path.split("/").filter(Boolean)
    return parts[0] ?? "unknown"
  } catch {
    return "unknown"
  }
}

/** Strip HTML tags from a string */
function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim()
}

/** Extract >>post references from raw text */
function extractPostRefs(text: string): string[] {
  const matches = text.match(/>>(\d{6,})/g)
  return matches ? [...new Set(matches)] : []
}

/** Extract external http(s) links from raw text */
function extractLinks(text: string): string[] {
  const matches = text.match(/https?:\/\/[^\s"'<>]+/g)
  return matches ? [...new Set(matches)] : []
}

/** Extract image/video URLs from raw text/HTML */
function extractMedia(text: string): string[] {
  const imgMatches = text.match(/src=["']([^"']+\.(jpg|jpeg|png|gif|webp|mp4|mov|webm)["'])/gi) ?? []
  const cleaned = imgMatches.map((m) => {
    const match = m.match(/src=["']([^"']+)["']/i)
    return match ? match[1] : null
  }).filter((u): u is string => u !== null)
  return [...new Set(cleaned)]
}

export interface NotablesRssResult {
  items: Omit<NotablesRecord, "id">[]
  error?: string
}

export async function parseNotablesRss(feedUrl: string, sourceName: string): Promise<NotablesRssResult> {
  const allowed = await isAllowedByRobots(feedUrl)
  if (!allowed) {
    return { items: [], error: `robots.txt disallows scraping ${feedUrl}` }
  }

  let feed: Awaited<ReturnType<typeof rssParser.parseURL>>
  try {
    feed = await rssParser.parseURL(feedUrl)
  } catch (err) {
    return {
      items: [],
      error: `RSS fetch failed for ${feedUrl}: ${err instanceof Error ? err.message : String(err)}`,
    }
  }

  const now = new Date().toISOString()
  const items: Omit<NotablesRecord, "id">[] = []

  for (const item of feed.items ?? []) {
    const url = item.link ?? item.guid
    if (!url) continue

    const board = extractBoard(url)
    const postNumber = extractPostNumber(url)
    const title = (item.title ?? "Untitled").trim()

    const rawContent = [
      item["content:encoded"],
      item.content,
      item.description,
      item.summary,
    ].find((c): c is string => typeof c === "string" && c.length > 0) ?? ""

    const rawText = stripHtml(rawContent) || item.contentSnippet?.trim() || null
    const body = rawText ? rawText.slice(0, 2000) : null

    const allRefs = extractPostRefs(rawContent)
    const allLinks = extractLinks(rawContent)
    const allMedia = extractMedia(rawContent)
    const links = [...new Set([...allRefs, ...allLinks])]

    const hashUnique = buildHash(board, postNumber, title)

    items.push({
      source: sourceName,
      board,
      thread_url: url.split("#")[0], // base thread URL without anchor
      post_number: postNumber,
      title,
      body,
      links,
      media: allMedia,
      raw_text: rawContent ? rawContent.slice(0, 5000) : null,
      created_at_source: item.isoDate ?? item.pubDate ?? null,
      scraped_at: now,
      hash_unique: hashUnique,
    })
  }

  return { items }
}
