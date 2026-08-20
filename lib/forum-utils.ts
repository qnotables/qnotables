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

// ─── Desks (taxonomy-aligned) ───────────────────────────────────────────────
// The 11 controlled desk values shared with lib/taxonomy.ts. Used for the
// forum's desk filter and the `desk` column on forum_threads. Kept as a local
// constant (rather than importing DESKS) so this module stays dependency-free
// for both server and client bundles.

export interface ForumDesk {
  slug: string
  label: string
}

export const FORUM_DESKS: ForumDesk[] = [
  { slug: "notables", label: "Notables" },
  { slug: "world", label: "World" },
  { slug: "politics", label: "Politics" },
  { slug: "defense", label: "Defense" },
  { slug: "economy", label: "Economy" },
  { slug: "tech", label: "Tech" },
  { slug: "science", label: "Science" },
  { slug: "energy", label: "Energy" },
  { slug: "culture", label: "Culture" },
  { slug: "crime", label: "Crime" },
  { slug: "other", label: "Other" },
]

const FORUM_DESK_SLUGS = new Set(FORUM_DESKS.map((d) => d.slug))

/** Canonical desk slug for a raw value — null/unknown → "other". */
export function normalizeDeskSlug(raw: string | null | undefined): string {
  if (!raw || !raw.trim()) return "other"
  const trimmed = raw.trim().toLowerCase()
  if (FORUM_DESK_SLUGS.has(trimmed)) return trimmed
  const byLabel = FORUM_DESKS.find((d) => d.label.toLowerCase() === trimmed)
  return byLabel?.slug ?? "other"
}

export function getDeskLabel(slug: string | null | undefined): string {
  const s = normalizeDeskSlug(slug)
  return FORUM_DESKS.find((d) => d.slug === s)?.label ?? "Other"
}

// ─── Title validation / blocklist ───────────────────────────────────────────
// Titles that are clearly test/placeholder/empty junk. Used to warn on thread
// creation and to surface candidates in the admin cleanup tool. NEVER used to
// auto-delete — only to flag.

const TITLE_BLOCKLIST_EXACT = new Set([
  "test",
  "testing",
  "test123",
  "test 123",
  "asdf",
  "asdfasdf",
  "qwerty",
  "untitled",
  "no title",
  "title",
  "new thread",
  "aaa",
  "aaaa",
  "hello",
  "hi",
  "...",
  ".",
  "delete",
  "ignore",
  "placeholder",
  "example",
  "sample",
])

/**
 * Returns a reason string when a title looks like junk/test content,
 * otherwise null. Purely advisory — callers decide what to do with it.
 */
export function checkTitleQuality(rawTitle: string): string | null {
  const title = rawTitle.trim()
  if (title.length === 0) return "Title is empty."
  if (title.length < 3) return "Title is too short (fewer than 3 characters)."
  const lower = title.toLowerCase()
  if (TITLE_BLOCKLIST_EXACT.has(lower)) return `"${title}" looks like a placeholder or test title.`
  // Single repeated character e.g. "aaaaa", "!!!!!"
  if (/^(.)\1{2,}$/.test(title)) return "Title is a single repeated character."
  // No letters or numbers at all (only punctuation/symbols)
  if (!/[a-z0-9]/i.test(title)) return "Title has no letters or numbers."
  // Keyboard-mash heuristic: long run of consonants with no vowel
  if (/^[bcdfghjklmnpqrstvwxyz]{6,}$/i.test(lower)) return "Title looks like random keyboard input."
  return null
}

export function isLowQualityTitle(rawTitle: string): boolean {
  return checkTitleQuality(rawTitle) !== null
}

// ─── Slug generation ──────────────────────────────────────────────────────────

/** Base slug from a title: lowercased, alphanumeric + hyphens, trimmed. */
export function slugifyTitle(title: string): string {
  return title
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80)
    .replace(/-+$/g, "")
}

/**
 * Generate a thread slug from a title plus a uniqueness suffix (typically the
 * first 8 chars of the row UUID). Falls back to "thread" when the title has no
 * slug-safe characters so we never produce an empty or bare-suffix slug.
 */
export function generateThreadSlug(title: string, uniqueSuffix: string): string {
  const base = slugifyTitle(title) || "thread"
  const suffix = uniqueSuffix.trim().toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 12)
  return suffix ? `${base}-${suffix}` : base
}

export function normalizeCategoryName(raw: string | null | undefined): string {
  if (!raw || !raw.trim()) return "Other"
  const trimmed = raw.trim()
  const exact = FORUM_CATEGORIES.find((c) => c.name === trimmed || c.slug === trimmed.toLowerCase())
  return exact?.name ?? "Other"
}

