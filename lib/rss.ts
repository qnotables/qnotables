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

/**
 * RSS Source Configuration
 * Add new sources here to include them in the feed aggregation
 */
export interface RSSSource {
  id: string
  name: string
  url: string
  enabled: boolean
}

export const RSS_SOURCES: RSSSource[] = [
  {
    id: "watkins",
    name: "/qr/",
    url: "https://8ch.net/qresearch/tripcode.xml",
    enabled: true,
  },
  // Add more sources below:
  {
    id: "qnotables",
    name: "qnotables",
    url: "https://sys.8ch.net/qnotables/tripcode.xml",
    enabled: true,  // ← Disabled: causing redirect loop - causing production build to fail
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
    id: "blog",
    name: "QNotables Blog",
    url: "https://qnotables.com/blog-feed.xml",
    enabled: true,
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

// Keyword rules that map article title/content onto one of our desks.
// Ordered most-specific first so overlaps resolve sensibly.
const CATEGORIZATION_RULES: { desk: Category; keywords: string[] }[] = [
  { desk: "ENERGY", keywords: ["energy", "oil", "gas", "grid", "renewable", "solar", "wind", "nuclear", "electric", "fuel", "petroleum", "power"] },
  { desk: "DEFENSE", keywords: ["defen", "military", "war", "army", "navy", "air force", "weapon", "security", "conflict", "missile", "troops", "nato", "combat", "strike"] },
  { desk: "TECH", keywords: ["tech", "software", "hardware", "computing", "internet", "gadget", "cyber", "startup", "artificial intelligence", " ai", "app", "digital", "robot", "data"] },
  { desk: "SCIENCE", keywords: ["science", "spacex", "space", "astronom", "physics", "biology", "chemistry", "environment", "climate", "study", "scientist", "nature", "discovery"] },
  { desk: "ECONOMY", keywords: ["econom", "business", "market", "trade", "finance", "financial", "stock", "inflation", "bank", "money", "jobs", "industry", "tariff", "commerce"] },
  { desk: "POLITICS", keywords: ["politic", "election", "government", "parliament", "congress", "senate", "policy", "diplomac", "minister", "president", "vote", "law", "legislat"] },
  { desk: "WORLD", keywords: ["world", "international", "global", "foreign", "asia", "africa", "europe", "middle east", "americas", "ukraine", "china", "russia", "asia-pacific"] },
]

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

function imageFrom(item: ParsedItem): string | undefined {
  const i = item as any
  // Try media namespace first (most common)
  if (i.mediaThumbnail?.$?.url) return i.mediaThumbnail.$.url
  if (i.mediaContent?.$?.url) return i.mediaContent.$.url

  // Try image field (some RSS feeds)
  if (i.image?.url) return i.image.url

  // Try enclosure (podcasts, media feeds)
  if (Array.isArray(i.enclosure)) {
    const mediaEnclosure = i.enclosure.find((e: any) =>
      e.$?.type?.startsWith("image/")
    )
    if (mediaEnclosure?.$?.url) return mediaEnclosure.$.url
  } else if (i.enclosure?.$?.type?.startsWith("image/")) {
    return i.enclosure.$.url
  }

  // Try description for img tag (last resort)
  const desc = i.description || i.content
  if (desc) {
    const imgMatch = desc.match(/<img[^>]+src=["']([^"']+)["']/i)
    if (imgMatch?.[1]) return imgMatch[1]
  }
  
  return undefined
}

// Categorize an article based on keywords found in title + summary.
function categorizeArticle(headline: string, summary: string): Category {
  const text = `${headline} ${summary}`.toLowerCase()
  
  for (const rule of CATEGORIZATION_RULES) {
    if (rule.keywords.some((kw) => text.includes(kw))) {
      return rule.desk
    }
  }
  
  // Default to OTHER if no other category matches
  return "OTHER"
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

      return {
        id: `${source.id}-${item.guid || item.link || i}`,
        headline,
        summary: summary || "Follow the link for the full report.",
        source: source.name,
        category: categorizeArticle(headline, summary),
        minutesAgo,
        readMinutes: estimateReadMinutes(summary),
        reports,
        url: item.link,
        image: imageFrom(item),
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

    const feed = stories.filter((s) => !used.has(s.id)).slice(0, 30)

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

  const feed = unique.filter((s) => !used.has(s.id)).slice(0, 30)

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

