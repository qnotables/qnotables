// Scraper type definitions

export type SourceType = "rss" | "html"

export interface ScraperSource {
  name: string
  url: string
  type: SourceType
  /** Optional CSS selector for article list items (HTML sources only) */
  selector?: string
  /** Optional default category to assign scraped posts */
  category?: string
}

export interface ScrapedItem {
  title: string
  canonicalUrl: string
  sourceName: string
  sourceUrl: string
  excerpt?: string
  imageUrl?: string
  publishedAt?: string
}

export interface SourceResult {
  sourceName: string
  sourceUrl: string
  sourceType: SourceType
  success: boolean
  newPosts: number
  skippedDupes: number
  error?: string
  itemsFound: number
}

export interface ScrapeRunResult {
  startedAt: string
  finishedAt: string
  triggeredBy: "cron" | "manual"
  totalSources: number
  succeeded: number
  failed: number
  newPosts: number
  skippedDupes: number
  details: SourceResult[]
}

export interface ScrapeLog {
  id: string
  started_at: string
  finished_at: string | null
  triggered_by: "cron" | "manual"
  total_sources: number
  succeeded: number
  failed: number
  new_posts: number
  skipped_dupes: number
  details: SourceResult[]
  created_at: string
}
