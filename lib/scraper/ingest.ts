import { createClient, type SupabaseClient } from "@supabase/supabase-js"
import { generateSlug } from "@/lib/slug-utils"
import type { ScrapedItem, ScraperSource, SourceResult, ScrapeRunResult } from "./types"
import { parseRssSource } from "./rss-parser"
import { parseHtmlSource } from "./html-parser"
import { getExistingCanonicalUrls } from "./dedup"
import { SCRAPER_SOURCES } from "./sources"

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnySupabaseClient = SupabaseClient<any, any, any>

function getSupabaseClient(): AnySupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error("Supabase not configured")
  return createClient(url, key)
}

async function generateUniqueSlug(title: string, supabase: AnySupabaseClient): Promise<string> {
  let slug = generateSlug(title)

  const { data } = await supabase
    .from("blog_posts")
    .select("slug")
    .like("slug", `${slug}%`)
    .order("slug")

  const existingSlugs = new Set((data || []).map((r: { slug: string }) => r.slug))

  if (!existingSlugs.has(slug)) return slug

  let counter = 1
  while (existingSlugs.has(`${slug}-${counter}`)) counter++
  return `${slug}-${counter}`
}

async function saveDraftPost(item: ScrapedItem, category: string | undefined, supabase: AnySupabaseClient): Promise<void> {
  const now = new Date().toISOString()
  const slug = await generateUniqueSlug(item.title, supabase)

  const body = [
    `**Source:** [${item.sourceName}](${item.sourceUrl})`,
    item.excerpt ? `\n${item.excerpt}` : "",
    `\n[Read original article](${item.canonicalUrl})`,
  ]
    .filter(Boolean)
    .join("\n\n")

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await supabase.from("blog_posts").insert([
    {
      title: item.title,
      slug,
      excerpt: item.excerpt || "",
      body,
      status: "draft",
      post_type: category || "Source Archive",
      priority: "low",
      featured: false,
      source_name: item.sourceName,
      // source_url stores the canonical article URL for deduplication
      source_url: item.canonicalUrl,
      cover_image_url: item.imageUrl || null,
      media_image_url: item.imageUrl || null,
      original_publish_date: item.publishedAt || null,
      media_type: "none",
      include_in_rss: false,
      public_archive: false,
      imported_at: now,
      created_at: now,
      updated_at: now,
      tags: [],
      related_links: [],
    } as any,
  ])
}

async function processSource(source: ScraperSource): Promise<SourceResult> {
  const result: SourceResult = {
    sourceName: source.name,
    sourceUrl: source.url,
    sourceType: source.type,
    success: false,
    newPosts: 0,
    skippedDupes: 0,
    itemsFound: 0,
  }

  try {
    let items: ScrapedItem[] = []

    if (source.type === "rss") {
      items = await parseRssSource(source)
    } else {
      items = await parseHtmlSource(source)
    }

    result.itemsFound = items.length
    if (items.length === 0) {
      result.success = true
      return result
    }

    const supabase = getSupabaseClient()
    const urls = items.map((i) => i.canonicalUrl)
    const existing = await getExistingCanonicalUrls(urls)

    for (const item of items) {
      if (existing.has(item.canonicalUrl)) {
        result.skippedDupes++
        continue
      }

      await saveDraftPost(item, source.category, supabase)
      result.newPosts++
    }

    result.success = true
  } catch (err) {
    result.error = err instanceof Error ? err.message : String(err)
  }

  return result
}

async function saveScrapeLog(run: ScrapeRunResult): Promise<void> {
  const supabase = getSupabaseClient()
  await supabase.from("scrape_logs").insert([
    {
      started_at: run.startedAt,
      finished_at: run.finishedAt,
      triggered_by: run.triggeredBy,
      total_sources: run.totalSources,
      succeeded: run.succeeded,
      failed: run.failed,
      new_posts: run.newPosts,
      skipped_dupes: run.skippedDupes,
      details: run.details,
    },
  ])
}

export async function runScrape(triggeredBy: "cron" | "manual" = "cron"): Promise<ScrapeRunResult> {
  const startedAt = new Date().toISOString()
  const sources = SCRAPER_SOURCES

  // Process sources sequentially to be polite to servers
  const details: SourceResult[] = []
  for (const source of sources) {
    const result = await processSource(source)
    details.push(result)
  }

  const finishedAt = new Date().toISOString()
  const succeeded = details.filter((d) => d.success).length
  const failed = details.filter((d) => !d.success).length
  const newPosts = details.reduce((sum, d) => sum + d.newPosts, 0)
  const skippedDupes = details.reduce((sum, d) => sum + d.skippedDupes, 0)

  const run: ScrapeRunResult = {
    startedAt,
    finishedAt,
    triggeredBy,
    totalSources: sources.length,
    succeeded,
    failed,
    newPosts,
    skippedDupes,
    details,
  }

  await saveScrapeLog(run)
  return run
}
