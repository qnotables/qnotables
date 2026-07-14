import Parser from "rss-parser"
import {
  type Category,
  type Story,
  categories,
  featured as fallbackFeatured,
  topStories as fallbackTopStories,
  feed as fallbackFeed,
  trending as fallbackTrending,
} from "@/lib/news-data"
import { getLatestPost } from "@/lib/blog-posts"
import { isSafeImageUrl, normalizeAbsoluteUrl } from "@/lib/rss-utils"
import { classifyStory } from "@/lib/story-classifier"

import crypto from "crypto"

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80)
}

export function shortHash(value: string): string {
  return crypto.createHash("sha256").update(value).digest("hex").slice(0, 8)
}

export function makeImportedPostSlug(params: {
  title?: string | null
  sourceUrl?: string | null
  guid?: string | null
  pubDate?: string | null
  sourceName?: string | null
}): string {
  const titleBase = slugify(params.title || "untitled")
  const sourceHost = (() => {
    try {
      return params.sourceUrl ? slugify(new URL(params.sourceUrl).hostname.replace(/^www\./, "")) : ""
    } catch {
      return slugify(params.sourceName || "source")
    }
  })()

  const datePart = (() => {
    const d = params.pubDate ? new Date(params.pubDate) : null
    if (!d || isNaN(d.getTime())) return "undated"
    return d.toISOString().slice(0, 10)
  })()

  const hashBase = params.sourceUrl || params.guid || params.title || `${Date.now()}`
  const hash = shortHash(hashBase)

  return [titleBase, sourceHost, datePart, hash].filter(Boolean).join("-").slice(0, 140)
}

/**
 * RSS Source Configuration
 * Add new sources here to include them in the feed aggregation
 */

export function extractRssImage(item: unknown): string | undefined {
  const record = item as Record<string, any>
  const candidates: string[] = []

  const addMediaUrls = (value: unknown) => {
    for (const entry of Array.isArray(value) ? value : [value]) {
      if (!entry) continue
      if (typeof entry === "string") candidates.push(entry)
      if (typeof entry === "object") {
        const media = entry as { $?: { url?: string; href?: string }; url?: string; href?: string }
        if (media.$?.url) candidates.push(media.$.url)
        if (media.$?.href) candidates.push(media.$.href)
        if (media.url) candidates.push(media.url)
        if (media.href) candidates.push(media.href)
      }
    }
  }

  addMediaUrls(record.mediaContent)
  addMediaUrls(record["media:content"])
  addMediaUrls(record.mediaThumbnail)
  addMediaUrls(record["media:thumbnail"])
  addMediaUrls(record.enclosure)
  addMediaUrls(record.image)
  addMediaUrls(record["itunes:image"])

  for (const body of [
    record["content:encoded"],
    record.content,
    record.contentSnippet,
    record.description,
    record.summary,
  ]) {
    if (!body) continue
    const text = Array.isArray(body) ? body.join(" ") : String(body)
    for (const match of text.matchAll(/<img[^>]+(?:src|data-src)=["']([^"']+)["']/gi)) {
      if (match[1]) candidates.push(match[1])
    }
  }

  for (const candidate of candidates) {
    if (!isSafeImageUrl(candidate)) continue
    const normalized = normalizeAbsoluteUrl(candidate)
    if (normalized) return normalized
  }

  return undefined
}

export interface RSSSource {
  id: string
  name: string
  url: string
  enabled: boolean
}

export const RSS_SOURCES: RSSSource[] = [
  {
    id: "/qr/",
    name: "/qresearch/",
    url: "https://8kun.top/qresearch/tripcode.xml",
    enabled: false,
  },
  // Add more sources below:
  {
    id: "qnotables",
    name: "/qnotables/",
    url: "https://sys.8ch.net/qnotables/tripcode.xml",
    enabled: false,  
  },
  {
    id: "fox",
    name: "FOX Politics",
    url: "https://feeds.foxnews.com/foxnews/politics",
    enabled: true,
  },
  {
    id: "foxn",
    name: "FOX National",
    url: "https://feeds.foxnews.com/foxnews/national",
    enabled: true,
  },
  {
    id: "NY Post",
    name: "Ny Post",
    url: "https://nypost.com/feed/",
    enabled: false,
  },
]

