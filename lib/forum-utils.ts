/**
 * Forum utilities for HOT AND FRESH Town Hall.
 * Shared between server components, actions, and client helpers.
 */

// ─── Categories ───────────────────────────────────────────────────────────────

export interface ForumCategory {
  name: string
  slug: string
  description: string
}

export const FORUM_CATEGORIES: ForumCategory[] = [
  { name: "Notables", slug: "notables", description: "Key drops and notable posts." },
  { name: "World", slug: "world", description: "Global events and international news." },
  { name: "Politics", slug: "politics", description: "Domestic and international politics." },
  { name: "Defense", slug: "defense", description: "Military, intelligence, and national security." },
  { name: "Economy", slug: "economy", description: "Markets, finance, and economic policy." },
  { name: "Tech", slug: "tech", description: "Technology, AI, and digital platforms." },
  { name: "Science", slug: "science", description: "Research, medicine, and natural phenomena." },
  { name: "Energy", slug: "energy", description: "Oil, gas, renewables, and energy policy." },
  { name: "Election Integrity", slug: "election-integrity", description: "Voting, elections, and electoral systems." },
  { name: "Border Security", slug: "border-security", description: "Immigration, border policy, and enforcement." },
  { name: "Corruption", slug: "corruption", description: "Government corruption and accountability." },
  { name: "Crime", slug: "crime", description: "Criminal activity, justice, and law enforcement." },
  { name: "Faith", slug: "faith", description: "Religion, spirituality, and culture of belief." },
  { name: "Culture", slug: "culture", description: "Arts, media, society, and cultural commentary." },
  { name: "Other", slug: "other", description: "Anything that doesn't fit another category." },
]

export function getCategoryBySlug(slug: string): ForumCategory | undefined {
  return FORUM_CATEGORIES.find((c) => c.slug === slug)
}

export function normalizeCategoryName(raw: string | null | undefined): string | null {
  if (!raw) return null
  const trimmed = raw.trim()
  // Try exact match first
  const exact = FORUM_CATEGORIES.find((c) => c.name === trimmed || c.slug === trimmed.toLowerCase())
  return exact?.name ?? trimmed
}

// ─── Sort options ─────────────────────────────────────────────────────────────

export type SortOption = "latest" | "newest" | "most-replies" | "featured" | "pinned"

export const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "latest", label: "Latest Activity" },
  { value: "newest", label: "Newest" },
  { value: "most-replies", label: "Most Replies" },
  { value: "featured", label: "Featured" },
  { value: "pinned", label: "Pinned" },
]

// ─── Content analysis ─────────────────────────────────────────────────────────

const SOCIAL_DOMAINS = [
  "twitter.com", "x.com", "t.co",
  "truthsocial.com",
  "facebook.com", "fb.com",
  "telegram.org", "t.me",
  "instagram.com",
  "tiktok.com",
  "youtube.com", "youtu.be",
  "reddit.com",
  "linkedin.com",
]

const DIRECT_IMAGE_RE = /\.(jpg|jpeg|png|webp|gif|avif|svg)(\?[^\s]*)?$/i

export function isSocialMediaUrl(url: string): boolean {
  try {
    const host = new URL(url).hostname.replace(/^www\./, "")
    return SOCIAL_DOMAINS.some((d) => host === d || host.endsWith("." + d))
  } catch {
    return false
  }
}

export function isDirectImageUrl(url: string): boolean {
  try {
    const clean = url.split("?")[0]
    return DIRECT_IMAGE_RE.test(clean)
  } catch {
    return false
  }
}

