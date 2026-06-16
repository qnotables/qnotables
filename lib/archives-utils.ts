import { BlogPost } from "@/lib/blog-posts"

/**
 * Transform a BlogPost into the format expected by archive components
 */
export interface ArchiveRecord {
  id: string
  slug: string
  title: string
  excerpt: string
  subtitle?: string
  category: string
  post_type: string
  tags: string[]
  published_at: string
  source_name?: string
  source_url?: string
  readMinutes: number
  media_type?: string
  featured: boolean
  author: string
  cover_image?: string | null
}

export function transformBlogPostToArchive(post: BlogPost): ArchiveRecord {
  return {
    id: post.id || post.slug,
    slug: post.slug,
    title: post.title,
    excerpt: post.excerpt || post.subtitle || "",
    subtitle: post.subtitle,
    category: post.category || "General",
    post_type: post.postType || "News Brief",
    tags: post.tags || (post.tag ? [post.tag] : []),
    published_at: post.publishedAt || post.date,
    source_name: post.sourceName,
    source_url: post.sourceUrl,
    readMinutes: post.readMinutes,
    media_type: post.media_type,
    featured: post.featured || false,
    author: post.author || "HOT AND FRESH",
    cover_image: post.coverImage,
  }
}

/**
 * Get unique categories from posts, with fallback
 */
export function extractCategories(posts: BlogPost[]): string[] {
  const categories = new Set(
    posts
      .filter((p) => p.category)
      .map((p) => p.category)
  )
  return Array.from(categories).sort()
}

/**
 * Get unique tags from posts, with fallback
 */
export function extractTags(posts: BlogPost[]): string[] {
  const tags = new Set<string>()
  for (const post of posts) {
    if (post.tags) {
      post.tags.forEach((t) => tags.add(t))
    } else if (post.tag) {
      tags.add(post.tag)
    }
  }
  return Array.from(tags).sort()
}

/**
 * Get unique sources from posts
 */
export function extractSources(posts: BlogPost[]): string[] {
  const sources = new Set(
    posts
      .filter((p) => p.sourceName)
      .map((p) => p.sourceName as string)
  )
  return Array.from(sources).sort()
}

/**
 * Get unique post types from posts
 */
export function extractPostTypes(posts: BlogPost[]): string[] {
  const types = new Set(
    posts
      .filter((p) => p.postType)
      .map((p) => p.postType as string)
  )
  return Array.from(types).sort()
}

/**
 * Get unique media types from posts
 */
export function extractMediaTypes(posts: BlogPost[]): string[] {
  const types = new Set(
    posts
      .filter((p) => p.media_type)
      .map((p) => p.media_type)
      .filter((t) => t)
  )
  return Array.from(types).sort()
}

/**
 * Get years that have posts
 */
export function extractYears(posts: BlogPost[]): number[] {
  const years = new Set(
    posts.map((p) => new Date(p.publishedAt || p.date).getFullYear())
  )
  return Array.from(years).sort((a, b) => b - a)
}

/**
 * Get featured posts sorted by priority
 */
export function getFeaturedRecords(posts: BlogPost[]): ArchiveRecord[] {
  return posts
    .filter((p) => p.featured)
    .sort((a, b) => {
      // Sort by priority first, then by date
      const aPriority = p.priority === "critical" ? 4 : p.priority === "high" ? 3 : p.priority === "medium" ? 2 : 1
      const bPriority = b.priority === "critical" ? 4 : b.priority === "high" ? 3 : b.priority === "medium" ? 2 : 1
      if (aPriority !== bPriority) return bPriority - aPriority
      return new Date(b.publishedAt || b.date).getTime() - new Date(a.publishedAt || a.date).getTime()
    })
    .slice(0, 6)
    .map(transformBlogPostToArchive)
}

/**
 * Get all posts as archive records, sorted by date
 */
export function getAllArchiveRecords(posts: BlogPost[]): ArchiveRecord[] {
  return posts
    .sort((a, b) => new Date(b.publishedAt || b.date).getTime() - new Date(a.publishedAt || a.date).getTime())
    .map(transformBlogPostToArchive)
}