type ParsedItem = {
  mediaThumbnail?: { $?: { url?: string } }
  mediaContent?: { $?: { url?: string } }
}

const parser: Parser<unknown, ParsedItem> = new Parser({
  customFields: {
    item: [
      ["media:thumbnail", "mediaThumbnail"],
      ["media:content", "mediaContent"],
    ],
  },
})

function stripHtml(input = ""): string {
  return input
    .replace(/<[^>]*>/g, " ")
    .replace(/&[^;]+;/g, " ")
    .replace(/\s+/g, " ")
    .trim()
}

// Convert a blog post to a Story for the news feed
function blogPostToStory(post: Awaited<ReturnType<typeof getLatestPost>>): Story | null {
  if (!post) return null
  
  return {
    id: post.id || post.slug,
    headline: post.title,
    summary: post.excerpt,
    source: "HOT AND FRESH",
    category: (post.category?.toUpperCase() as Category) || "OTHER",
    minutesAgo: Math.floor((Date.now() - new Date(post.publishedAt || post.date).getTime()) / 60000),
    readMinutes: post.readMinutes,
    reports: 1,
    image: post.coverImage || undefined,
    url: `/archives/${post.slug}`,
    priority: "FLASH" as const,
  }
}

// Deterministic pseudo-count for ranking stability.
function hashReports(key: string): number {
  let h = 0
  for (let i = 0; i < key.length; i++) {
    h = (h * 31 + key.charCodeAt(i)) >>> 0
  }
  return 8 + (h % 140)
}

function estimateReadMinutes(text: string): number {
  const words = text.split(/\s+/).filter(Boolean).length
  return Math.max(2, Math.round(words / 180))
}

function priorityFor(minutesAgo: number, reports: number): Story["priority"] {
  if (minutesAgo <= 30 && reports > 90) return "FLASH"
  if (minutesAgo <= 120 || reports > 70) return "PRIORITY"
  return "ROUTINE"
}

/**
 * Fetch and parse a single RSS source
 */
async function fetchRSSSource(source: RSSSource): Promise<Story[]> {
  if (!source.enabled) return []
  
  try {
    const res = await fetch(source.url, {
      headers: { "user-agent": "Mozilla/5.0 (compatible; HotAndFreshBot/1.0)" },
      next: { revalidate: 300 },
    })
    if (!res.ok) return []
    const xml = await res.text()
    const parsed = await parser.parseString(xml)

    return (parsed.items ?? []).slice(0, 40).map((raw, i) => {
      const item = raw as Parser.Item & ParsedItem
      const headline = (item.title ?? "").trim()
      const summary = stripHtml(item.contentSnippet || item.content || "").slice(0, 220)
      const published = item.isoDate || item.pubDate
      const publishedMs = published ? new Date(published).getTime() : NaN
      const minutesAgo =
        published && !isNaN(publishedMs)
          ? Math.max(1, Math.round((Date.now() - publishedMs) / 60000))
          : 60 + i * 7
      const reports = hashReports(headline)
      const rawItem = item as Parser.Item & ParsedItem & {
        categories?: string[]
        category?: string | string[]
        keywords?: string | string[]
        creator?: string
      }
      const sourceCategories = [
        ...(rawItem.categories ?? []),
        ...(Array.isArray(rawItem.category) ? rawItem.category : rawItem.category ? [rawItem.category] : []),
      ]
      const keywords = Array.isArray(rawItem.keywords)
        ? rawItem.keywords
        : rawItem.keywords?.split(",").map((keyword) => keyword.trim()) ?? []
      const classification = classifyStory({
        headline,
        description: summary,
        sourceCategory: sourceCategories.join(" "),
        articleUrl: item.link,
        keywords,
        namedEntities: rawItem.creator ? [rawItem.creator] : [],
        articleText: stripHtml(item.content || item.contentSnippet || ""),
      })

      return {
        id: `${source.id}-${item.guid || item.link || i}`,
        headline,
        summary: summary || "Follow the link for the full report.",
        source: source.name,
        category: classification.primaryCategory,
        minutesAgo,
        readMinutes: estimateReadMinutes(summary),
        reports,
        url: item.link,
        image: extractRssImage(item),
        priority: priorityFor(minutesAgo, reports),
      }
    })
  } catch (err) {
    console.error(`[v0] Failed to fetch RSS source "${source.name}":`, err)
    return []
  }
}

