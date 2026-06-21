import * as cheerio from "cheerio"
import type { ScraperSource, ScrapedItem } from "./types"
import { isAllowedByRobots, SCRAPER_FETCH_HEADERS } from "./robots"

function absoluteUrl(href: string, base: string): string {
  try {
    return new URL(href, base).href
  } catch {
    return href
  }
}

function truncate(text: string, max = 400): string {
  if (text.length <= max) return text
  return text.slice(0, max).replace(/\s+\S*$/, "") + "…"
}

/**
 * Extracts a canonical URL from <link rel="canonical"> or falls back to the
 * page URL itself.
 */
function getCanonical($: cheerio.CheerioAPI, pageUrl: string): string {
  const canonical = $('link[rel="canonical"]').attr("href")
  if (canonical) return absoluteUrl(canonical, pageUrl)
  return pageUrl
}

/**
 * Scrapes a public HTML page using Cheerio.
 * Uses `source.selector` (default: "article") to find article elements.
 * Extracts title, link, excerpt, and image from each element.
 *
 * NOTE: Full article body is intentionally NOT extracted.
 */
export async function parseHtmlSource(source: ScraperSource): Promise<ScrapedItem[]> {
  const allowed = await isAllowedByRobots(source.url)
  if (!allowed) {
    throw new Error(`robots.txt disallows scraping ${source.url}`)
  }

  const res = await fetch(source.url, {
    headers: SCRAPER_FETCH_HEADERS,
    signal: AbortSignal.timeout(15_000),
  })

  if (!res.ok) {
    throw new Error(`HTTP ${res.status} fetching ${source.url}`)
  }

  const html = await res.text()
  const $ = cheerio.load(html)

  const selector = source.selector || "article"
  const items: ScrapedItem[] = []

  $(selector).each((_i, el) => {
    // Find a link inside the element
    const linkEl = $(el).find("a[href]").first()
    const href = linkEl.attr("href")
    if (!href) return

    const canonicalUrl = absoluteUrl(href, source.url)

    // Skip likely paywall / login URLs
    if (/\/subscribe|\/paywall|\/members\//i.test(canonicalUrl)) return

    // Title: from heading, aria-label, or link text
    const heading = $(el).find("h1, h2, h3, h4").first().text().trim()
    const title = heading || linkEl.attr("aria-label") || linkEl.text().trim() || "Untitled"

    // Excerpt: from <p> or meta description, capped at 400 chars
    const pText = $(el).find("p").first().text().trim()
    const excerpt = pText ? truncate(pText) : undefined

    // Image: from <img> inside element
    const imgSrc = $(el).find("img[src]").first().attr("src")
    const imageUrl = imgSrc ? absoluteUrl(imgSrc, source.url) : undefined

    // Published date: from <time datetime>, data-date, or similar
    const timeEl = $(el).find("time[datetime]").first()
    const publishedAt = timeEl.attr("datetime") || undefined

    items.push({
      title,
      canonicalUrl,
      sourceName: source.name,
      sourceUrl: source.url,
      excerpt,
      imageUrl,
      publishedAt,
    })
  })

  return items
}