/**
 * Get months that have posts
 */
export interface MonthGroup {
  year: number
  month: number
  count: number
  label: string
}

export function extractMonths(posts: BlogPost[]): MonthGroup[] {
  const months = new Map<string, { year: number; month: number; count: number }>()

  for (const post of posts) {
    const date = new Date(post.publishedAt || post.date)
    const year = date.getFullYear()
    const month = date.getMonth() + 1
    const key = `${year}-${month}`

    if (!months.has(key)) {
      months.set(key, { year, month, count: 0 })
    }

    const m = months.get(key)!
    m.count++
  }

  return Array.from(months.values())
    .map((m) => ({
      ...m,
      label: new Date(m.year, m.month - 1).toLocaleString("default", { month: "short", year: "numeric" }),
    }))
    .sort((a, b) => b.year - a.year || b.month - a.month)
}

/**
 * Get posts for a specific category
 */
export function getPostsByCategory(posts: BlogPost[], category: string): ArchiveRecord[] {
  return posts
    .filter((p) => p.category === category)
    .sort((a, b) => new Date(b.publishedAt || b.date).getTime() - new Date(a.publishedAt || a.date).getTime())
    .map(transformBlogPostToArchive)
}

/**
 * Get posts for a specific tag
 */
export function getPostsByTag(posts: BlogPost[], tag: string): ArchiveRecord[] {
  return posts
    .filter((p) => {
      if (p.tags) return p.tags.includes(tag)
      return p.tag === tag
    })
    .sort((a, b) => new Date(b.publishedAt || b.date).getTime() - new Date(a.publishedAt || a.date).getTime())
    .map(transformBlogPostToArchive)
}

/**
 * Get posts for a specific source
 */
export function getPostsBySource(posts: BlogPost[], source: string): ArchiveRecord[] {
  return posts
    .filter((p) => p.sourceName === source)
    .sort((a, b) => new Date(b.publishedAt || b.date).getTime() - new Date(a.publishedAt || a.date).getTime())
    .map(transformBlogPostToArchive)
}

/**
 * Get posts for a specific media type
 */
export function getPostsByMediaType(posts: BlogPost[], mediaType: string): ArchiveRecord[] {
  return posts
    .filter((p) => p.media_type === mediaType)
    .sort((a, b) => new Date(b.publishedAt || b.date).getTime() - new Date(a.publishedAt || a.date).getTime())
    .map(transformBlogPostToArchive)
}

/**
 * Get posts for a specific year
 */
export function getPostsByYear(posts: BlogPost[], year: number): ArchiveRecord[] {
  return posts
    .filter((p) => new Date(p.publishedAt || p.date).getFullYear() === year)
    .sort((a, b) => new Date(b.publishedAt || b.date).getTime() - new Date(a.publishedAt || a.date).getTime())
    .map(transformBlogPostToArchive)
}

/**
 * Get posts for a specific month
 */
export function getPostsByMonth(posts: BlogPost[], year: number, month: number): ArchiveRecord[] {
  return posts
    .filter((p) => {
      const date = new Date(p.publishedAt || p.date)
      return date.getFullYear() === year && date.getMonth() + 1 === month
    })
    .sort((a, b) => new Date(b.publishedAt || b.date).getTime() - new Date(a.publishedAt || a.date).getTime())
    .map(transformBlogPostToArchive)
}

/**
 * Search posts by query (title, excerpt, body)
 */
export function searchArchiveRecords(posts: BlogPost[], query: string): ArchiveRecord[] {
  const q = query.toLowerCase()
  return posts
    .filter((p) => p.title.toLowerCase().includes(q) || p.excerpt.toLowerCase().includes(q) || p.content.toLowerCase().includes(q))
    .sort((a, b) => new Date(b.publishedAt || b.date).getTime() - new Date(a.publishedAt || a.date).getTime())
    .map(transformBlogPostToArchive)
}
