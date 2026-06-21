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
  requestOptions: {
    headers: SCRAPER_FETCH_HEADERS,
  },
})

function extractImageFromItem(item: any): string | undefined {
  // media:content
  if (item.mediaContent?.$.url) return item.mediaContent.$.url
  // media:thumbnail
  if (item.mediaThumbnail?.$.url) return item.mediaThumbnail.$.url
  // enclosure (podcast / image)
  if (item.enclosure?.url && item.enclosure?.type?.startsWith("image/")) {
    return item.enclosure.url
  }
  // itunes:image
  if (item["itunes:image"]?.href) return item["itunes:image"].href
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

  const feed = await rssParser.parseURL(source.url)
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
