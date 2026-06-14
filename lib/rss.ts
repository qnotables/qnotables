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

type FeedSource = {
  category: Category
  url: string
  // when true, the item source is parsed from the title (Google News "Headline - Source")
  sourceFromTitle?: boolean
  defaultSource?: string
}

// BBC feeds carry clean titles + media thumbnails; Google News queries give varied sources.
const SOURCES: FeedSource[] = [
  { category: "WORLD", url: "https://sys.8kun.top/qresearch/tripcode.xml", defaultSource: "Wire" },
  { category: "POLITICS", url: "https://www.watkinsreport.com/atom.xml ", defaultSource: "BBC News" },
  { category: "ECONOMY", url: "https://feeds.bbci.co.uk/news/business/rss.xml", defaultSource: "BBC News" },
  { category: "TECH", url: "https://feeds.bbci.co.uk/news/technology/rss.xml", defaultSource: "BBC News" },
  {
    category: "SCIENCE",
    url: "https://feeds.bbci.co.uk/news/science_and_environment/rss.xml",
    defaultSource: "BBC News",
  },
  {
    category: "DEFENSE",
    url: "https://news.google.com/rss/search?q=defense+military&hl=en-US&gl=US&ceid=US:en",
    sourceFromTitle: true,
    defaultSource: "Google News",
  },
  {
    category: "ENERGY",
    url: "https://news.google.com/rss/search?q=energy+grid+power&hl=en-US&gl=US&ceid=US:en",
    sourceFromTitle: true,
    defaultSource: "Google News",
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

// Keyword rules that map a feed-provided <category> label onto one of our desks.
// Ordered most-specific first so overlaps (e.g. "world politics") resolve sensibly.
const CATEGORY_RULES: { desk: Category; keywords: string[] }[] = [
  { desk: "ENERGY", keywords: ["energy", "oil", "gas", "grid", "renewable", "solar", "wind", "nuclear", "electric", "fuel", "petroleum"] },
  { desk: "DEFENSE", keywords: ["defen", "military", "war", "army", "navy", "air force", "weapon", "security", "conflict", "missile", "troops", "nato"] },
  { desk: "TECH", keywords: ["tech", "software", "hardware", "computing", "internet", "gadget", "cyber", "startup", "artificial intelligence", " ai", "app", "digital", "robot"] },
  { desk: "SCIENCE", keywords: ["science", "research", "space", "astronom", "physics", "biology", "chemistry", "environment", "climate", "study", "scientist", "nature"] },
  { desk: "ECONOMY", keywords: ["econom", "business", "market", "trade", "finance", "financial", "stock", "inflation", "bank", "money", "jobs", "industry", "tariff"] },
  { desk: "POLITICS", keywords: ["politic", "election", "government", "parliament", "congress", "senate", "policy", "diplomac", "minister", "president", "vote", "law"] },
  { desk: "WORLD", keywords: ["world", "international", "global", "foreign", "asia", "africa", "europe", "middle east", "americas", "ukraine", "china", "russia"] },
]

// rss-parser exposes <category> tags on item.categories as strings or { _: "name" } objects.
function rawCategories(item: { categories?: unknown }): string[] {
  const cats = item.categories
  if (!Array.isArray(cats)) return []
  return cats
    .map((c) => (typeof c === "string" ? c : (c as { _?: string })?._ ?? ""))
    .map((c) => c.trim().toLowerCase())
    .filter(Boolean)
}

// Route a story by its feed-provided categories.
  // 1) match a tag to a desk; 2) tags present but none match -> OTHER; 3) no tags -> feed's desk.
function mapCategory(item: { categories?: unknown }, feedDesk: Category): Category {
  const tags = rawCategories(item)
  if (tags.length === 0) return feedDesk
  for (const rule of CATEGORY_RULES) {
    if (tags.some((tag) => rule.keywords.some((kw) => tag.includes(kw)))) {
      return rule.desk
    }
  }
  return "OTHER"
}

function stripHtml(input = ""): string {
  return input
    .replace(/<[^>]*>/g, " ")
    .replace(/&[^;]+;/g, " ")
    .replace(/\s+/g, " ")
    .trim()
}

// Deterministic pseudo-count so ranking bars stay stable between renders.
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

async function fetchSource(src: FeedSource): Promise<Story[]> {
  try {
    const res = await fetch(src.url, {
      headers: { "user-agent": "Mozilla/5.0 (compatible; DispatchBot/1.0)" },
      next: { revalidate: 300 },
    })
    if (!res.ok) return []
    const xml = await res.text()
    const parsed = await parser.parseString(xml)

    return (parsed.items ?? []).slice(0, 12).map((raw, i) => {
      const item = raw as Parser.Item & ParsedItem
      const rawTitle = (item.title ?? "").trim()

      let headline = rawTitle
      let source = src.defaultSource ?? "Newswire"
      if (src.sourceFromTitle) {
        const idx = rawTitle.lastIndexOf(" - ")
        if (idx > 0) {
          headline = rawTitle.slice(0, idx).trim()
          source = rawTitle.slice(idx + 3).trim() || source
        }
      }

      const summary = stripHtml(item.contentSnippet || item.content || "").slice(0, 220)
      const published = item.isoDate || item.pubDate
      const minutesAgo = published
        ? Math.max(1, Math.round((Date.now() - new Date(published).getTime()) / 60000))
        : 60 + i * 7
      const reports = hashReports(headline)

      return {
        id: item.guid || item.link || `${src.category}-${i}`,
        headline,
        summary: summary || "Follow the link for the full report from the originating source.",
        source,
        category: mapCategory(item, src.category),
        minutesAgo,
        readMinutes: estimateReadMinutes(summary),
        reports,
        url: item.link,
        image: imageFrom(item),
        priority: priorityFor(minutesAgo, reports),
      }
    })
  } catch {
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
  const results = await Promise.all(SOURCES.map(fetchSource))
  const all = results.flat()

  // No live data available — fall back to the static placeholders.
  if (all.length === 0) {
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
  const unique = all.filter((s) => {
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
