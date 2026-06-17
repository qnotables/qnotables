/**
 * Wix Blog Import Parser
 * Handles: Wix RSS feed XML, Wix Blog API JSON, manual JSON paste
 * Preserves original publish dates; sanitizes HTML.
 */

import DOMPurify from "isomorphic-dompurify"
import { generateSlug } from "@/lib/import-utils"
import type { ImportedPost } from "@/lib/import-parsers"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type WixImportWarning =
  | "missing_title"
  | "missing_date"
  | "duplicate_slug"
  | "missing_body"
  | "missing_image"
  | "invalid_source_url"
  | "unsafe_html_removed"

export interface WixPreviewRow {
  index: number
  title: string
  slug: string
  publishedAt: string | null
  category: string
  postType: string
  status: "draft" | "published"
  sourceUrl: string
  imageFound: boolean
  coverImageUrl: string | null
  warnings: WixImportWarning[]
  // The mapped ImportedPost ready for batchImportPosts
  post: ImportedPost
}

export interface WixParseOptions {
  defaultCategory?: string
  defaultPostType?: string
  defaultStatus?: "draft" | "published"
  includeInRss?: boolean
  existingSlugs?: Set<string>
}

// ---------------------------------------------------------------------------
// HTML sanitization
// ---------------------------------------------------------------------------

const ALLOWED_TAGS = [
  "p", "br", "strong", "b", "em", "i", "u", "s",
  "h1", "h2", "h3", "h4", "h5", "h6",
  "ul", "ol", "li", "blockquote", "pre", "code",
  "a", "img", "figure", "figcaption",
  "table", "thead", "tbody", "tr", "th", "td",
  "hr", "sup", "sub",
]

const ALLOWED_ATTR = [
  "href", "src", "alt", "title", "class",
  "width", "height", "rel", "target",
]

function sanitizeHtml(html: string): { clean: string; unsafeRemoved: boolean } {
  if (!html) return { clean: "", unsafeRemoved: false }
  const original = html
  const clean = DOMPurify.sanitize(html, {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
    FORCE_BODY: true,
  })
  // Force external links to open safely
  const secured = clean.replace(
    /<a\s([^>]*href=["'](https?:\/\/)[^"'>]+["'][^>]*)>/gi,
    (match, attrs) => {
      if (!attrs.includes("rel=")) {
        return `<a ${attrs} rel="noopener noreferrer nofollow" target="_blank">`
      }
      return match
    },
  )
  return { clean: secured, unsafeRemoved: secured.length < original.length * 0.9 }
}

// ---------------------------------------------------------------------------
// Date parsing
// ---------------------------------------------------------------------------

function parseWixDate(raw: string | number | undefined | null): string | null {
  if (!raw) return null

  // Unix ms timestamp
  if (typeof raw === "number") {
    return new Date(raw > 10000000000 ? raw : raw * 1000).toISOString()
  }

  // ISO / RFC 2822 / common formats
  try {
    const d = new Date(raw as string)
    if (!isNaN(d.getTime())) return d.toISOString()
  } catch {}

  return null
}

// ---------------------------------------------------------------------------
// Image extraction
// ---------------------------------------------------------------------------

function extractFirstImageFromHtml(html: string): string | null {
  const m = html.match(/<img[^>]+src=["']([^"']+)["']/i)
  return m?.[1] ?? null
}

function resolveWixImageUrl(raw: string | undefined | null): string | null {
  if (!raw) return null
  // Wix static image URLs sometimes look like: wix:image://v1/xxx~mv2.jpg/...
  // Normalize to usable https URL
  if (raw.startsWith("wix:image://")) {
    const parts = raw.replace("wix:image://v1/", "")
    const fileId = parts.split("/")[0].split("~")[0]
    return `https://static.wixstatic.com/media/${parts.split("/")[0]}`
  }
  if (raw.startsWith("http")) return raw
  return null
}

// ---------------------------------------------------------------------------
// Slug deduplication
// ---------------------------------------------------------------------------

function deduplicateWixSlug(base: string, seen: Set<string>): string {
  if (!seen.has(base)) {
    seen.add(base)
    return base
  }
  let counter = 2
  while (seen.has(`${base}-${counter}`)) counter++
  const slug = `${base}-${counter}`
  seen.add(slug)
  return slug
}

// ---------------------------------------------------------------------------
// RSS feed parser (Wix blog-feed.xml)
// ---------------------------------------------------------------------------

