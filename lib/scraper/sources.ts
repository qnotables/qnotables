import type { ScraperSource } from "./types"

/**
 * Approved scraping sources.
 * Add or remove entries here to control which feeds and pages are ingested.
 * - type "rss"  → parsed with rss-parser (preferred)
 * - type "html" → parsed with Cheerio (public pages only)
 *
 * IMPORTANT: Only list sources you have permission to scrape.
 * The scraper will honour robots.txt and will not bypass logins or paywalls.
 */
export const SCRAPER_SOURCES: ScraperSource[] = [
  // ── RSS examples ─────────────────────────────────────────────────────────
  {
   name: "Notable News",
   url: "https://sys.8kun.top/qresearch/tripcode.xml",
   type: "rss",
    category: "News Brief",
   },

  // ── HTML examples ─────────────────────────────────────────────────────────
  // {
  //   name: "Example Blog",
  //   url: "https://example.com/blog",
  //   type: "html",
  //   selector: "article",   // CSS selector for post elements
  //   category: "Source Archive",
  // },
]
