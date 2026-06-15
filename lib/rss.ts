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

// Single RSS source: Watkins Report
const RSS_FEED_URL = "https://8ch.net/qresearch/tripcode.xml"
const DEFAULT_SOURCE = "/qr/"

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
  { desk: "SCIENCE", keywords: ["science", "research", "space", "astronom", "physics", "biology", "chemistry", "environment", "climate", "study", "scientist", "nature", "discovery"] },
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
  return item.mediaThumbnail?.$?.url || item.mediaContent?.$?.url || undefined
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

async function fetchWatkinsFeed(): Promise<Story[]> {
  try {
    const res = await fetch(RSS_FEED_URL, {
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
        id: item.guid || item.link || `watkins-${i}`,
        headline,
        summary: summary || "Follow the link for the full report.",
        source: DEFAULT_SOURCE,
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
    console.error("[v0] Failed to fetch Watkins Report:", err)
    return []
  }
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
  
  const stories = await fetchWatkinsFeed()

  // If we have a blog post, use it as featured; otherwise fall back to RSS or static data
  if (blogPostStory && blogPostStory.image) {
    const used = new Set<string>([blogPostStory.id])
    const topStories = stories.slice(0, 2)
    topStories.forEach((s) => used.add(s.id))

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

