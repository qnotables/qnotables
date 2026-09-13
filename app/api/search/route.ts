import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import {
  buildSearchExcerpt,
  createSearchQuery,
  expandSearchQueries,
  getSearchScore,
  isPrimarySource,
  isSearchSort,
  isSearchTab,
  normalizeComparableText,
  normalizeTagList,
  safeExternalUrl,
  searchTabForContentType,
  searchTextMatches,
  type SearchAliasTerm,
  type SearchResponse,
  type SearchResult,
  type SearchSort,
  type SearchTab,
} from "@/lib/search-utils"

const PAGE_SIZE_MAX = 30
const CANDIDATE_LIMIT = 1000

type ProjectionRow = {
  id: string
  source_kind: string
  source_id: string
  title: string
  excerpt: string
  body: string
  normalized_search: string
  compact_search: string
  href: string
  date_value: string | null
  source: string | null
  source_url: string | null
  author: string | null
  category: string | null
  desk: string | null
  tags: string[] | null
  content_type: string | null
  replies: number | null
  read_minutes: number | null
  image: string | null
  external: boolean
  primary_source: boolean
}

type AliasGroupRow = { id: string; slug: string; enabled: boolean }
type AliasTermRow = { term: string; normalized_term: string; compact_term: string; group_id: string }

function cleanParam(value: string | null): string {
  return (value ?? "").trim().slice(0, 120)
}

function escapeLike(value: string): string {
  return value.replace(/[\\%_]/g, "\\$&")
}

function matchesFilter(result: SearchResult, params: URLSearchParams): boolean {
  const desk = cleanParam(params.get("desk")).toLowerCase()
  const category = cleanParam(params.get("category")).toLowerCase()
  const type = cleanParam(params.get("type")).toLowerCase()
  const source = cleanParam(params.get("source")).toLowerCase()
  const author = cleanParam(params.get("author")).toLowerCase()
  const tag = cleanParam(params.get("tag")).toLowerCase()
  const from = cleanParam(params.get("from"))
  const to = cleanParam(params.get("to"))
  const primary = params.get("primary") === "true"

  if (desk && !(result.desk ?? "").toLowerCase().includes(desk)) return false
  if (category && !(result.category ?? "").toLowerCase().includes(category)) return false
  if (type && !(result.contentType ?? "").toLowerCase().includes(type)) return false
  if (source && !(result.source ?? "").toLowerCase().includes(source)) return false
  if (author && !(result.author ?? "").toLowerCase().includes(author)) return false
  if (tag && !result.tags.some((item) => item.toLowerCase().includes(tag))) return false
  if (primary && !result.primarySource) return false
  if (from && result.date && result.date < from) return false
  if (to && result.date && result.date.slice(0, 10) > to) return false
  return true
}

function aliasesFromRows(groups: AliasGroupRow[], terms: AliasTermRow[]): SearchAliasTerm[] {
  const groupTerms = new Map(groups.map((group) => [group.id, [] as string[]]))
  for (const term of terms) groupTerms.get(term.group_id)?.push(term.term)
  return terms.map((term) => ({
    term: term.term,
    normalizedTerm: term.normalized_term,
    compactTerm: term.compact_term,
    groupKey: term.group_id,
    groupTerms: groupTerms.get(term.group_id),
  }))
}

function resultFromProjection(row: ProjectionRow, query: string): SearchResult {
  const type = row.source_kind === "town-hall" || row.source_kind === "news" || row.source_kind === "media"
    ? row.source_kind
    : searchTabForContentType(row.content_type)
  const sourceUrl = safeExternalUrl(row.source_url)
  const image = safeExternalUrl(row.image)
  const excerpt = buildSearchExcerpt(row.excerpt || row.body)
  const metadata = [row.source, row.author, row.category, row.desk, ...(row.tags ?? [])].filter(Boolean).join(" ")
  return {
    id: `${row.source_kind}:${row.source_id}`,
    type,
    title: row.title,
    excerpt,
    href: row.href,
    date: row.date_value,
    source: row.source,
    sourceUrl,
    author: row.author,
    category: row.category,
    desk: row.desk,
    tags: normalizeTagList(row.tags),
    contentType: row.content_type,
    replies: row.replies,
    readMinutes: row.read_minutes,
    image,
    external: Boolean(row.external || sourceUrl),
    primarySource: Boolean(row.primary_source || isPrimarySource(sourceUrl, row.source)),
    score: getSearchScore(query, row.title, excerpt, row.body, metadata),
  }
}

function matchesAnyQuery(row: ProjectionRow, queries: ReturnType<typeof expandSearchQueries>): boolean {
  const searchable = `${row.normalized_search} ${row.compact_search}`
  return queries.some((query) => searchTextMatches(query, searchable))
}

