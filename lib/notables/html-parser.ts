/**
 * Notables HTML fallback parser.
 *
 * Parses the public 8kun QResearch thread HTML to extract notables posts.
 * Only used when RSS provides insufficient data.
 *
 * Target URL pattern:
 *   https://8ch.net/qresearch/res/<threadId>.html
 *
 * This parser:
 *  - Only reads publicly accessible, non-login-gated pages.
 *  - Respects robots.txt via the shared robots utility.
 *  - Sanitizes all scraped HTML before storing.
 *  - Extracts >>post refs, links, and media URLs.
 *  - Does NOT execute or eval any scraped scripts.
 */

import * as cheerio from "cheerio"
import DOMPurify from "isomorphic-dompurify"
import { NOTABLES_FETCH_HEADERS, isAllowedByRobots } from "./robots"
import type { NotablesRecord } from "./types"
import { buildHash } from "./dedup"

const NOTABLES_THREAD_URL = "https://8ch.net/qresearch/res/24671999.html"

function extractPostRefs(text: string): string[] {
  const matches = text.match(/>>(\d{6,})/g)
  return matches ? [...new Set(matches)] : []
}

function extractLinks(text: string): string[] {
  const matches = text.match(/https?:\/\/[^\s"'<>)]+/g)
  return matches ? [...new Set(matches)] : []
}

function extractMediaFromHtml(html: string): string[] {
  const matches = html.match(/(?:src|href)=["']([^"']+\.(jpg|jpeg|png|gif|webp|mp4|mov|webm))["']/gi) ?? []
  return [
    ...new Set(
      matches
        .map((m) => {
          const inner = m.match(/(?:src|href)=["']([^"']+)["']/i)
          return inner ? inner[1] : null
        })
        .filter((u): u is string => u !== null),
    ),
  ]
}

function truncate(text: string, max = 2000): string {
  if (text.length <= max) return text
  return text.slice(0, max).replace(/\s+\S*$/, "") + "…"
}

export interface NotablesHtmlResult {
  items: Omit<NotablesRecord, "id">[]
  error?: string
}

export async function parseNotablesHtml(
  threadUrl = NOTABLES_THREAD_URL,
): Promise<NotablesHtmlResult> {
  const allowed = await isAllowedByRobots(threadUrl)
  if (!allowed) {
    return { items: [], error: `robots.txt disallows scraping ${threadUrl}` }
  }

  let res: Response
  try {
    res = await fetch(threadUrl, {
      headers: NOTABLES_FETCH_HEADERS,
      signal: AbortSignal.timeout(20_000),
    })
  } catch (err) {
    return {
      items: [],
      error: `HTML fetch failed: ${err instanceof Error ? err.message : String(err)}`,
    }
  }

  if (!res.ok) {
    return { items: [], error: `HTTP ${res.status} fetching ${threadUrl}` }
  }

  const html = await res.text()
  const $ = cheerio.load(html)

  const now = new Date().toISOString()
  const items: Omit<NotablesRecord, "id">[] = []

  // 8kun post structure: div.post with data-num attribute
  $("div.post, article[data-num], .postCell").each((_i, el) => {
    // Get the post number
    const postNumber =
      $(el).attr("data-num") ||
      $(el).find(".post_no, .postID").first().text().replace(/\D/g, "") ||
      null

    if (!postNumber) return

    // Extract post body — sanitize fully before storing
    const bodyEl = $(el).find(".body, .postBody, .post-body, p").first()
    const rawBodyHtml = bodyEl.html() || $(el).html() || ""

    // Sanitize: strip all scripts and dangerous attributes
    const cleanHtml = DOMPurify.sanitize(rawBodyHtml, {
      ALLOWED_TAGS: ["b", "i", "em", "strong", "a", "br", "p", "span"],
      ALLOWED_ATTR: ["href", "class"],
    })

    const rawText = rawBodyHtml.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim()

    // Attempt to find a "NOTABLES" heading to use as the title
    // Many notable-collection posts start with "Notables" followed by a list
    let title = ""
    const headingEl = $(el).find("b, strong, h2, h3, h4").first()
    title = headingEl.text().trim()
    if (!title) {
      // Use the first 80 chars of text as title
      title = rawText.slice(0, 80).replace(/\s+\S*$/, "").trim() || `Post #${postNumber}`
    }

    // Parse date from post metadata
    const timeEl = $(el).find("time[datetime], .postTime").first()
    const createdAtSource = timeEl.attr("datetime") || timeEl.attr("title") || null

    // Extract references and links
    const postRefs = extractPostRefs(rawText)
    const externalLinks = extractLinks(rawText)
    const links = [...new Set([...postRefs, ...externalLinks])]
    const media = extractMediaFromHtml(rawBodyHtml)

    const board = "qresearch"
    const hashUnique = buildHash(board, postNumber, title)

    items.push({
      source: "8kun-html",
      board,
      thread_url: threadUrl.split("#")[0],
      post_number: postNumber,
      title: truncate(title, 255),
      body: truncate(cleanHtml, 2000),
      links,
      media,
      raw_text: rawText ? rawText.slice(0, 5000) : null,
      created_at_source: createdAtSource,
      scraped_at: now,
      hash_unique: hashUnique,
    })
  })

  return { items }
}