/** Strips markdown syntax and returns plain text suitable for excerpts. */
export function buildExcerpt(raw: string, maxLen = 180): string {
  let text = raw
    // Remove fenced code blocks entirely
    .replace(/```[\s\S]*?```/g, "")
    // Remove inline code
    .replace(/`[^`]+`/g, "")
    // Remove markdown images — ![alt](url)
    .replace(/!\[[^\]]*\]\([^\)]*\)/g, "")
    // Remove !image standalone command
    .replace(/^!image\s*$/gim, "")
    // Remove bare URLs on their own line (likely social pastes)
    .replace(/^https?:\/\/\S+\s*$/gim, "")
    // Remove markdown links [text](url) → text
    .replace(/\[([^\]]+)\]\([^\)]*\)/g, "$1")
    // Remove bold/italic markers
    .replace(/[*_]{1,3}/g, "")
    // Remove heading markers
    .replace(/^#{1,6}\s+/gm, "")
    // Remove blockquote markers
    .replace(/^>\s*/gm, "")
    // Remove list markers
    .replace(/^[-*+]\s+/gm, "")
    .replace(/^\d+\.\s+/gm, "")
    // Collapse whitespace
    .replace(/\s+/g, " ")
    .trim()

  if (text.length <= maxLen) return text
  const truncated = text.slice(0, maxLen)
  const lastSpace = truncated.lastIndexOf(" ")
  return (lastSpace > maxLen * 0.7 ? truncated.slice(0, lastSpace) : truncated) + "…"
}

export interface MediaBadges {
  hasImages: boolean
  hasLinks: boolean
  hasSocialLinks: boolean
  hasVideo: boolean
}

/** Detect what kinds of media a post body contains. */
export function detectMediaBadges(body: string): MediaBadges {
  const mdImages = /!\[[^\]]*\]\((https?:\/\/[^\)]+)\)/g
  const allUrls = /https?:\/\/[^\s)>"]+/g

  const urls: string[] = []
  let m: RegExpExecArray | null
  while ((m = allUrls.exec(body)) !== null) urls.push(m[0])

  const mdImageUrls: string[] = []
  while ((m = mdImages.exec(body)) !== null) mdImageUrls.push(m[1])

  const hasImages =
    mdImageUrls.some((u) => isDirectImageUrl(u)) ||
    /!\[.*?\]\(/.test(body)

  const hasLinks = urls.some((u) => !isDirectImageUrl(u))
  const hasSocialLinks = urls.some(isSocialMediaUrl)
  const hasVideo = /\.(mp4|webm|ogg|mov|m4v)(\?[^\s]*)?/i.test(body)

  return { hasImages, hasLinks, hasSocialLinks, hasVideo }
}

/** Extract the first direct-image URL from a post body (for thumbnails). */
export function extractFirstImage(body: string): string | null {
  // Prefer markdown images
  const mdMatch = body.match(/!\[[^\]]*\]\((https?:\/\/[^\)]+)\)/)
  if (mdMatch) {
    const url = mdMatch[1]
    if (isDirectImageUrl(url) && !isSocialMediaUrl(url)) return url
  }
  // Fall back to bare URLs ending in image extension
  const plainMatch = body.match(/https?:\/\/\S+\.(?:jpg|jpeg|png|webp|gif)(?:\?[^\s]*)?/i)
  if (plainMatch) return plainMatch[0]
  return null
}

/** Extract all bare URLs from body that are not embedded markdown images. */
export function extractBareUrls(body: string): string[] {
  const mdImageUrls = new Set<string>()
  const mdImgRe = /!\[[^\]]*\]\((https?:\/\/[^\)]+)\)/g
  let m: RegExpExecArray | null
  while ((m = mdImgRe.exec(body)) !== null) mdImageUrls.add(m[1])

  const mdLinkUrls = new Set<string>()
  const mdLinkRe = /\[([^\]]+)\]\((https?:\/\/[^\)]+)\)/g
  while ((m = mdLinkRe.exec(body)) !== null) mdLinkUrls.add(m[2])

  const allUrlRe = /https?:\/\/[^\s)"'<>]+/g
  const seen = new Set<string>()
  const results: string[] = []

  while ((m = allUrlRe.exec(body)) !== null) {
    const url = m[0].replace(/[.,;:!?)]+$/, "") // strip trailing punctuation
    if (!seen.has(url) && !mdImageUrls.has(url)) {
      seen.add(url)
      results.push(url)
    }
  }
  return results
}

/** Parse tags from a comma-separated or space-separated string. */
export function parseTags(raw: string): string[] {
  return raw
    .split(/[,\s]+/)
    .map((t) => t.replace(/^#/, "").trim().toLowerCase())
    .filter((t) => t.length > 0 && t.length <= 32)
    .slice(0, 8)
}

/** Serialize tags array to a single stored string (comma-separated). */
export function serializeTags(tags: string[]): string {
  return tags.join(", ")
}

// ─── Preprocess body before rendering ────────────────────────────────────────

/**
 * Sanitize a post body before passing to the Markdown renderer:
 * - Remove bare `!image` commands (legacy artifact)
 * - Turn bare social media URLs into link-only markdown (not img syntax)
 * - Validate markdown images: strip unsafe or social-media image src
 */
export function preprocessBody(raw: string): string {
  let text = raw

  // Remove bare !image commands (not preceded by [ or followed by ()
  text = text.replace(/(?<!\[)!image(?!\()\s*/gi, "")

  // Replace markdown images that point at social-media pages (not direct images)
  // e.g. ![image](https://truthsocial.com/post/123) → just a link
  text = text.replace(/!\[([^\]]*)\]\((https?:\/\/[^\)]+)\)/g, (match, alt, url) => {
    if (isSocialMediaUrl(url) && !isDirectImageUrl(url)) {
      // Render as a plain link instead of broken image
      return `[${alt || url}](${url})`
    }
    return match
  })

  return text
}