export async function GET(request: Request) {
  const startedAt = performance.now()
  const { searchParams } = new URL(request.url)
  const query = cleanParam(searchParams.get("q"))
  const tabParam = searchParams.get("tab")
  const tab: SearchTab = isSearchTab(tabParam) ? tabParam : "all"
  const sort: SearchSort = isSearchSort(searchParams.get("sort")) ? searchParams.get("sort") as SearchSort : "relevance"
  const page = Math.max(1, Number.parseInt(searchParams.get("page") ?? "1", 10) || 1)
  const pageSize = Math.min(PAGE_SIZE_MAX, Math.max(6, Number.parseInt(searchParams.get("limit") ?? "18", 10) || 18))
  const partial: string[] = []

  if (!createSearchQuery(query).valid) {
    return NextResponse.json({
      results: [],
      counts: { all: 0, archives: 0, "town-hall": 0, news: 0, documents: 0, media: 0 },
      total: 0,
      page,
      pageSize,
      hasMore: false,
      elapsedMs: Math.max(1, Math.round(performance.now() - startedAt)),
      partial: [],
      query,
      compatibility: { threads: [], posts: [] },
    } satisfies SearchResponse)
  }

  const db = createAdminClient()
  const [groupResponse, documentsResponse] = await Promise.all([
    db.from("search_alias_groups").select("id, slug, enabled").eq("enabled", true),
    (async () => {
      const groups = await db.from("search_alias_groups").select("id, slug, enabled").eq("enabled", true)
      const aliases = groups.data?.length
        ? await db.from("search_alias_terms").select("term, normalized_term, compact_term, group_id").in("group_id", groups.data.map((group) => group.id))
        : { data: [], error: null }
      const aliasTerms = aliases.data ?? []
      const aliasRows = aliasesFromRows((groups.data ?? []) as AliasGroupRow[], aliasTerms as AliasTermRow[])
      const searchQuery = createSearchQuery(query, aliasRows)
      const searchQueries = expandSearchQueries(searchQuery, aliasRows)
      const clauses = Array.from(new Set(searchQueries.flatMap((item) => [
        `normalized_search.ilike.%${escapeLike(item.readable)}%`,
        `compact_search.ilike.%${escapeLike(item.compact)}%`,
      ])))
      const projection = db
        .from("search_documents")
        .select("id, source_kind, source_id, title, excerpt, body, normalized_search, compact_search, href, date_value, source, source_url, author, category, desk, tags, content_type, replies, read_minutes, image, external, primary_source")
        .or(clauses.join(","))
        .limit(CANDIDATE_LIMIT)
      if (tab !== "all") projection.eq("source_kind", tab)
      const result = await projection
      return { ...result, searchQueries }
    })(),
  ])

  if (groupResponse.error) partial.push("aliases")
  if (documentsResponse.error) partial.push("index")

  const searchQueries = documentsResponse.searchQueries ?? expandSearchQueries(createSearchQuery(query))
  const rows = (documentsResponse.data ?? []) as ProjectionRow[]
  const allResults = rows
    .filter((row) => matchesAnyQuery(row, searchQueries))
    .map((row) => resultFromProjection(row, query))
    .filter((result) => matchesFilter(result, searchParams))

  const counts = {
    all: allResults.length,
    archives: allResults.filter((item) => item.type === "archives").length,
    "town-hall": allResults.filter((item) => item.type === "town-hall").length,
    news: allResults.filter((item) => item.type === "news").length,
    documents: allResults.filter((item) => item.type === "documents").length,
    media: allResults.filter((item) => item.type === "media").length,
  }

  const sorted = allResults.sort((a, b) => {
    if (sort === "oldest") return new Date(a.date ?? 0).getTime() - new Date(b.date ?? 0).getTime()
    if (sort === "newest") return new Date(b.date ?? 0).getTime() - new Date(a.date ?? 0).getTime()
    return b.score - a.score || new Date(b.date ?? 0).getTime() - new Date(a.date ?? 0).getTime()
  })
  const tabbed = tab === "all" ? sorted : sorted.filter((result) => result.type === tab)
  const offset = (page - 1) * pageSize
  const results = tabbed.slice(offset, offset + pageSize)
  const compatibilityThreads = results.filter((result) => result.type === "town-hall").slice(0, 6).map((result) => ({
    id: result.id.replace("town-hall:", ""), title: result.title, body: result.excerpt, created_at: result.date ?? "", profiles: result.author ? { display_name: result.author } : null,
  }))
  const compatibilityPosts = results.filter((result) => result.type === "archives" || result.type === "documents").slice(0, 6).map((result) => ({
    id: result.id, slug: result.href.split("/").pop() ?? result.id, title: result.title, excerpt: result.excerpt, tag: result.category ?? "Archive", created_at: result.date ?? "",
  }))

  const payload: SearchResponse = {
    results,
    counts,
    total: tabbed.length,
    page,
    pageSize,
    hasMore: offset + results.length < tabbed.length,
    elapsedMs: Math.max(1, Math.round(performance.now() - startedAt)),
    partial: Array.from(new Set(partial)),
    query,
    compatibility: { threads: compatibilityThreads, posts: compatibilityPosts },
  }

  return NextResponse.json(payload, { headers: { "Cache-Control": "private, max-age=0, must-revalidate" } })
}
