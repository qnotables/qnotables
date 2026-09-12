import { NextResponse } from "next/server"
import { getPublishedVideos } from "@/app/actions/video-actions"
import { createClient } from "@/lib/supabase/server"
import { getAllPosts } from "@/lib/blog-posts"
import {
  buildSearchExcerpt,
  getSearchScore,
  isPrimarySource,
  isSearchSort,
  isSearchTab,
  normalizeTagList,
  safeExternalUrl,
  searchTabForContentType,
  type SearchResponse,
  type SearchResult,
  type SearchSort,
  type SearchTab,
} from "@/lib/search-utils"

const PAGE_SIZE_MAX = 30

type ForumRow = {
  id: string
  slug: string | null
  title: string
  body: unknown
  excerpt: string | null
  category: string | null
  desk: string | null
  tags: unknown
  created_at: string
  updated_at?: string | null
  reply_count: number | null
  profiles: Array<{ display_name: string }> | null
}

function cleanParam(value: string | null): string {
  return (value ?? "").trim().slice(0, 120)
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

function resultFromPost(post: Awaited<ReturnType<typeof getAllPosts>>[number], query: string): SearchResult {
  const external = safeExternalUrl(post.sourceUrl ?? null)
  const contentType = post.postType ?? post.tag ?? "Field Note"
  const excerpt = buildSearchExcerpt(post.excerpt || post.content)
  return {
    id: `archive:${post.id ?? post.slug}`,
    type: searchTabForContentType(contentType),
    title: post.title,
    excerpt,
    href: `/blog/${post.slug}`,
    date: post.publishedAt ?? post.date ?? null,
    source: post.sourceName ?? "QNotables Archive",
    sourceUrl: external,
    author: post.author ?? null,
    category: post.category ?? post.tag ?? null,
    desk: post.category ?? null,
    tags: normalizeTagList(post.tags ?? post.tag),
    contentType,
    replies: null,
    readMinutes: post.readMinutes ?? null,
    image: safeExternalUrl(post.coverImage ?? post.seoImageUrl ?? null),
    external: Boolean(external),
    primarySource: isPrimarySource(external, post.sourceName ?? null),
    score: getSearchScore(query, post.title, excerpt, buildSearchExcerpt(post.content, 1200)),
  }
}

function resultFromVideo(video: Awaited<ReturnType<typeof getPublishedVideos>>[number], query: string): SearchResult {
  const external = safeExternalUrl(video.external_url ?? video.video_url)
  const title = video.title ?? "Untitled media record"
  const excerpt = buildSearchExcerpt(video.description)
  return {
    id: `video:${video.id}`,
    type: "media",
    title,
    excerpt,
    href: external ?? `/videos/${video.id}`,
    date: video.date ?? video.created_at ?? null,
    source: video.category ?? "QNotables Media",
    sourceUrl: external,
    author: null,
    category: video.category ?? null,
    desk: video.category ?? null,
    tags: normalizeTagList(video.category),
    contentType: "Video",
    replies: null,
    readMinutes: null,
    image: safeExternalUrl(video.thumbnail_url),
    external: Boolean(external),
    primarySource: isPrimarySource(external, video.category),
    score: getSearchScore(query, title, excerpt),
  }
}

function resultFromNews(story: Awaited<ReturnType<typeof getNews>>["feed"][number], query: string): SearchResult {
  const external = safeExternalUrl(story.url ?? null)
  const excerpt = buildSearchExcerpt(story.summary)
  return {
    id: `news:${story.id}`,
    type: "news",
    title: story.headline,
    excerpt,
    href: external ?? "/",
    date: new Date(Date.now() - Math.max(0, story.minutesAgo) * 60_000).toISOString(),
    source: story.source,
    sourceUrl: external,
    author: null,
    category: story.category,
    desk: story.category,
    tags: normalizeTagList(story.category),
    contentType: "RSS Wire",
    replies: null,
    readMinutes: story.readMinutes ?? null,
    image: safeExternalUrl(story.image ?? null),
    external: Boolean(external),
    primarySource: isPrimarySource(external, story.source),
    score: getSearchScore(query, story.headline, excerpt),
  }
}

function resultFromThread(thread: ForumRow, query: string): SearchResult {
  const author = thread.profiles?.[0]?.display_name ?? "operator"
  const excerpt = buildSearchExcerpt(thread.excerpt || thread.body)
  return {
    id: `thread:${thread.id}`,
    type: "town-hall",
    title: thread.title,
    excerpt,
    href: `/forum/${thread.slug || thread.id}`,
    date: thread.created_at ?? null,
    source: "Town Hall",
    sourceUrl: null,
    author,
    category: thread.category,
    desk: thread.desk,
    tags: normalizeTagList(thread.tags),
    contentType: "Research Thread",
    replies: thread.reply_count ?? 0,
    readMinutes: null,
    image: null,
    external: false,
    primarySource: false,
    score: getSearchScore(query, thread.title, excerpt, buildSearchExcerpt(thread.body, 1200)),
  }
}

function matchesQuery(result: SearchResult, query: string): boolean {
  if (!query) return true
  const needle = query.toLowerCase()
  return `${result.title} ${result.excerpt} ${result.author ?? ""} ${result.source ?? ""} ${result.tags.join(" ")}`.toLowerCase().includes(needle)
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

  const [posts, videos, threadResponse, newsBundle] = await Promise.all([
    getAllPosts().catch(() => { partial.push("archives"); return [] }),
    getPublishedVideos().catch(() => { partial.push("media"); return [] }),
    (async () => {
      try {
        const supabase = await createClient()
        const response = await supabase
          .from("forum_threads")
          .select("id, slug, title, body, excerpt, category, desk, tags, created_at, updated_at, reply_count, profiles(display_name)")
          .eq("is_soft_deleted", false)
          .eq("is_pending", false)
          .eq("status", "published")
          .order("created_at", { ascending: false })
          .limit(300)
        if (response.error) throw response.error
        return response.data as ForumRow[]
      } catch {
        partial.push("town-hall")
        return []
      }
    })(),
    getNews().catch(() => { partial.push("news"); return { feed: [] } as Awaited<ReturnType<typeof getNews>> }),
  ])

  const allResults = [
    ...posts.map((post) => resultFromPost(post, query)),
    ...videos.map((video) => resultFromVideo(video, query)),
    ...threadResponse.map((thread) => resultFromThread(thread, query)),
    ...newsBundle.feed.map((story) => resultFromNews(story, query)),
  ].filter((result) => matchesQuery(result, query) && matchesFilter(result, searchParams))

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
    id: result.id.replace("thread:", ""), title: result.title, body: result.excerpt, created_at: result.date ?? "", profiles: result.author ? { display_name: result.author } : null,
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
