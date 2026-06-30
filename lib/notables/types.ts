// Notables scraper type definitions

export type NotableBoard = "qresearch" | "qnotables" | string

export interface NotablesRecord {
  id: string
  source: string         // e.g. "8kun-rss" | "8kun-html"
  board: NotableBoard    // e.g. "qresearch"
  thread_url: string
  post_number: string | null
  title: string
  body: string | null
  links: string[]        // >>post references and external links
  media: string[]        // image/video URLs from scraped content
  raw_text: string | null
  created_at_source: string | null
  scraped_at: string
  hash_unique: string    // SHA-256 of board+post_number+title to prevent dupes
}

export interface NotablesScrapeResult {
  startedAt: string
  finishedAt: string
  triggeredBy: "cron" | "manual"
  newItems: number
  skippedDupes: number
  errors: string[]
}

export interface NotablesFilters {
  search?: string
  board?: string  // kept for legacy 8kun scraper compatibility
  tag?: string    // used for blog_posts tag filter
  dateFrom?: string
  dateTo?: string
  page?: number
  pageSize?: number
}