/** Canonical slug for a raw category value — null/unknown → "other". */
export function normalizeCategorySlug(raw: string | null | undefined): string {
  if (!raw || !raw.trim()) return "other"
  const trimmed = raw.trim().toLowerCase()
  const exact = FORUM_CATEGORIES.find((c) => c.slug === trimmed || c.name.toLowerCase() === trimmed)
  return exact?.slug ?? "other"
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

// Minimal shape for a Tiptap JSON node — just enough to walk text runs.
// Kept local (rather than imported) so this module stays dependency-free.
interface TiptapNode {
  type?: string
  text?: string
  content?: TiptapNode[]
}

/** Walk a Tiptap JSON doc and collect only its text runs, skipping node attrs
 *  (embedBlock/videoBlock/image URLs, provider names, etc). */
function extractTiptapText(nodes?: TiptapNode[]): string {
  if (!nodes) return ""
  let out = ""
  for (const node of nodes) {
    if (typeof node.text === "string") out += node.text + " "
    if (node.content) out += extractTiptapText(node.content) + " "
  }
  return out
}

/** Strips markdown syntax and returns plain text suitable for excerpts. */
export function buildExcerpt(raw: string, maxLen = 180): string {
  // Thread bodies are stored as Tiptap JSON. Regex-stripping raw JSON leaks
  // node attrs (e.g. embedBlock originalUrl) straight into the excerpt, so
  // extract the actual text runs first when the body looks like a Tiptap doc.
  const trimmed = raw.trim()
  if (trimmed.startsWith("{") && trimmed.includes('"type":"doc"')) {
    try {
      const doc = JSON.parse(trimmed) as TiptapNode
      const plain = extractTiptapText(doc.content).replace(/\s+/g, " ").trim()
      if (plain.length <= maxLen) return plain
      const truncated = plain.slice(0, maxLen)
      const lastSpace = truncated.lastIndexOf(" ")
      return (lastSpace > maxLen * 0.7 ? truncated.slice(0, lastSpace) : truncated) + "…"
    } catch {
      // fall through to markdown stripping below
    }
  }

  let text = raw
    // Remove HTML comments — legacy embed markers (e.g. <!-- IFRAMEEMBED: {...} -->)
    // and any other leftover comment-encoded metadata
    .replace(/<!--[\s\S]*?-->/g, "")
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

export type VideoEmbed =
  | { type: "youtube"; videoId: string }
  | { type: "rumble"; embedId: string }
  | { type: "odysee"; path: string }
  | { type: "direct"; url: string }

/**
 * Extract the first embeddable video from a post body.
 * Handles YouTube (youtube.com/watch, youtu.be, /embed/, youtube-nocookie.com),
 * Rumble (rumble.com/embed/ and /v... share links),
 * Odysee (odysee.com share links), and bare direct video files.
 */
export function extractFirstVideo(body: string): VideoEmbed | null {
  // YouTube — covers all four URL shapes:
  //   watch?v=ID  •  watch?feature=…&v=ID  •  /embed/ID  •  youtu.be/ID
  //   also youtube-nocookie.com/embed/ID
  const ytWatchRe = /https?:\/\/(?:www\.)?youtube(?:-nocookie)?\.com\/watch\?(?:[^\s"'<#]*&)?v=([A-Za-z0-9_-]{11})/
  const ytEmbedRe = /https?:\/\/(?:www\.)?youtube(?:-nocookie)?\.com\/embed\/([A-Za-z0-9_-]{11})/
  const ytShortRe = /https?:\/\/(?:www\.)?youtu\.be\/([A-Za-z0-9_-]{11})/

  const ytMatch =
    body.match(ytEmbedRe) ||  // prefer existing embed URLs first (keep ?rel=0 etc.)
    body.match(ytWatchRe) ||
    body.match(ytShortRe)
  if (ytMatch) return { type: "youtube", videoId: ytMatch[1] }

  // Rumble — embed URL first, then share URL
  const rumbleEmbed = body.match(/https?:\/\/(?:www\.)?rumble\.com\/embed\/([A-Za-z0-9_-]+)(?:\/|\?|$|\s)/)
  if (rumbleEmbed) return { type: "rumble", embedId: rumbleEmbed[1] }

  const rumbleShare = body.match(/https?:\/\/(?:www\.)?rumble\.com\/(v[A-Za-z0-9]+)(?:[-/?#\s]|$)/)
  if (rumbleShare) return { type: "rumble", embedId: rumbleShare[1] }

  // Odysee
  const odyseeMatch = body.match(/https?:\/\/(?:www\.)?odysee\.com\/([@A-Za-z0-9:_-]+\/[A-Za-z0-9:_-]+)/)
  if (odyseeMatch) return { type: "odysee", path: odyseeMatch[1] }

  // Direct video file
  const directMatch = body.match(/https?:\/\/\S+\.(?:mp4|webm|ogg|mov|m4v)(?:\?[^\s]*)?/i)
  if (directMatch) return { type: "direct", url: directMatch[0] }

  return null
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
 * - Convert bare image URLs on their own line to ![img](url) so they render
 * - Turn bare social media URLs into link-only markdown (not img syntax)
 * - Validate markdown images: strip unsafe or social-media image src
 */
export function preprocessBody(raw: string): string {
  let text = raw

  // Remove bare !image commands (not preceded by [ or followed by ()
  text = text.replace(/(?<!\[)!image(?!\()\s*/gi, "")

  // Convert bare image URLs that sit alone on a line into markdown images.
  // Uses a negative look-behind to skip URLs already inside ![...](...) or [...](...).
  // Matches: https://example.com/photo.jpg  (with optional query string)
  text = text.replace(
    /(?<!\]\()(?<!!)\b(https?:\/\/\S+\.(?:jpg|jpeg|png|webp|gif|avif)(?:\?[^\s]*)?)\b/gim,
    (match, url, _offset, _str) => {
      if (isSocialMediaUrl(url)) return match
      // If the line is just this URL (possibly with surrounding whitespace), wrap it
      return `![image](${url})`
    },
  )

  // Replace markdown images that point at social-media pages (not direct images)
  // e.g. ![image](https://truthsocial.com/post/123) → just a link
  text = text.replace(/!\[([^\]]*)\]\((https?:\/\/[^\)]+)\)/g, (match, alt, url) => {
    if (isSocialMediaUrl(url) && !isDirectImageUrl(url)) {
      return `[${alt || url}](${url})`
    }
    return match
  })

  return text
}
