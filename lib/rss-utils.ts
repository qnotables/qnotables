/**
 * RSS / Feed core utilities for HOT AND FRESH.
 *
 * Everything here is defensive: a single bad record, missing image, or
 * unset environment variable must never crash the feed. Functions fail
 * safely and fall back to sane defaults.
 *
 * Public branding is ALWAYS "HOT AND FRESH". No internal project names
 * are ever exposed in feed output, metadata, or share links.
 */

/* ----------------------------- Branding ----------------------------- */

export const FEED_TITLE = "HOT AND FRESH"
export const FEED_DESCRIPTION = "Fresh drops. Hot leads. Organized for the record."
export const FEED_LANGUAGE = "en-us"
export const DEFAULT_FEED_IMAGE = "/images/hot-and-fresh-default-feed.png"

/* Field fallbacks */
export const FALLBACK_TITLE = "Untitled Archive Record"
export const FALLBACK_DESCRIPTION = "Archived HOT AND FRESH record."
export const FALLBACK_CATEGORY = "Archive"
export const FALLBACK_AUTHOR = "HOT AND FRESH Desk"

/* ----------------------------- Site URL ----------------------------- */

/**
 * Resolve the canonical public site URL. Prefers NEXT_PUBLIC_SITE_URL,
 * falls back to other Vercel-provided URLs, and finally a safe default.
 * Always returns an absolute origin with NO trailing slash.
 */
export function getSiteUrl(): string {
  const candidates = [
    process.env.NEXT_PUBLIC_SITE_URL,
    process.env.NEXT_PUBLIC_APP_URL,
    process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : undefined,
    process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined,
  ].filter(Boolean) as string[]

  let raw = candidates[0] || "https://hotandfresh.news"

  // Ensure a protocol is present.
  if (!/^https?:\/\//i.test(raw)) {
    raw = `https://${raw}`
  }

  // Strip trailing slash(es).
  return raw.replace(/\/+$/, "")
}

/** True when a real public site URL has been configured by the operator. */
export function isSiteUrlConfigured(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL)
}

/* ----------------------------- XML helpers ----------------------------- */

/** Escape the five XML predefined entities. Safe on any input. */
export function escapeXml(value: unknown): string {
  if (value === null || value === undefined) return ""
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;")
}

/**
 * Wrap content in a CDATA section, neutralizing any literal "]]>"
 * terminators so the XML can never be broken by the payload.
 */
export function toCData(value: unknown): string {
  const text = value === null || value === undefined ? "" : String(value)
  const safe = text.replace(/]]>/g, "]]]]><![CDATA[>")
  return `<![CDATA[${safe}]]>`
}

/* ----------------------------- URL helpers ----------------------------- */

/** Generic URL validity check. Only http/https are considered valid. */
export function isValidUrl(value?: string | null): boolean {
  if (!value || typeof value !== "string") return false
  const trimmed = value.trim()
  if (!trimmed) return false
  try {
    const url = new URL(trimmed, getSiteUrl())
    return url.protocol === "http:" || url.protocol === "https:"
  } catch {
    return false
  }
}

const UNSAFE_PROTOCOLS = ["javascript:", "data:", "file:", "vbscript:", "blob:"]

/**
 * True only for well-formed ABSOLUTE http(s) URLs (must include "://").
 * Used for external source attribution where relative/garbage values
 * like "n/a" or "https:example.com" must be rejected.
 */
