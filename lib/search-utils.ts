import { isTiptapJson } from "@/lib/tiptap-utils"

export type SearchTab = "all" | "archives" | "town-hall" | "news" | "documents" | "media"
export type SearchSort = "relevance" | "newest" | "oldest"

export interface SearchResult {
  id: string
  type: Exclude<SearchTab, "all">
  title: string
  excerpt: string
  href: string
  date: string | null
  source: string | null
  sourceUrl: string | null
  author: string | null
  category: string | null
  desk: string | null
  tags: string[]
  contentType: string | null
  replies: number | null
  readMinutes: number | null
  image: string | null
  external: boolean
  primarySource: boolean
  score: number
}

export interface SearchResponse {
  results: SearchResult[]
  counts: Record<SearchTab, number>
  total: number
  page: number
  pageSize: number
  hasMore: boolean
  elapsedMs: number
  partial: string[]
  query: string
  compatibility: {
    threads: Array<{ id: string; title: string; body: string; created_at: string; profiles: { display_name: string } | null }>
    posts: Array<{ id: string; slug: string; title: string; excerpt: string; tag: string; created_at: string }>
  }
}

const MAX_TEXT_LENGTH = 12000

function stripHtml(value: string): string {
  return value
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
}

function stripMarkdown(value: string): string {
  return value
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/(^|\s)#{1,6}\s+/g, "$1")
    .replace(/[*_~`>]/g, "")
}

function collectRichText(node: unknown, output: string[]): void {
  if (!node || typeof node !== "object") return
  const value = node as { type?: unknown; text?: unknown; content?: unknown[] }
  if (typeof value.text === "string") output.push(value.text)
  if (Array.isArray(value.content)) value.content.forEach((child) => collectRichText(child, output))
}

function decodeBasicEntities(value: string): string {
  return value
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
}

export function extractSearchText(content: unknown): string {
  if (content === null || content === undefined) return ""
  if (typeof content === "object") {
    const output: string[] = []
    collectRichText(content, output)
    return normalizeSearchText(output.join(" "))
  }
  if (typeof content !== "string") return ""

  const raw = content.trim()
  if (!raw) return ""
  if (isTiptapJson(raw)) {
    try {
      const output: string[] = []
      collectRichText(JSON.parse(raw), output)
      return normalizeSearchText(output.join(" "))
    } catch {
      return ""
    }
  }

  return normalizeSearchText(decodeBasicEntities(stripMarkdown(stripHtml(raw))))
}

export function normalizeSearchText(value: string, maxLength = MAX_TEXT_LENGTH): string {
  const normalized = value.replace(/\s+/g, " ").trim()
  if (normalized.length <= maxLength) return normalized
  const clipped = normalized.slice(0, maxLength)
  const boundary = clipped.lastIndexOf(" ")
  return `${(boundary > maxLength * 0.7 ? clipped.slice(0, boundary) : clipped).trim()}…`
}

export function buildSearchExcerpt(content: unknown, maxLength = 260): string {
  return normalizeSearchText(extractSearchText(content), maxLength)
}

export function getHighlightSegments(text: string, query: string): Array<{ text: string; match: boolean }> {
  const cleanQuery = query.trim()
  if (!cleanQuery) return [{ text, match: false }]
  const escaped = cleanQuery.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
  const parts = text.split(new RegExp(`(${escaped})`, "ig"))
  return parts.filter(Boolean).map((part) => ({ text: part, match: part.toLowerCase() === cleanQuery.toLowerCase() }))
}

export function safeExternalUrl(value: unknown): string | null {
  if (typeof value !== "string" || !value.trim()) return null
  try {
    const url = new URL(value)
    return url.protocol === "http:" || url.protocol === "https:" ? url.toString() : null
  } catch {
    return null
  }
}

export function normalizeTagList(value: unknown): string[] {
  if (Array.isArray(value)) return value.filter((tag): tag is string => typeof tag === "string").slice(0, 12)
  if (typeof value === "string") return value.split(",").map((tag) => tag.trim()).filter(Boolean).slice(0, 12)
  return []
}

export function getSearchScore(query: string, title: string, excerpt: string, body = ""): number {
  const normalizedQuery = query.toLowerCase().trim()
  if (!normalizedQuery) return 0
  const titleValue = title.toLowerCase()
  const excerptValue = excerpt.toLowerCase()
  const bodyValue = body.toLowerCase()
  return (titleValue.includes(normalizedQuery) ? 12 : 0) +
    (excerptValue.includes(normalizedQuery) ? 6 : 0) +
    (bodyValue.includes(normalizedQuery) ? 2 : 0)
}

export function isPrimarySource(sourceUrl: string | null, sourceName: string | null): boolean {
  if (!sourceUrl) return false
  const source = `${sourceName ?? ""} ${sourceUrl}`.toLowerCase()
  return source.includes(".gov") || source.includes(".edu") || source.includes("court") || source.includes("record") || source.includes("transcript")
}

export function searchTabForContentType(value: string | null | undefined): SearchResult["type"] {
  const type = (value ?? "").toLowerCase()
  if (type.includes("video") || type.includes("live") || type.includes("media")) return "media"
  if (type.includes("document") || type.includes("record") || type.includes("archive")) return "documents"
  return "archives"
}

export function isSearchTab(value: string | null): value is SearchTab {
  return value === "all" || value === "archives" || value === "town-hall" || value === "news" || value === "documents" || value === "media"
}

export function isSearchSort(value: string | null): value is SearchSort {
  return value === "relevance" || value === "newest" || value === "oldest"
}
