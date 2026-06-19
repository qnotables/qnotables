import { BlogPost } from "@/lib/blog-posts"
import { Video } from "@/app/actions/video-actions"

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
  type?: "blog" | "video"
  video_url?: string
  external_url?: string
}

/**
 * Extract the first video URL from blog content HTML.
 * Looks for <video> tags with <source> children or direct src attributes.
 */
export function extractFirstVideoUrl(content: string): string | null {
  if (!content) return null

  // Match <video ... ><source src="..." ... or <video src="..."
  const videoSourceMatch = content.match(
    /<video[^>]*>[\s\S]*?<source\s+[^>]*src=["']([^"']+)["'][^>]*>/i
  )
  if (videoSourceMatch) return videoSourceMatch[1]

  // Fallback: direct src on video tag
  const videoSrcMatch = content.match(/<video[^>]*\ssrc=["']([^"']+)["'][^>]*>/i)
  if (videoSrcMatch) return videoSrcMatch[1]

  return null
}

/**
 * Generate a Vercel Blob video thumbnail URL using the video's built-in poster/thumbnail.
 * Uses a query parameter to extract a frame or use the service's default thumbnail.
 */
export function getVideoThumbnailUrl(videoUrl: string): string {
  if (!videoUrl) return ""
  
  // For Vercel Blob URLs, we can request a thumbnail by adding ?thumbnail=true
  // or by using a frame-extraction service. For now, return the video URL itself
  // which many players render as a thumbnail, or append a query param if supported.
  try {
    const url = new URL(videoUrl)
    // Add thumbnail query param for services that support it
    url.searchParams.set("thumbnail", "true")
    return url.toString()
  } catch {
    return videoUrl
  }
}

export function transformBlogPostToArchive(post: BlogPost): ArchiveRecord {
  // If no cover image, try to extract a video thumbnail from content
  let coverImage = post.coverImage
  if (!coverImage && post.content) {
    const videoUrl = extractFirstVideoUrl(post.content)
    if (videoUrl) {
      coverImage = getVideoThumbnailUrl(videoUrl)
    }
  }

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
    media_type: post.postType,
    featured: post.featured || false,
    author: post.author || "HOT AND FRESH",
    cover_image: coverImage,
    type: "blog",
  }
}

/**
 * Convert a Video into an ArchiveRecord format
 */
export function convertVideoToArchive(video: Video): ArchiveRecord {
  return {
    id: video.id,
    slug: video.id, // Use video ID as slug for routing
    title: video.title,
    excerpt: video.description || "",
    category: video.category || "General",
    post_type: "Video",
    tags: [],
    published_at: video.date || new Date().toISOString(),
    readMinutes: 0,
    media_type: "Video",
    featured: false,
    author: "HOT AND FRESH",
    cover_image: video.thumbnail_url,
    type: "video",
    video_url: video.video_url,
    external_url: video.external_url,
  }
}

/**
 * Get unique categories from posts, with fallback
 */
export function extractCategories(posts: BlogPost[]): string[] {
  const categories = new Set(
    posts
      .filter((p) => p.category)
      .map((p) => p.category as string)
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
      .filter((p) => p.postType)
      .map((p) => p.postType as string)
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
      const aPriority = a.priority === "critical" ? 4 : a.priority === "high" ? 3 : a.priority === "medium" ? 2 : 1
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
    .filter((p) => p.postType === mediaType)
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

/**
 * Timeline grouping structure
 */
export interface TimelineGroup {
  year: number
  month: number
  monthLabel: string
  records: ArchiveRecord[]
}

/**
 * Group records by year and month for timeline display
 */
export function groupRecordsByYearMonth(records: ArchiveRecord[]): TimelineGroup[] {
  const groups = new Map<string, { year: number; month: number; records: ArchiveRecord[] }>()

  for (const record of records) {
    const date = new Date(record.published_at)
    const year = date.getFullYear()
    const month = date.getMonth() + 1
    const key = `${year}-${String(month).padStart(2, "0")}`

    if (!groups.has(key)) {
      groups.set(key, { year, month, records: [] })
    }

    groups.get(key)!.records.push(record)
  }

  return Array.from(groups.values())
    .map((g) => ({
      ...g,
      monthLabel: new Date(g.year, g.month - 1).toLocaleString("default", { month: "long", year: "numeric" }),
    }))
    .sort((a, b) => b.year - a.year || b.month - a.month)
}

/**
 * Apply multiple filters to timeline records
 */
export interface TimelineFilters {
  year?: number
  month?: number
  category?: string
  tag?: string
  source?: string
  mediaType?: string
  priority?: string
  search?: string
}

export function filterTimelineRecords(records: ArchiveRecord[], filters: TimelineFilters): ArchiveRecord[] {
  return records.filter((record) => {
    // Year filter
    if (filters.year) {
      const year = new Date(record.published_at).getFullYear()
      if (year !== filters.year) return false
    }

    // Month filter (requires year)
    if (filters.month && filters.year) {
      const date = new Date(record.published_at)
      if (date.getFullYear() !== filters.year || date.getMonth() + 1 !== filters.month) return false
    }

    // Category filter
    if (filters.category && record.category !== filters.category) return false

    // Tag filter
    if (filters.tag && !record.tags.includes(filters.tag)) return false

    // Source filter
    if (filters.source && record.source_name !== filters.source) return false

    // Media type filter
    if (filters.mediaType && record.media_type !== filters.mediaType) return false

    // Priority filter
    if (filters.priority) {
      // Priority would need to be added to ArchiveRecord schema - for now skip
    }

    // Search filter
    if (filters.search) {
      const q = filters.search.toLowerCase()
      if (
        !record.title.toLowerCase().includes(q) &&
        !record.excerpt.toLowerCase().includes(q) &&
        !(record.tags || []).some((t) => t.toLowerCase().includes(q))
      ) {
        return false
      }
    }

    return true
  })
}

/**
 * Get timeline statistics
 */
export interface TimelineStats {
  totalRecords: number
  yearRange: [number, number]
  categories: number
  tags: number
  sources: number
  mediaTypes: number
}

export function getTimelineStats(records: ArchiveRecord[]): TimelineStats {
  const years = records.map((r) => new Date(r.published_at).getFullYear())
  const categories = new Set(records.map((r) => r.category))
  const tags = new Set<string>()
  const sources = new Set(records.map((r) => r.source_name).filter(Boolean))
  const mediaTypes = new Set(records.map((r) => r.media_type).filter(Boolean))

  for (const record of records) {
    record.tags.forEach((t) => tags.add(t))
  }

  const yearRange: [number, number] = [Math.min(...years), Math.max(...years)]

  return {
    totalRecords: records.length,
    yearRange,
    categories: categories.size,
    tags: tags.size,
    sources: sources.size,
    mediaTypes: mediaTypes.size,
  }
}