export function isAbsoluteExternalUrl(value?: string | null): boolean {
  if (!value || typeof value !== "string") return false
  const trimmed = value.trim()
  if (!/^https?:\/\//i.test(trimmed)) return false
  try {
    const url = new URL(trimmed)
    return (url.protocol === "http:" || url.protocol === "https:") && Boolean(url.hostname)
  } catch {
    return false
  }
}

/**
 * Validate an image URL for safe inclusion in the feed.
 * Rejects unsafe protocols and obviously malformed values.
 */
export function isSafeImageUrl(value?: string | null): boolean {
  if (!value || typeof value !== "string") return false
  const trimmed = value.trim().toLowerCase()
  if (!trimmed) return false
  if (UNSAFE_PROTOCOLS.some((p) => trimmed.startsWith(p))) return false
  // Allow site-relative local paths (resolved later) and absolute http(s).
  if (trimmed.startsWith("/")) return true
  return isValidUrl(value)
}

/**
 * Convert a possibly-relative URL into an absolute URL using the site origin.
 * Returns undefined if the value cannot be safely resolved.
 */
export function normalizeAbsoluteUrl(value?: string | null): string | undefined {
  if (!value || typeof value !== "string") return undefined
  const trimmed = value.trim()
  if (!trimmed) return undefined
  try {
    const lower = trimmed.toLowerCase()
    if (UNSAFE_PROTOCOLS.some((p) => lower.startsWith(p))) return undefined
    const abs = new URL(trimmed, getSiteUrl() + "/")
    if (abs.protocol !== "http:" && abs.protocol !== "https:") return undefined
    return abs.toString()
  } catch {
    return undefined
  }
}

/* ----------------------------- Image resolver ----------------------------- */

export type ImageSource =
  | "cover_image"
  | "og_image"
  | "media_image"
  | "markdown_body"
  | "source_og"
  | "fallback"

export interface ResolvedImage {
  url: string
  source: ImageSource
}

/** Extract the first usable image URL from a Markdown / HTML body. */
export function firstImageFromBody(body?: string | null): string | undefined {
  if (!body || typeof body !== "string") return undefined

  // Tiptap JSON: walk nodes for image/videoBlock src attrs
  if (body.trimStart().startsWith("{")) {
    try {
      type TNode = { type?: string; attrs?: Record<string, string>; content?: TNode[] }
      const doc: TNode = JSON.parse(body)
      function walkTiptap(nodes?: TNode[]): string | undefined {
        if (!nodes) return undefined
        for (const node of nodes) {
          if (node.type === "image" && node.attrs?.src && isSafeImageUrl(node.attrs.src)) {
            return node.attrs.src
          }
          if (node.type === "videoBlock" && node.attrs?.src && isSafeImageUrl(node.attrs.src)) {
            return node.attrs.src
          }
          const found = walkTiptap(node.content)
          if (found) return found
        }
        return undefined
      }
      const tiptapImage = walkTiptap(doc.content)
      if (tiptapImage) return tiptapImage
    } catch {
      // fall through to Markdown/HTML parsing below
    }
  }

  // Markdown image: ![alt](url)
  const md = body.match(/!\[[^\]]*\]\(([^)\s]+)/)
  if (md?.[1] && isSafeImageUrl(md[1])) return md[1]
  // HTML image: <img src="url">
  const html = body.match(/<img[^>]+src=["']([^"']+)["']/i)
  if (html?.[1] && isSafeImageUrl(html[1])) return html[1]
  return undefined
}

export interface FeedRecordLike {
  cover_image?: string | null
  cover_image_url?: string | null
  og_image_url?: string | null
  media_image_url?: string | null
  body?: string | null
  source_url?: string | null
}

/**
 * Resolve the best feed image for a record following the documented
 * priority order. Never throws. Always returns an absolute, safe URL.
 *
 * Note: source-page Open Graph fetching is handled separately and
 * optionally by `fetchOpenGraphImage` to keep this function synchronous
 * and crash-proof.
 */
export function resolveFeedImage(record: FeedRecordLike): ResolvedImage {
  const candidates: Array<{ value?: string | null; source: ImageSource }> = [
    { value: record.cover_image ?? record.cover_image_url, source: "cover_image" },
    { value: record.og_image_url, source: "og_image" },
    { value: record.media_image_url, source: "media_image" },
    { value: firstImageFromBody(record.body), source: "markdown_body" },
  ]

  for (const candidate of candidates) {
    if (candidate.value && isSafeImageUrl(candidate.value)) {
      const abs = normalizeAbsoluteUrl(candidate.value)
      if (abs) return { url: abs, source: candidate.source }
    }
  }

  return {
    url: normalizeAbsoluteUrl(DEFAULT_FEED_IMAGE) || `${getSiteUrl()}${DEFAULT_FEED_IMAGE}`,
    source: "fallback",
  }
}

/**
 * Best-effort server-side fetch of a source page's Open Graph image.
 * Fails silently (returns undefined) on any error or timeout.
 */
