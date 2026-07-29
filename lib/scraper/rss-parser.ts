import Parser from "rss-parser"
import type { ScraperSource, ScrapedItem } from "./types"
import { isAllowedByRobots, SCRAPER_FETCH_HEADERS } from "./robots"

const rssParser = new Parser({
  customFields: {
    item: [
      ["media:content", "mediaContent", { keepArray: false }],
      ["media:thumbnail", "mediaThumbnail", { keepArray: false }],
      ["enclosure", "enclosure", { keepArray: false }],
    ],
  },
  // Don't pass requestOptions — we fetch manually so we can sanitize first
})

/**
 * Sanitize XML before parsing to handle common malformed entity issues:
 * - Invalid named entities like &nbsp; &mdash; &copy; etc. that are legal HTML
 *   but not valid XML unless declared in a DTD.
 * - Bare & characters that are not part of a valid entity reference.
 */
function sanitizeXml(xml: string): string {
  // Replace common HTML named entities with their Unicode equivalents
  const HTML_ENTITIES: Record<string, string> = {
    "&nbsp;": "\u00a0",
    "&mdash;": "\u2014",
    "&ndash;": "\u2013",
    "&lsquo;": "\u2018",
    "&rsquo;": "\u2019",
    "&ldquo;": "\u201c",
    "&rdquo;": "\u201d",
    "&hellip;": "\u2026",
    "&bull;": "\u2022",
    "&copy;": "\u00a9",
    "&reg;": "\u00ae",
    "&trade;": "\u2122",
    "&euro;": "\u20ac",
    "&pound;": "\u00a3",
    "&yen;": "\u00a5",
    "&cent;": "\u00a2",
    "&times;": "\u00d7",
    "&divide;": "\u00f7",
    "&laquo;": "\u00ab",
    "&raquo;": "\u00bb",
    "&eacute;": "\u00e9",
    "&agrave;": "\u00e0",
    "&egrave;": "\u00e8",
    "&ecirc;": "\u00ea",
    "&ccedil;": "\u00e7",
    "&auml;": "\u00e4",
    "&ouml;": "\u00f6",
    "&uuml;": "\u00fc",
    "&szlig;": "\u00df",
  }

  let sanitized = xml
  for (const [entity, char] of Object.entries(HTML_ENTITIES)) {
    sanitized = sanitized.replaceAll(entity, char)
  }

  // Replace any remaining bare & not followed by a valid entity ref (#digits, #xHex, or word;)
  sanitized = sanitized.replace(/&(?!(?:#\d+|#x[\da-fA-F]+|[a-zA-Z][a-zA-Z0-9]*);)/g, "&amp;")

  return sanitized
}

function extractImageFromItem(item: any): string | undefined {
  // media:content — handle both array (keepArray:true) and scalar
  if (Array.isArray(item.mediaContent)) {
    for (const mc of item.mediaContent) {
      if (mc?.$?.url) return mc.$.url
      if (mc?.url) return mc.url
    }
  } else if (item.mediaContent?.$?.url) {
    return item.mediaContent.$.url
  } else if (item.mediaContent?.url) {
    return item.mediaContent.url
  }

  // media:thumbnail — same dual handling
  if (Array.isArray(item.mediaThumbnail)) {
    for (const mt of item.mediaThumbnail) {
      if (mt?.$?.url) return mt.$.url
      if (mt?.url) return mt.url
    }
  } else if (item.mediaThumbnail?.$?.url) {
    return item.mediaThumbnail.$.url
  } else if (item.mediaThumbnail?.url) {
    return item.mediaThumbnail.url
  }

  // enclosure (podcast / image feeds)
  if (item.enclosure?.url && item.enclosure?.type?.startsWith("image/")) {
    return item.enclosure.url
  }

  // Plain image field (e.g. some Atom/custom feeds)
  if (typeof item.image === "string" && item.image) return item.image
  if (item.image?.url) return item.image.url

  // itunes:image
  if (item["itunes:image"]?.href) return item["itunes:image"].href

  // Extract first <img> from content:encoded, content, description, or summary
  const bodies: string[] = [item["content:encoded"], item.content, item.description, item.summary].filter(
    (b): b is string => typeof b === "string" && b.length > 0
  )
  for (const body of bodies) {
    const match = body.match(/<img[^>]+src=["']([^"']+)["']/i)
    if (match?.[1]) return match[1]
  }

  return undefined
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim()
}

function truncate(text: string, max = 400): string {
  if (text.length <= max) return text
  return text.slice(0, max).replace(/\s+\S*$/, "") + "…"
}

export async function parseRssSource(source: ScraperSource): Promise<ScrapedItem[]> {
  const allowed = await isAllowedByRobots(source.url)
  if (!allowed) {
    throw new Error(`robots.txt disallows scraping ${source.url}`)
  }

  // Fetch manually so we can sanitize XML before parsing
  const res = await fetch(source.url, {
    headers: SCRAPER_FETCH_HEADERS,
    next: { revalidate: 300 },
  })
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} fetching ${source.url}`)
  }
  const rawXml = await res.text()
  const cleanXml = sanitizeXml(rawXml)
  const feed = await rssParser.parseString(cleanXml)
  const items: ScrapedItem[] = []

  for (const item of feed.items ?? []) {
    const url = item.link || item.guid
    if (!url) continue

    // Only scrape publicly accessible items — skip anything that smells like
    // a subscriber/paywall URL (common patterns)
    if (/\/subscribe|\/paywall|\/members\//i.test(url)) continue

    const rawExcerpt = item.contentSnippet || item.summary || item.content || ""
    const excerpt = truncate(stripHtml(rawExcerpt))

    items.push({
      title: (item.title || "Untitled").trim(),
      canonicalUrl: url,
      sourceName: source.name,
      sourceUrl: source.url,
      excerpt: excerpt || undefined,
      imageUrl: extractImageFromItem(item),
      publishedAt: item.isoDate || item.pubDate || undefined,
    })
  }

  return items
}