/**
 * Fetch stories from all enabled RSS sources
 */
async function fetchAllRSSSources(): Promise<Story[]> {
  const enabledSources = RSS_SOURCES.filter((s) => s.enabled)
  
  if (enabledSources.length === 0) {
    console.warn("[v0] No RSS sources enabled")
    return []
  }

  // Fetch all sources in parallel
  const results = await Promise.allSettled(
    enabledSources.map((source) => fetchRSSSource(source))
  )

  // Combine results, filtering out failures
  const allStories: Story[] = []
  results.forEach((result, index) => {
    if (result.status === "fulfilled") {
      allStories.push(...result.value)
    } else {
      console.error(
        `[v0] Failed to fetch RSS source "${enabledSources[index]?.name}":`,
        result.reason
      )
    }
  })

  return allStories
}

export type NewsBundle = {
  featured: Story
  topStories: Story[]
  feed: Story[]
  trending: { rank: number; headline: string; reports: number; url?: string }[]
  live: boolean
}

export async function getNews(): Promise<NewsBundle> {
  // Check for latest blog post first
  const latestBlogPost = await getLatestPost()
  const blogPostStory = blogPostToStory(latestBlogPost)
  
  const stories = await fetchAllRSSSources()

  // If we have a blog post, use it as featured; otherwise fall back to RSS or static data
  if (blogPostStory && blogPostStory.image) {
    const used = new Set<string>([blogPostStory.id])
    let topStories = stories.slice(0, 2)
    topStories.forEach((s) => used.add(s.id))
    
    // Ensure topStories have images - use fallback if needed
    const topFallbackImages = ["/images/story-satellite.png", "/images/story-port.png"]
    topStories = topStories.map((s, i) => ({
      ...s,
      image: s.image || topFallbackImages[i],
    }))

    const feedFallbackImage = "/images/hot-and-fresh-default-feed.png"
    const feed = stories
      .filter((s) => !used.has(s.id))
      .slice(0, 30)
      .map((story) => ({ ...story, image: story.image || feedFallbackImage }))

    const allStories = [blogPostStory, ...stories]
    const trending = allStories
      .sort((a, b) => b.reports - a.reports)
      .slice(0, 5)
      .map((s, i) => ({
        rank: i + 1,
        headline: s.headline,
        reports: s.reports,
        url: s.url,
      }))

    return { featured: blogPostStory, topStories, feed, trending, live: true }
  }

  // No live data available — fall back to the static placeholders.
  if (stories.length === 0) {
    return {
      featured: fallbackFeatured,
      topStories: fallbackTopStories,
      feed: fallbackFeed,
      trending: fallbackTrending,
      live: false,
    }
  }

  // Dedupe by headline and sort newest-first.
  const seen = new Set<string>()
  const unique = stories.filter((s) => {
    const key = s.headline.toLowerCase()
    if (!key || seen.has(key)) return false
    seen.add(key)
    return true
  })
  unique.sort((a, b) => a.minutesAgo - b.minutesAgo)

  const withImages = unique.filter((s) => s.image)
  const featured: Story = withImages[0]
    ? { ...withImages[0], image: withImages[0].image ?? fallbackFeatured.image, priority: "FLASH" }
    : { ...unique[0], image: fallbackFeatured.image, priority: "FLASH" }

  const used = new Set<string>([featured.id])
  const topStories = withImages.filter((s) => !used.has(s.id)).slice(0, 2)
  topStories.forEach((s) => used.add(s.id))

  // Fill any missing top-slot images with the generated artwork so the hero grid stays intact.
  const topFallbackImages = ["/images/story-satellite.png", "/images/story-port.png"]
  topStories.forEach((s, i) => {
    if (!s.image) s.image = topFallbackImages[i]
  })

  const feedFallbackImage = "/images/hot-and-fresh-default-feed.png"
  const feed = unique
    .filter((s) => !used.has(s.id))
    .slice(0, 30)
    .map((story) => ({ ...story, image: story.image || feedFallbackImage }))

  const trending = [...unique]
    .sort((a, b) => b.reports - a.reports)
    .slice(0, 5)
    .map((s, i) => ({
      rank: i + 1,
      headline: s.headline,
      reports: s.reports,
      url: s.url,
    }))

  return { featured, topStories, feed, trending, live: true }
}

export { categories }