export async function fetchOpenGraphImage(sourceUrl?: string | null): Promise<string | undefined> {
  if (!isAbsoluteExternalUrl(sourceUrl)) return undefined

  try {
    const parsed = new URL(sourceUrl as string)

    // SSRF protection: block loopback, link-local, and RFC-1918 private ranges
    const hostname = parsed.hostname.toLowerCase()
    const blockedHosts = ["localhost", "127.0.0.1", "0.0.0.0", "::1", "0000::1"]
    if (blockedHosts.includes(hostname)) return undefined

    const privateIpPatterns = [
      /^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/,           // 10.0.0.0/8
      /^172\.(1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3}$/, // 172.16.0.0/12
      /^192\.168\.\d{1,3}\.\d{1,3}$/,                // 192.168.0.0/16
      /^169\.254\.\d{1,3}\.\d{1,3}$/,                // link-local
      /^100\.(6[4-9]|[7-9]\d|1[01]\d|12[0-7])\.\d{1,3}\.\d{1,3}$/, // shared addr
      /^f[cd][0-9a-f]{2}:/i,                          // IPv6 ULA (fc00::/7)
      /^fe80:/i,                                       // IPv6 link-local
      /^\[?::1\]?$/,                                   // IPv6 loopback bracket form
    ]
    if (privateIpPatterns.some((re) => re.test(hostname))) return undefined

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 4000)

    const res = await fetch(parsed.toString(), {
      signal: controller.signal,
      headers: {
        "user-agent": "Mozilla/5.0 (compatible; HotAndFreshBot/1.0)",
        accept: "text/html,application/xhtml+xml",
      },
    }).finally(() => clearTimeout(timeout))

    if (!res.ok) return undefined

    const contentType = res.headers.get("content-type") || ""
    if (!contentType.toLowerCase().includes("text/html")) return undefined

    const html = await res.text()

    const patterns = [
      /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i,
      /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i,
      /<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["']/i,
      /<meta[^>]+content=["']([^"']+)["'][^>]+name=["']twitter:image["']/i,
    ]

    for (const pattern of patterns) {
      const match = html.match(pattern)
      if (match?.[1] && isSafeImageUrl(match[1])) {
        return normalizeAbsoluteUrl(match[1])
      }
    }

    return undefined
  } catch (err) {
    console.error("[v0] fetchOpenGraphImage failed:", err instanceof Error ? err.message : err)
    return undefined
  }
}

/* ----------------------------- Feed items ----------------------------- */

export interface FeedItem {
  id: string
  title: string
  slug: string
  link: string
  guid: string
  pubDate: string // RFC-822 / toUTCString
  pubDateIso: string | null
  description: string
  contentSnippet?: string
  category: string
  tags: string[]
  sourceName: string
  sourceUrl?: string
  author: string
  imageUrl?: string
  imageSource?: ImageSource
  warnings: string[]
}

/** Raw DB row shape we read from blog_posts (all optional / defensive). */
export interface RssDbRow {
  id?: string
  slug?: string
  title?: string
  subtitle?: string
  excerpt?: string
  body?: string
  category?: string
  post_type?: string
  status?: string
  featured?: boolean
  priority?: string
  source_name?: string
  source_url?: string
  cover_image?: string | null
  og_image_url?: string | null
  media_image_url?: string | null
  author_name?: string
  published_at?: string
  created_at?: string
  updated_at?: string
  include_in_rss?: boolean
  public_archive?: boolean
  tag?: string | null
  blog_post_tags?: Array<{ tag: string }>
}

function plainText(input?: string | null): string {
  if (!input) return ""
  return input
    .replace(/<[^>]*>/g, " ")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/[#*_>`~]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
}

/**
 * Map a raw DB row into a normalized FeedItem with all fallbacks applied.
 * Collects per-item warnings for diagnostics. Never throws.
 */
export function rowToFeedItem(row: RssDbRow): FeedItem {
  const site = getSiteUrl()
  const warnings: string[] = []

  const slug = (row.slug || "").trim()
  if (!slug) warnings.push("Missing slug")

  const title = (row.title || "").trim() || FALLBACK_TITLE
  if (!row.title) warnings.push("Missing title — using fallback")

  const link = slug ? `${site}/archives/${slug}` : `${site}/archives`
  const guid = row.id ? `${site}/archives/${slug || row.id}#${row.id}` : link

  // pubDate: ALWAYS prefer published_at. Never imported_at.
  let pubDateIso: string | null = null
  const rawDate = row.published_at
  if (rawDate) {
    const parsed = new Date(rawDate)
    if (!isNaN(parsed.getTime())) {
      pubDateIso = parsed.toISOString()
    } else {
      warnings.push("Invalid published_at — using build date")
    }
  } else {
    warnings.push("Missing published_at — using build date")
  }
  const pubDate = (pubDateIso ? new Date(pubDateIso) : new Date()).toUTCString()

  const excerpt = (row.excerpt || "").trim()
  const snippet = plainText(row.body).slice(0, 500)
  const description = excerpt || snippet || FALLBACK_DESCRIPTION
  if (!excerpt && !snippet) warnings.push("Missing description — using fallback")

  const category = (row.category || row.post_type || "").trim() || FALLBACK_CATEGORY

  const tags = [
    ...(typeof row.tag === "string" && row.tag.trim() ? [row.tag.trim()] : []),
    ...(Array.isArray(row.blog_post_tags) ? row.blog_post_tags.map((t) => t.tag).filter(Boolean) : []),
  ].filter((t, i, arr) => arr.indexOf(t) === i)

  const sourceName = (row.source_name || "").trim() || FEED_TITLE
  const sourceUrl = isAbsoluteExternalUrl(row.source_url) ? (row.source_url as string).trim() : undefined
  const author = (row.author_name || row.source_name || "").trim() || FALLBACK_AUTHOR

  const resolved = resolveFeedImage(row)
  if (resolved.source === "fallback") warnings.push("No usable image — using default feed image")

  return {
    id: row.id || slug || guid,
    title,
    slug,
    link,
    guid,
    pubDate,
    pubDateIso,
    description,
    contentSnippet: snippet || undefined,
    category,
    tags,
    sourceName,
    sourceUrl,
    author,
    imageUrl: resolved.url,
    imageSource: resolved.source,
    warnings,
  }
}

/* ----------------------------- Data fetch ----------------------------- */

async function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return null
  try {
    // Dynamic import keeps this module safe to include in client bundles
    // (ShareButtons imports createShareUrl from here).
    const { createClient } = await import("@supabase/supabase-js")
    return createClient(url, key)
  } catch {
    return null
  }
}

const SELECT_COLUMNS =
      "id, slug, title, subtitle, excerpt, body, tag, category, post_type, status, featured, priority, source_name, source_url, cover_image, og_image_url, author_name, published_at, created_at, updated_at, blog_post_tags(tag)"

/**
 * Fetch published, RSS-eligible records and map them into FeedItems.
 * Returns an empty array (never throws) when the DB is unavailable or empty.
 *
 * Filters applied defensively:
 *  - status = published
 *  - include_in_rss = true   (only if the column exists)
 *  - public_archive = true   (only if the column exists)
 */
export async function getFeedItems(limit = 50): Promise<FeedItem[]> {
  const supabase = await getSupabase()
  if (!supabase) {
    console.warn("[v0] RSS: Supabase not configured — returning empty feed")
    return []
  }

  // Try the strict query first (with optional flag columns). If those
  // columns don't exist, Postgres errors and we retry without them.
  async function query(withFlags: boolean) {
    let q = supabase!
      .from("blog_posts")
      .select(withFlags ? `${SELECT_COLUMNS}, include_in_rss, public_archive` : SELECT_COLUMNS)
      .eq("status", "published")
      .order("published_at", { ascending: false, nullsFirst: false })
      .limit(limit)
    if (withFlags) {
      q = q.eq("include_in_rss", true).eq("public_archive", true)
    }
    return q
  }

  let rows: RssDbRow[] = []
  try {
    const strict = await query(true)
    if (strict.error) {
      // Likely missing columns — fall back to status-only filter.
      console.warn("[v0] RSS: flag columns unavailable, falling back:", strict.error.message)
      const loose = await query(false)
      if (loose.error) {
        console.error("[v0] RSS: query failed:", loose.error.message)
        return []
      }
      rows = (loose.data || []) as RssDbRow[]
    } else {
      rows = (strict.data || []) as RssDbRow[]
    }
  } catch (err) {
    console.error("[v0] RSS: unexpected fetch error:", err instanceof Error ? err.message : err)
    return []
  }

  // Map rows to feed items, enriching with source OG images where needed
  const items = rows.map(rowToFeedItem)

  // For items that fell back to the default image AND have a source URL,
  // attempt to fetch the source page's OG image in parallel (capped at 10).
  const needsOgFetch = items.filter(
    (item, i) =>
      item.imageSource === "fallback" &&
      rows[i]?.source_url &&
      isAbsoluteExternalUrl(rows[i]?.source_url)
  )

  if (needsOgFetch.length > 0) {
    const fetchBatch = needsOgFetch.slice(0, 10)
    const ogImages = await Promise.allSettled(
      fetchBatch.map((item) => {
        const row = rows.find((r) => r.id === item.id)
        return fetchOpenGraphImage(row?.source_url)
      })
    )

    ogImages.forEach((result, i) => {
      if (result.status === "fulfilled" && result.value) {
        const item = fetchBatch[i]
        const idx = items.findIndex((it) => it.id === item.id)

        if (idx !== -1) {
          items[idx] = {
            ...items[idx],
            imageUrl: result.value,
            imageSource: "source_og",
            warnings: items[idx].warnings.filter((w) => !w.includes("default feed image")),
          }
        }
      }
    })
  }

  return items
}

/* ----------------------------- XML generation ----------------------------- */

/** Build a single <item> block for a FeedItem. */
function guessImageMimeType(url: string): string {
  try {
    const pathname = new URL(url).pathname.toLowerCase()

    if (pathname.endsWith(".png")) return "image/png"
    if (pathname.endsWith(".webp")) return "image/webp"
    if (pathname.endsWith(".gif")) return "image/gif"
    if (pathname.endsWith(".svg")) return "image/svg+xml"
    if (pathname.endsWith(".jpg") || pathname.endsWith(".jpeg")) return "image/jpeg"

    return "image/jpeg"
  } catch {
    return "image/jpeg"
  }
}
function feedItemToXml(item: FeedItem): string {
  const categories = [item.category, ...item.tags]
    .filter(Boolean)
    .map((c) => `    <category>${escapeXml(c)}</category>`)
    .join("\n")

  const media =
  item.imageUrl && isSafeImageUrl(item.imageUrl)
    ? `    <media:content url="${escapeXml(item.imageUrl)}" medium="image" />\n` +
      `    <enclosure url="${escapeXml(item.imageUrl)}" type="${escapeXml(
        guessImageMimeType(item.imageUrl),
      )}" />`
    : ""

  const source = item.sourceUrl
    ? `    <source url="${escapeXml(item.sourceUrl)}">${escapeXml(item.sourceName)}</source>`
    : ""

  const snippet = item.contentSnippet
    ? `    <content:encoded>${toCData(item.contentSnippet)}</content:encoded>`
    : ""

  return `  <item>
    <title>${escapeXml(item.title)}</title>
    <link>${escapeXml(item.link)}</link>
    <guid isPermaLink="false">${escapeXml(item.guid)}</guid>
    <pubDate>${escapeXml(item.pubDate)}</pubDate>
    <description>${toCData(item.description)}</description>
${categories}
    <author>${escapeXml(item.author)}</author>
${source}
${media}
${snippet}
  </item>`
    .split("\n")
    .filter((line) => line.trim().length > 0)
    .join("\n")
}

export interface GenerateRssOptions {
  managingEditor?: string
  webMaster?: string
}

/** Build a complete, valid RSS 2.0 document from feed items. */
export function generateRssXml(items: FeedItem[], options: GenerateRssOptions = {}): string {
  const site = getSiteUrl()
  const latest = items.find((i) => i.pubDateIso)?.pubDateIso
  const lastBuildDate = (latest ? new Date(latest) : new Date()).toUTCString()
  const feedImage = normalizeAbsoluteUrl(DEFAULT_FEED_IMAGE) || `${site}${DEFAULT_FEED_IMAGE}`

  const optionalEditor = options.managingEditor
    ? `    <managingEditor>${escapeXml(options.managingEditor)}</managingEditor>\n`
    : ""
  const optionalWebMaster = options.webMaster
    ? `    <webMaster>${escapeXml(options.webMaster)}</webMaster>\n`
    : ""

  const itemsXml = items.map(feedItemToXml).join("\n")

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:content="http://purl.org/rss/1.0/modules/content/" xmlns:media="http://search.yahoo.com/mrss/" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(FEED_TITLE)}</title>
    <link>${escapeXml(site)}</link>
    <atom:link href="${escapeXml(site)}/feed.xml" rel="self" type="application/rss+xml" />
    <description>${escapeXml(FEED_DESCRIPTION)}</description>
    <language>${FEED_LANGUAGE}</language>
    <lastBuildDate>${lastBuildDate}</lastBuildDate>
    <generator>HOT AND FRESH Research Wire</generator>
${optionalEditor}${optionalWebMaster}    <image>
      <title>${escapeXml(FEED_TITLE)}</title>
      <url>${escapeXml(feedImage)}</url>
      <link>${escapeXml(site)}</link>
    </image>
${itemsXml}
  </channel>
</rss>`
}

/* ----------------------------- Validation ----------------------------- */

export interface ValidationResult {
  valid: boolean
  itemCount: number
  errors: string[]
  warnings: string[]
  lastChecked: string
}

/** Validate an array of feed items for structural and content correctness. */
export function validateRssItems(items: FeedItem[]): ValidationResult {
  const errors: string[] = []
  const warnings: string[] = []

  try {
    if (items.length === 0) {
      warnings.push("Feed is empty — no published RSS-eligible records found")
    }

    const seenGuids = new Set<string>()
    const seenLinks = new Set<string>()

    items.forEach((item, index) => {
      const label = `Item ${index + 1} (${item.slug || item.id || "unknown"})`

      if (!item.title || item.title === FALLBACK_TITLE) {
        warnings.push(`${label}: missing or fallback title`)
      }
      if (!item.link || !isValidUrl(item.link)) {
        errors.push(`${label}: invalid or missing link`)
      }
      if (!item.guid) {
        errors.push(`${label}: missing GUID`)
      } else if (seenGuids.has(item.guid)) {
        errors.push(`${label}: duplicate GUID "${item.guid}"`)
      } else {
        seenGuids.add(item.guid)
      }
      if (item.link) {
        if (seenLinks.has(item.link)) {
          warnings.push(`${label}: duplicate link "${item.link}"`)
        } else {
          seenLinks.add(item.link)
        }
      }
      if (!item.pubDateIso) {
        warnings.push(`${label}: missing or invalid pubDate (using build date)`)
      }
      if (!item.description || item.description === FALLBACK_DESCRIPTION) {
        warnings.push(`${label}: missing or fallback description`)
      }
      if (item.imageUrl && !isSafeImageUrl(item.imageUrl)) {
        errors.push(`${label}: unsafe image URL`)
      }
      if (item.imageSource === "fallback") {
        warnings.push(`${label}: no record image — default feed image used`)
      }
      item.warnings.forEach((w) => warnings.push(`${label}: ${w}`))
    })
  } catch (err) {
    errors.push(`Validation crashed: ${err instanceof Error ? err.message : "unknown error"}`)
  }

  return {
    valid: errors.length === 0,
    itemCount: items.length,
    errors,
    warnings,
    lastChecked: new Date().toISOString(),
  }
}

/* ----------------------------- Share URLs ----------------------------- */

export interface ShareUrlParams {
  url: string
  title?: string
  excerpt?: string
  hashtags?: string[]
}

export type SharePlatform =
  | "twitter"
  | "facebook"
  | "truthsocial"
  | "email"
  | "telegram"
  | "linkedin"
  | "reddit"
  | "gab"
  | "gettr"

/**
 * Build a share URL for a given platform. Returns the canonical post URL
 * itself for unknown platforms so the caller never gets an empty string.
 */
export function createShareUrl(platform: SharePlatform, params: ShareUrlParams): string {
  const url = encodeURIComponent(params.url)
  const title = encodeURIComponent(params.title || FEED_TITLE)
  const text = encodeURIComponent(
    `${params.title || FEED_TITLE}${params.excerpt ? ` — ${params.excerpt}` : ""}`,
  )
  const tags = (params.hashtags || []).map((t) => t.replace(/^#/, "")).join(",")

  switch (platform) {
    case "twitter":
      return `https://twitter.com/intent/tweet?text=${title}&url=${url}${tags ? `&hashtags=${encodeURIComponent(tags)}` : ""}`
    case "facebook":
      return `https://www.facebook.com/sharer/sharer.php?u=${url}`
    case "truthsocial":
      return `https://truthsocial.com/share?text=${text}&url=${url}`
    case "telegram":
      return `https://t.me/share/url?url=${url}&text=${title}`
    case "linkedin":
      return `https://www.linkedin.com/sharing/share-offsite/?url=${url}`
    case "reddit":
      return `https://www.reddit.com/submit?url=${url}&title=${title}`
    case "gab":
      return `https://gab.com/compose?url=${url}&text=${title}`
    case "gettr":
      return `https://gettr.com/share?url=${url}&text=${title}`
    case "email":
      return `mailto:?subject=${title}&body=${text}%0A%0A${url}`
    default:
      return params.url
  }
}
