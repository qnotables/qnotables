import DOMPurify from "isomorphic-dompurify"
import { marked } from "marked"

export interface ParsedPost {
  title: string
  excerpt: string
  author: string
  content: string // markdown
  tag?: string
  category?: string
  publishedAt?: string
  sourceUrl?: string
  sourceName?: string
  coverImage?: string
}

/**
 * Normalize a string into a URL-safe slug.
 * Returns lowercase, hyphen-separated, with numbers/letters only.
 */
export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "") // remove special chars
    .replace(/\s+/g, "-") // spaces to hyphens
    .replace(/-+/g, "-") // collapse multiple hyphens
    .replace(/^-+|-+$/g, "") // trim hyphens
}

/**
 * De-duplicate a slug by appending -2, -3, etc. if the slug already exists in the list.
 */
export function deduplicateSlug(slug: string, existingSlugs: Set<string>): string {
  if (!existingSlugs.has(slug)) return slug

  let counter = 2
  while (existingSlugs.has(`${slug}-${counter}`)) {
    counter++
  }
  return `${slug}-${counter}`
}

/**
 * Parse an ISO date string or timestamp, return ISO date string.
 * Supports: ISO, Unix timestamp (ms/s), common formats
 */
export function parseDate(dateStr: string | number | undefined): string | null {
  if (!dateStr) return null

  if (typeof dateStr === "number") {
    // Unix timestamp (assume milliseconds if > 10 billion)
    const ms = dateStr > 10000000000 ? dateStr : dateStr * 1000
    return new Date(ms).toISOString()
  }

  try {
    const parsed = new Date(dateStr as string)
    if (isNaN(parsed.getTime())) return null
    return parsed.toISOString()
  } catch {
    return null
  }
}

/**
 * Sanitize HTML/markdown to prevent XSS.
 * Removes scripts, event handlers, allows basic formatting tags.
 */
export function sanitizeMarkdown(markdown: string): string {
  if (!markdown) return ""

  // Basic markdown is safe; only sanitize if it contains HTML
  if (!markdown.includes("<")) return markdown

  const html = marked.parse(markdown)
  const clean = DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ["b", "i", "em", "strong", "a", "p", "br", "ul", "ol", "li", "blockquote", "code", "pre"],
    ALLOWED_ATTR: ["href", "target", "rel"],
  })

  return clean
}

/**
 * Sanitize links to prevent phishing: add security attributes
 */
export function sanitizeLinks(markdown: string): string {
  return markdown.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (match, text, url) => {
    // If external link, add security attributes
    if (url.startsWith("http://") || url.startsWith("https://")) {
      return `[${text}](${url} "external"){rel="noopener noreferrer nofollow"}`
    }
    return match
  })
}

/**
 * Parse CSV string (simple implementation; assumes comma-separated, newline-delimited)
 */
export function parseCSV(csv: string): Record<string, string>[] {
  const lines = csv.split("\n").filter((l) => l.trim())
  if (lines.length < 2) return []

  const headers = lines[0].split(",").map((h) => h.trim().toLowerCase())
  const rows: Record<string, string>[] = []

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(",").map((v) => v.trim())
    const row: Record<string, string> = {}
    headers.forEach((h, idx) => {
      row[h] = values[idx] || ""
    })
    rows.push(row)
  }

  return rows
}

/**
 * Extract frontmatter from markdown string
 */
export function extractFrontmatter(
  markdown: string,
): {
  frontmatter: Record<string, string>
  content: string
} {
  const match = markdown.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/)
  if (!match) return { frontmatter: {}, content: markdown }

  const fm: Record<string, string> = {}
  match[1]
    .split("\n")
    .filter((l) => l.trim())
    .forEach((line) => {
      const [key, ...valueParts] = line.split(":")
      if (key && valueParts.length) {
        fm[key.trim().toLowerCase()] = valueParts.join(":").trim()
      }
    })

  return {
    frontmatter: fm,
    content: match[2],
  }
}

/**
 * Extract title from markdown (first H1 or frontmatter)
 */
export function extractTitle(markdown: string): string | null {
  const { frontmatter, content } = extractFrontmatter(markdown)
  if (frontmatter["title"]) return frontmatter["title"]

  const h1 = content.match(/^#\s+(.+)$/m)?.[1]
  return h1 || null
}

/**
 * Extract excerpt from markdown (first paragraph or frontmatter)
 */
export function extractExcerpt(markdown: string, maxLength = 150): string {
  const { frontmatter, content } = extractFrontmatter(markdown)
  if (frontmatter["excerpt"]) return frontmatter["excerpt"].slice(0, maxLength)

  const text = content
    .split("\n")
    .filter((l) => l.trim() && !l.startsWith("#"))
    .join(" ")
    .replace(/[*_]/g, "")

  return text.slice(0, maxLength)
}

/**
 * Parse JSON array of posts
 */
export function parseJSON(json: string): ParsedPost[] {
  try {
    const parsed = JSON.parse(json)
    return Array.isArray(parsed) ? parsed : [parsed]
  } catch {
    return []
  }
}

/**
 * Parse RSS feed items (basic XML extraction)
 */
export function parseRSSItems(xml: string): ParsedPost[] {
  const items: ParsedPost[] = []

  // Simple regex extraction (in production, use xml2js or similar)
  const itemMatches = xml.matchAll(/<item>([\s\S]*?)<\/item>/g)

  for (const match of itemMatches) {
    const content = match[1]
    const title = content.match(/<title>([\s\S]*?)<\/title>/)?.[1]?.trim()
    const desc = content.match(/<description>([\s\S]*?)<\/description>/)?.[1]?.trim()
    const pubDate = content.match(/<pubDate>([\s\S]*?)<\/pubDate>/)?.[1]?.trim()
    const link = content.match(/<link>([\s\S]*?)<\/link>/)?.[1]?.trim()

    if (title && desc) {
      items.push({
        title,
        excerpt: desc.replace(/<[^>]*>/g, "").slice(0, 150),
        content: desc,
        author: "RSS Feed",
        publishedAt: pubDate ? parseDate(pubDate) || undefined : undefined,
        sourceUrl: link,
      })
    }
  }

  return items
}