export function parseWixRss(
  xml: string,
  opts: WixParseOptions = {},
): WixPreviewRow[] {
  const {
    defaultCategory = "Archive",
    defaultPostType = "Field Note",
    defaultStatus = "draft",
    existingSlugs = new Set<string>(),
  } = opts

  // Parse XML in Node.js via regex (DOMParser not available server-side reliably)
  const seenSlugs = new Set<string>(existingSlugs)

  // Strip CDATA wrappers for easier parsing
  const stripped = xml
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")

  const itemMatches = [...stripped.matchAll(/<item>([\s\S]*?)<\/item>/gi)]
  const rows: WixPreviewRow[] = []

  itemMatches.forEach((match, index) => {
    const chunk = match[1]
    const warnings: WixImportWarning[] = []

    // --- title ---
    const rawTitle = (chunk.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] ?? "").trim()
    if (!rawTitle) warnings.push("missing_title")
    const title = rawTitle || `Untitled Post ${index + 1}`

    // --- slug ---
    const baseSlug = generateSlug(title)
    const slug = deduplicateWixSlug(baseSlug, seenSlugs)
    if (slug !== baseSlug) warnings.push("duplicate_slug")

    // --- link / source URL ---
    const rawLink = (chunk.match(/<link[^>]*>([\s\S]*?)<\/link>/i)?.[1] ?? "").trim()
    const sourceUrl = rawLink || ""
    if (rawLink && !/^https?:\/\//i.test(rawLink)) warnings.push("invalid_source_url")

    // --- pubDate ---
    const rawPubDate = (chunk.match(/<pubDate[^>]*>([\s\S]*?)<\/pubDate>/i)?.[1] ?? "").trim()
    const publishedAt = parseWixDate(rawPubDate)
    if (!publishedAt) warnings.push("missing_date")

    // --- description / body ---
    const rawDesc = (chunk.match(/<description[^>]*>([\s\S]*?)<\/description>/i)?.[1] ?? "").trim()
    const rawContent =
      (chunk.match(/<content:encoded[^>]*>([\s\S]*?)<\/content:encoded>/i)?.[1] ?? "").trim() ||
      rawDesc

    if (!rawContent) warnings.push("missing_body")

    const { clean: body, unsafeRemoved } = sanitizeHtml(rawContent || "")
    if (unsafeRemoved) warnings.push("unsafe_html_removed")

    const excerpt = rawDesc
      ? rawDesc.replace(/<[^>]*>/g, "").slice(0, 300)
      : body.replace(/<[^>]*>/g, "").slice(0, 300)

    // --- category ---
    const rawCategory = (chunk.match(/<category[^>]*>([\s\S]*?)<\/category>/i)?.[1] ?? "").trim()
    const category = rawCategory || defaultCategory

    // --- image ---
    // Priority: media:content > media:thumbnail > enclosure > first img in body
    const mediaContent = resolveWixImageUrl(
      chunk.match(/<media:content[^>]+url=["']([^"']+)["']/i)?.[1],
    )
    const mediaThumbnail = resolveWixImageUrl(
      chunk.match(/<media:thumbnail[^>]+url=["']([^"']+)["']/i)?.[1],
    )
    const enclosureImg = resolveWixImageUrl(
      chunk.match(/<enclosure[^>]+url=["']([^"']+)["'][^>]+type=["']image\//i)?.[1],
    )
    const bodyImg = extractFirstImageFromHtml(body)
    const coverImageUrl = mediaContent ?? mediaThumbnail ?? enclosureImg ?? bodyImg ?? null
    if (!coverImageUrl) warnings.push("missing_image")

    // --- post ---
    const post: ImportedPost = {
      title,
      slug,
      excerpt,
      body,
      category,
      tags: [],
      post_type: defaultPostType,
      status: defaultStatus,
      featured: false,
      priority: 0,
      published_at: publishedAt ? new Date(publishedAt) : null,
      original_created_at: publishedAt ? new Date(publishedAt) : null,
      source_url: sourceUrl,
      source_name: "Wix Blog Archive",
      original_source_url: sourceUrl,
      cover_image_url: coverImageUrl ?? undefined,
      author_name: "HOT AND FRESH",
    }

    rows.push({
      index,
      title,
      slug,
      publishedAt,
      category,
      postType: defaultPostType,
      status: defaultStatus,
      sourceUrl,
      imageFound: Boolean(coverImageUrl),
      coverImageUrl,
      warnings,
      post,
    })
  })

  return rows
}

// ---------------------------------------------------------------------------
// Wix API JSON parser
// ---------------------------------------------------------------------------

function normalizeWixJsonPost(
  item: any,
  index: number,
  opts: WixParseOptions,
  seenSlugs: Set<string>,
): WixPreviewRow {
  const {
    defaultCategory = "Archive",
    defaultPostType = "Field Note",
    defaultStatus = "draft",
  } = opts

  const warnings: WixImportWarning[] = []

  // title
  const rawTitle = (item.title || item.postPageTitle || "").trim()
  if (!rawTitle) warnings.push("missing_title")
  const title = rawTitle || `Untitled Post ${index + 1}`

  // slug
  const baseSlug = item.slug || generateSlug(title)
  const slug = deduplicateWixSlug(baseSlug, seenSlugs)
  if (slug !== baseSlug) warnings.push("duplicate_slug")

  // dates
  // Wix API fields: firstPublishedDate, createdDate, lastPublishedDate
  const publishedAt =
    parseWixDate(item.firstPublishedDate ?? item.publishedDate ?? item.firstPublished) ??
    parseWixDate(item.createdDate ?? item.created)
  const originalCreatedAt = parseWixDate(item.createdDate ?? item.created) ?? publishedAt
  if (!publishedAt) warnings.push("missing_date")

  // body
  const rawBody = item.content || item.richContent?.body || item.excerpt || ""
  if (!rawBody) warnings.push("missing_body")
  const { clean: body, unsafeRemoved } = sanitizeHtml(rawBody)
  if (unsafeRemoved) warnings.push("unsafe_html_removed")

  const rawExcerpt = item.excerpt || item.summary || ""
  const excerpt = rawExcerpt
    ? rawExcerpt.replace(/<[^>]*>/g, "").slice(0, 300)
    : body.replace(/<[^>]*>/g, "").slice(0, 300)

  // source URL
  const sourceUrl = item.canonicalUrl ?? item.url ?? item.link ?? ""
  if (sourceUrl && !/^https?:\/\//i.test(sourceUrl)) warnings.push("invalid_source_url")

  // category
  const rawCategory =
    (Array.isArray(item.categories) ? item.categories[0]?.label ?? item.categories[0] : item.category) || defaultCategory
  const category = String(rawCategory).trim() || defaultCategory

  // tags
  const tags: string[] = Array.isArray(item.tags)
    ? item.tags.map((t: any) => (typeof t === "string" ? t : t.label ?? "")).filter(Boolean)
    : []

  // image
  const coverFromMedia = resolveWixImageUrl(
    item.media?.wixMedia?.image?.imageInfo?.url ??
    item.media?.src?.url ??
    item.coverImage?.url ??
    item.media?.url,
  )
  const coverFromBody = extractFirstImageFromHtml(body)
  const coverImageUrl = coverFromMedia ?? coverFromBody ?? null
  if (!coverImageUrl) warnings.push("missing_image")

  const post: ImportedPost = {
    title,
    slug,
    excerpt,
    body,
    category,
    tags,
    post_type: defaultPostType,
    status: defaultStatus,
    featured: false,
    priority: 0,
    published_at: publishedAt ? new Date(publishedAt) : null,
    original_created_at: originalCreatedAt ? new Date(originalCreatedAt) : null,
    source_url: sourceUrl,
    source_name: "Wix Blog Archive",
    original_source_url: sourceUrl,
    cover_image_url: coverImageUrl ?? undefined,
    author_name: "HOT AND FRESH",
  }

  return {
    index,
    title,
    slug,
    publishedAt,
    category,
    postType: defaultPostType,
    status: defaultStatus,
    sourceUrl,
    imageFound: Boolean(coverImageUrl),
    coverImageUrl,
    warnings,
    post,
  }
}

export function parseWixJson(
  json: string,
  opts: WixParseOptions = {},
): WixPreviewRow[] {
  let data: any
  try {
    data = JSON.parse(json)
  } catch {
    throw new Error("Invalid JSON: could not parse the pasted content.")
  }

  // Support: array at root, {posts:[...]}, {items:[...]}, {data:{posts:[...]}}
  const items: any[] = Array.isArray(data)
    ? data
    : Array.isArray(data?.posts)
    ? data.posts
    : Array.isArray(data?.items)
    ? data.items
    : Array.isArray(data?.data?.posts)
    ? data.data.posts
    : [data]

  const seenSlugs = new Set<string>(opts.existingSlugs)
  return items.map((item, i) => normalizeWixJsonPost(item, i, opts, seenSlugs))
}
