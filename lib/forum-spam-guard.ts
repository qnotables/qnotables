/**
 * lib/forum-spam-guard.ts
 *
 * Pure-TypeScript spam protection and content-analysis for the forum.
 * No external dependencies. Used server-side only.
 *
 * ─── MIGRATION SQL ────────────────────────────────────────────────────────────
 * Run the following once in the Supabase SQL editor to add the required columns:
 *
 *   -- forum_threads: pending queue for new users
 *   ALTER TABLE forum_threads
 *     ADD COLUMN IF NOT EXISTS is_pending BOOLEAN DEFAULT false;
 *
 *   -- forum_replies: per-reply hide + pending
 *   ALTER TABLE forum_replies
 *     ADD COLUMN IF NOT EXISTS is_hidden BOOLEAN DEFAULT false,
 *     ADD COLUMN IF NOT EXISTS is_pending BOOLEAN DEFAULT false;
 *
 *   -- site_settings: forum moderation config
 *   ALTER TABLE site_settings
 *     ADD COLUMN IF NOT EXISTS forum_moderation_mode BOOLEAN DEFAULT false,
 *     ADD COLUMN IF NOT EXISTS forum_max_links INT DEFAULT 8,
 *     ADD COLUMN IF NOT EXISTS forum_max_embeds INT DEFAULT 4;
 *
 *   -- moderation_flags: distinguish automatic vs manual flags
 *   ALTER TABLE moderation_flags
 *     ADD COLUMN IF NOT EXISTS auto_flagged BOOLEAN DEFAULT false;
 * ─────────────────────────────────────────────────────────────────────────────
 */

// ─── Constants ────────────────────────────────────────────────────────────────

export const SPAM_LIMITS = {
  /** Max links per post before hard-reject. Overrideable via site_settings. */
  MAX_LINKS_PER_POST: 8,
  /** Max embeds per post before hard-reject. Overrideable via site_settings. */
  MAX_EMBEDS_PER_POST: 4,
  /** Minimum ms between posts from the same user (30 s). */
  POST_COOLDOWN_MS: 30_000,
  /** Upload rate-limit window in ms (60 s). */
  UPLOAD_COOLDOWN_MS: 60_000,
  /** Max uploads per window per user (forum). Blog uploads use a separate, higher limit. */
  MAX_UPLOADS_PER_WINDOW: 3,
  /** Max uploads per window per user for blog/admin editors (higher to allow multi-image batches). */
  MAX_BLOG_UPLOADS_PER_WINDOW: 20,
  /** Days since account creation before user is considered "established". */
  NEW_USER_DAYS: 7,
  /** Post count below which a user is considered "new". */
  NEW_USER_POST_COUNT: 5,
} as const

// ─── In-memory rate-limit store ───────────────────────────────────────────────

interface RateLimitEntry {
  timestamps: number[]
  lastEvicted: number
}

// Capped LRU Map: never grows beyond MAX_ENTRIES.
const MAX_ENTRIES = 1_000
const rateLimitStore = new Map<string, RateLimitEntry>()

/**
 * Check whether a user is within their rate-limit quota.
 *
 * @param userId   - Supabase user ID
 * @param action   - Namespaced action key, e.g. "post" or "upload"
 * @param windowMs - The sliding window size in milliseconds
 * @param maxCount - Maximum allowed events within the window
 */
export function checkRateLimit(
  userId: string,
  action: string,
  windowMs: number,
  maxCount: number,
): { allowed: boolean; retryAfterMs: number } {
  const key = `${userId}:${action}`
  const now = Date.now()

  // Evict oldest entry when at capacity
  if (!rateLimitStore.has(key) && rateLimitStore.size >= MAX_ENTRIES) {
    let oldestKey = ""
    let oldestTime = Infinity
    for (const [k, v] of rateLimitStore) {
      if (v.lastEvicted < oldestTime) {
        oldestTime = v.lastEvicted
        oldestKey = k
      }
    }
    if (oldestKey) rateLimitStore.delete(oldestKey)
  }

  const entry = rateLimitStore.get(key) ?? { timestamps: [], lastEvicted: now }
  entry.lastEvicted = now

  // Slide window: remove timestamps older than windowMs
  const windowStart = now - windowMs
  entry.timestamps = entry.timestamps.filter((t) => t >= windowStart)

  if (entry.timestamps.length >= maxCount) {
    const oldest = entry.timestamps[0]
    const retryAfterMs = oldest + windowMs - now
    rateLimitStore.set(key, entry)
    return { allowed: false, retryAfterMs: Math.max(0, retryAfterMs) }
  }

  entry.timestamps.push(now)
  rateLimitStore.set(key, entry)
  return { allowed: true, retryAfterMs: 0 }
}

