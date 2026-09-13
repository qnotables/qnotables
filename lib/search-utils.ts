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

function foldSearchText(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[\\u0300-\\u036f]/g, "")
    .replace(/[’‘`´]/g, "'")
    .replace(/[‐‑‒–—―]/g, "-")
}

export function normalizeComparableText(value: string): string {
  return foldSearchText(value)
    .toLowerCase()
    .replace(/#(?=[\\p{L}\\p{N}])/gu, "")
    .replace(/&/g, " and ")
    .replace(/[']/g, "")
    .replace(/[^\\p{L}\\p{N}]+/gu, " ")
    .replace(/\\s+/g, " ")
    .trim()
}

export function compactSearchText(value: string): string {
  return normalizeComparableText(value).replace(/[^\\p{L}\\p{N}]/gu, "")
}

export interface SearchAliasTerm {
  term: string
  normalizedTerm?: string
  compactTerm?: string
  groupKey?: string
  groupTerms?: string[]
}

export interface SearchQuery {
  raw: string
  readable: string
  compact: string
  tokens: string[]
  alternatives: string[]
  valid: boolean
}

const REVIEWED_ALIAS_GROUPS: string[][] = [
  ["9/11", "9-11", "9 11", "September 11", "September 11th", "911"],
  ["US", "U.S.", "United States", "USA", "U.S.A."],
  ["Houthi", "Houthis"],
  ["#Houthi", "Houthi"],
]

function uniqueStrings(values: string[]): string[] {
  return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean)))
}

function aliasesForQuery(query: string, aliases: SearchAliasTerm[]): string[] {
  const normalized = normalizeComparableText(query)
  const compact = compactSearchText(query)
  const matchedGroups = REVIEWED_ALIAS_GROUPS.filter((group) => group.some((term) => normalizeComparableText(term) === normalized || compactSearchText(term) === compact))
  const groupedAliases = new Map<string, string[]>()
  for (const alias of aliases) {
    const key = alias.groupKey ?? alias.term
    const terms = groupedAliases.get(key) ?? []
    terms.push(...(alias.groupTerms ?? [alias.term]))
    groupedAliases.set(key, terms)
  }
  for (const [key, terms] of groupedAliases) {
    if (terms.some((term) => normalizeComparableText(term) === normalized || compactSearchText(term) === compact)) {
      matchedGroups.push(terms)
    } else if (key === normalized || key === compact) {
      matchedGroups.push(terms)
    }
  }
  return uniqueStrings(matchedGroups.flat())
}

export function createSearchQuery(value: string, aliases: SearchAliasTerm[] = []): SearchQuery {
  const raw = value.slice(0, 160).trim()
  const readable = normalizeComparableText(raw)
  const compact = compactSearchText(raw)
  const tokens = readable ? readable.split(" ").filter(Boolean) : []
  const alternatives = uniqueStrings([raw, readable, ...aliasesForQuery(raw, aliases)])
  return { raw, readable, compact, tokens, alternatives, valid: Boolean(readable && /[\\p{L}\\p{N}]/u.test(readable)) }
}

function normalizedTokens(value: string): string[] {
  return normalizeComparableText(value).split(" ").filter(Boolean)
}

export function searchTextMatches(query: SearchQuery | string, value: string): boolean {
  const searchQuery = typeof query === "string" ? createSearchQuery(query) : query
  if (!searchQuery.valid) return false
  const valueReadable = normalizeComparableText(value)
  if (!valueReadable) return false
  if (valueReadable.includes(searchQuery.readable)) return true

  const valueTokens = normalizedTokens(value)
  const queryTokens = searchQuery.tokens
  if (!queryTokens.length) return false
  const targetCompact = searchQuery.compact
  for (let start = 0; start < valueTokens.length; start += 1) {
    let joined = ""
    for (let end = start; end < valueTokens.length && end < start + 12; end += 1) {
      joined += compactSearchText(valueTokens[end])
      if (joined === targetCompact) return true
      if (joined.length >= targetCompact.length) break
    }
  }
  return false
}

export function expandSearchQueries(query: SearchQuery, aliases: SearchAliasTerm[] = []): SearchQuery[] {
  const values = uniqueStrings([query.raw, query.readable, ...aliasesForQuery(query.raw, aliases)])
  return values.map((value) => createSearchQuery(value)).filter((item) => item.valid)
}

export function buildSearchExcerpt(content: unknown, maxLength = 260): string {
  return normalizeSearchText(extractSearchText(content), maxLength)
}

export function getHighlightSegments(text: string, query: string): Array<{ text: string; match: boolean }> {
  const cleanQuery = query.trim()
  if (!cleanQuery || !createSearchQuery(cleanQuery).valid) return [{ text, match: false }]
  const ranges: Array<[number, number]> = []
  const exact = cleanQuery.replace(/[.*+?^${}()|[\\]\\]/g, "\\$&")
  for (const match of text.matchAll(new RegExp(exact, "igu"))) {
    if (match.index !== undefined) ranges.push([match.index, match.index + match[0].length])
  }
  const tokenMatches = Array.from(text.matchAll(/[\\p{L}\\p{N}][\\p{L}\\p{N}'’./-]*/gu))
  const queryTokens = createSearchQuery(cleanQuery).tokens
  for (let start = 0; start < tokenMatches.length; start += 1) {
    for (let end = start; end < Math.min(tokenMatches.length, start + Math.max(4, queryTokens.length + 2)); end += 1) {
      const candidate = text.slice(tokenMatches[start].index ?? 0, (tokenMatches[end].index ?? 0) + tokenMatches[end][0].length)
      if (searchTextMatches(cleanQuery, candidate)) ranges.push([tokenMatches[start].index ?? 0, (tokenMatches[end].index ?? 0) + tokenMatches[end][0].length])
    }
  }
  if (!ranges.length) return [{ text, match: false }]
  const merged = ranges.sort((a, b) => a[0] - b[0]).reduce<Array<[number, number]>>((result, range) => {
    const previous = result[result.length - 1]
    if (previous && range[0] <= previous[1]) previous[1] = Math.max(previous[1], range[1])
    else result.push([...range])
    return result
  }, [])
  const parts: Array<{ text: string; match: boolean }> = []
  let cursor = 0
  for (const [start, end] of merged) {
    if (start > cursor) parts.push({ text: text.slice(cursor, start), match: false })
    parts.push({ text: text.slice(start, end), match: true })
    cursor = end
  }
  if (cursor < text.length) parts.push({ text: text.slice(cursor), match: false })
  return parts
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

export function getSearchScore(query: string, title: string, excerpt: string, body = "", metadata = ""): number {
  const searchQuery = createSearchQuery(query)
  if (!searchQuery.valid) return 0
  const originalQuery = searchQuery.raw.toLocaleLowerCase()
  const originalTitle = title.toLocaleLowerCase()
  const normalizedTitle = normalizeComparableText(title)
  const metadataValue = normalizeComparableText(metadata)
  const excerptValue = normalizeComparableText(excerpt)
  const bodyValue = normalizeComparableText(body)
  return (originalTitle.includes(originalQuery) ? 100 : 0) +
    (searchTextMatches(searchQuery, normalizedTitle) ? 55 : 0) +
    (searchTextMatches(searchQuery, metadataValue) ? 28 : 0) +
    (searchTextMatches(searchQuery, excerptValue) ? 16 : 0) +
    (searchTextMatches(searchQuery, bodyValue) ? 5 : 0)
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
