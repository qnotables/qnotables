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
    name: "Qnotables",
    url: "https://www.qnotables.com/blog-feed.xml",
    type: "rss",
    category: "Source Archive",
  },

  // ── HTML examples ─────────────────────────────────────────────────────────
   {
     name: "Qnotables",
     url: "https://qnotables.com/archives",
     type: "html",
     selector: "article",   // CSS selector for post elements
     category: "Source Archive",
   },
]