// ─── Link & embed counters ────────────────────────────────────────────────────

/** Count all HTTP(S) links in a body string (markdown links + bare URLs). */
export function countLinks(body: string): number {
  // Count markdown-style links [text](url) and bare https?:// URLs
  const mdLinks = (body.match(/\[[^\]]*\]\(https?:\/\/[^\)]+\)/g) ?? []).length
  const bareUrls = (body.match(/(?<!\()\bhttps?:\/\/[^\s)"'<>\]]+/g) ?? []).length
  return mdLinks + bareUrls
}

/** Count embed blocks in a body string (HTML comment style + Tiptap JSON nodes). */
export function countEmbeds(body: string): number {
  // Legacy HTML-comment style embeds
  const commentEmbeds = (body.match(/<!--\s*(VIDEO_EMBED|IFRAME_EMBED):/g) ?? []).length

  // Tiptap JSON embed nodes
  let tiptapEmbeds = 0
  if (body.trimStart().startsWith("{")) {
    try {
      const doc = JSON.parse(body)
      tiptapEmbeds = countTiptapNodes(doc, "embedBlock")
    } catch {
      // Not JSON — skip
    }
  }

  return commentEmbeds + tiptapEmbeds
}

function countTiptapNodes(node: unknown, type: string): number {
  if (!node || typeof node !== "object") return 0
  const n = node as Record<string, unknown>
  let count = n["type"] === type ? 1 : 0
  if (Array.isArray(n["content"])) {
    for (const child of n["content"]) count += countTiptapNodes(child, type)
  }
  return count
}

/** Returns { ok, count, max } for link check against a given limit. */
export function hasTooManyLinks(
  body: string,
  max = SPAM_LIMITS.MAX_LINKS_PER_POST,
): { ok: boolean; count: number; max: number } {
  const count = countLinks(body)
  return { ok: count <= max, count, max }
}

/** Returns { ok, count, max } for embed check against a given limit. */
export function hasTooManyEmbeds(
  body: string,
  max = SPAM_LIMITS.MAX_EMBEDS_PER_POST,
): { ok: boolean; count: number; max: number } {
  const count = countEmbeds(body)
  return { ok: count <= max, count, max }
}

// ─── Content safety checks ───────────────────────────────────────────────────

/**
 * Returns true if the body contains script injection patterns.
 * Hard-blocks <script, javascript: URIs, and data:text/html blobs.
 */
export function containsScriptTags(body: string): boolean {
  const lower = body.toLowerCase()
  return (
    lower.includes("<script") ||
    lower.includes("javascript:") ||
    lower.includes("data:text/html") ||
    lower.includes("vbscript:") ||
    lower.includes("onload=") ||
    lower.includes("onerror=")
  )
}

/**
 * Returns true if the body contains unsafe raw HTML that could inject content.
 * Blocks <iframe, <object, <embed, <form, <input, and inline event handlers.
 */
export function containsUnsafeHtml(body: string): boolean {
  const lower = body.toLowerCase()
  return (
    /<iframe[\s>]/i.test(body) ||
    /<object[\s>]/i.test(body) ||
    /<embed[\s>]/i.test(body) ||
    /<form[\s>]/i.test(body) ||
    /<input[\s>]/i.test(body) ||
    /\bon\w+\s*=/i.test(body) // onclick=, onmouseover=, etc.
  )
}

/**
 * Sanitize a post body before storage:
 * - Strip script / unsafe HTML injection patterns
 * - Normalize excessive whitespace
 * - Limit consecutive blank lines to 2
 */
export function sanitizeBody(body: string): string {
  let text = body

  // Strip <script>…</script> blocks entirely
  text = text.replace(/<script[\s\S]*?<\/script>/gi, "")

  // Strip javascript: and data: URIs from href/src attributes
  text = text.replace(/\s(href|src)\s*=\s*["']?(javascript:|data:)[^"'\s>]*/gi, "")

  // Strip inline event handlers from HTML-like attributes
  text = text.replace(/\s+on\w+\s*=\s*["'][^"']*["']/gi, "")
  text = text.replace(/\s+on\w+\s*=\s*[^\s>]*/gi, "")

  // Collapse more than 2 consecutive blank lines
  text = text.replace(/(\n\s*){3,}/g, "\n\n")

  // Trim leading/trailing whitespace
  return text.trim()
}

// ─── New-user detection ───────────────────────────────────────────────────────

interface MinimalProfile {
  created_at?: string | null
  post_count?: number | null
}

/**
 * Returns true if the profile indicates a new/untrusted user.
 * New = account < NEW_USER_DAYS days old OR post_count < NEW_USER_POST_COUNT.
 */
export function isNewUser(profile: MinimalProfile): boolean {
  const postCount = profile.post_count ?? 0
  if (postCount < SPAM_LIMITS.NEW_USER_POST_COUNT) return true

  if (profile.created_at) {
    const ageMs = Date.now() - new Date(profile.created_at).getTime()
    if (ageMs < SPAM_LIMITS.NEW_USER_DAYS * 24 * 60 * 60 * 1_000) return true
  }

  return false
}

// ─── Auto-flag ────────────────────────────────────────────────────────────────

/**
 * Returns a human-readable flag reason if the body should be auto-flagged,
 * or null if the body looks clean.
 */
export function flagBodyAutomatic(
  body: string,
  maxLinks = SPAM_LIMITS.MAX_LINKS_PER_POST,
  maxEmbeds = SPAM_LIMITS.MAX_EMBEDS_PER_POST,
): string | null {
  if (containsScriptTags(body)) return "Contains script tags or JavaScript injection"
  if (containsUnsafeHtml(body)) return "Contains unsafe HTML elements or event handlers"

  const links = hasTooManyLinks(body, maxLinks)
  if (!links.ok) return `Too many links (${links.count}/${links.max})`

  const embeds = hasTooManyEmbeds(body, maxEmbeds)
  if (!embeds.ok) return `Too many embeds (${embeds.count}/${embeds.max})`

  return null
}

// ─── Strip media from a body string ──────────────────────────────────────────

/**
 * Remove all embedded media from a post body while preserving text content:
 * - Markdown images: ![alt](url)
 * - HTML video elements
 * - Legacy VIDEO_EMBED / IFRAME_EMBED comment blocks
 * - Tiptap JSON: removes all image + embedBlock nodes
 */
export function stripMediaFromBody(body: string): string {
  // Try Tiptap JSON first
  if (body.trimStart().startsWith("{")) {
    try {
      const doc = JSON.parse(body)
      const cleaned = stripTiptapMedia(doc)
      return JSON.stringify(cleaned)
    } catch {
      // Fall through to Markdown stripping
    }
  }

  let text = body
  // Markdown images
  text = text.replace(/!\[[^\]]*\]\([^\)]+\)/g, "")
  // HTML video elements
  text = text.replace(/<video[\s\S]*?<\/video>/gi, "")
  // Legacy comment embeds
  text = text.replace(/<!--\s*(VIDEO_EMBED|IFRAME_EMBED):[\s\S]*?-->/g, "")
  // Bare image URLs on their own line
  text = text.replace(/^https?:\/\/\S+\.(?:jpg|jpeg|png|webp|gif|mp4|webm)(\?[^\s]*)?\s*$/gim, "")
  // Collapse excessive blank lines
  text = text.replace(/(\n\s*){3,}/g, "\n\n")

  return text.trim()
}

function stripTiptapMedia(node: unknown): unknown {
  if (!node || typeof node !== "object") return node
  const n = node as Record<string, unknown>

  // Remove image and embedBlock nodes entirely
  if (n["type"] === "image" || n["type"] === "embedBlock") {
    return null
  }

  if (Array.isArray(n["content"])) {
    const filtered = n["content"]
      .map((child) => stripTiptapMedia(child))
      .filter((child) => child !== null)
    return { ...n, content: filtered }
  }

  return n
}
