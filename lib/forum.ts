import { createClient } from "@/lib/supabase/server"
import { FORUM_CATEGORIES, buildExcerpt, detectMediaBadges, type SortOption } from "@/lib/forum-utils"

export interface ForumThreadLatestReply {
  body: string
  authorName: string
  createdAt: string
}

export interface ForumThread {
  id: string
  slug?: string
  title: string
  body: string
  authorName: string
  createdAt: string
  updatedAt?: string
  lastActivityAt?: string
  latestImageUrl?: string
  replyCount: number
  category?: string
  isPinned?: boolean
  isFeatured?: boolean
  latestReply?: ForumThreadLatestReply | null
}

export async function getHottestForumThread(): Promise<ForumThread | null> {
  try {
    const supabase = await createClient()

    // Fetch recent threads with their reply counts via join
    const { data: threads } = await supabase
      .from("forum_threads")
      .select(
        "id, title, body, created_at, category, is_pinned, is_featured, profiles(display_name), forum_replies(count)"
      )
      .eq("is_soft_deleted", false)
      .order("created_at", { ascending: false })
      .limit(30)

    if (!threads || threads.length === 0) return null

    // Rank: featured first, then by reply count, then by recency
    let best = threads[0]
    let bestScore = -1

    for (const t of threads) {
      const replies = (t as any).forum_replies?.[0]?.count ?? 0
      const recencyBonus = Math.max(0, 30 - Math.floor((Date.now() - new Date((t as any).created_at).getTime()) / 86400000))
      const score =
        ((t as any).is_featured ? 100 : 0) +
        ((t as any).is_pinned ? 20 : 0) +
        replies * 3 +
        recencyBonus
      if (score > bestScore) {
        bestScore = score
        best = t
      }
    }

    const t = best as any
    return {
      id: t.id,
      title: t.title,
      body: t.body,
      authorName: t.profiles?.display_name || "Anonymous",
      createdAt: t.created_at,
      replyCount: (t.forum_replies?.[0]?.count ?? 0) as number,
      category: t.category || undefined,
      isPinned: t.is_pinned || false,
      isFeatured: t.is_featured || false,
    }
  } catch (error) {
    console.error("[v0] Failed to fetch hottest forum thread:", error)
    return null
  }
}

/**
 * Returns the top N forum threads, scored by featured/pinned/replies/recency.
 */
export async function getTopForumThreads(limit = 3): Promise<ForumThread[]> {
  try {
    const supabase = await createClient()

    const { data: threads } = await supabase
      .from("forum_threads")
      .select(
        "id, title, body, created_at, category, is_pinned, is_featured, profiles(display_name), forum_replies(count)"
      )
      .eq("is_soft_deleted", false)
      .order("created_at", { ascending: false })
      .limit(50)

    if (!threads || threads.length === 0) return []

    const scored = threads.map((t: any) => {
      const replies = t.forum_replies?.[0]?.count ?? 0
      const recencyBonus = Math.max(0, 30 - Math.floor((Date.now() - new Date(t.created_at).getTime()) / 86400000))
      const score =
        (t.is_featured ? 100 : 0) +
        (t.is_pinned ? 20 : 0) +
        replies * 3 +
        recencyBonus
      return { t, score }
    })

    scored.sort((a, b) => b.score - a.score)
    const top = scored.slice(0, limit).map(({ t }) => t)
    const topIds = top.map((t: any) => t.id)

    // Fetch the most recent visible reply for each top thread in one query
    const { data: recentReplies } = await supabase
      .from("forum_replies")
      .select("thread_id, body, created_at, profiles(display_name)")
      .in("thread_id", topIds)
      .eq("is_pending", false)
      .eq("is_hidden", false)
      .order("created_at", { ascending: false })

    // Build a map: thread_id → latest reply (first match per thread since sorted desc)
    const latestReplyMap = new Map<string, ForumThreadLatestReply>()
    for (const r of recentReplies ?? []) {
      if (!latestReplyMap.has(r.thread_id)) {
        latestReplyMap.set(r.thread_id, {
          body: r.body ?? "",
          authorName: (r as any).profiles?.display_name || "Anonymous",
          createdAt: r.created_at,
        })
      }
    }

    return top.map((t: any) => ({
      id: t.id,
      title: t.title,
      body: t.body,
      authorName: t.profiles?.display_name || "Anonymous",
      createdAt: t.created_at,
      replyCount: (t.forum_replies?.[0]?.count ?? 0) as number,
      category: t.category || undefined,
      isPinned: t.is_pinned || false,
      isFeatured: t.is_featured || false,
      latestReply: latestReplyMap.get(t.id) ?? null,
    }))
  } catch (error) {
    console.error("[v0] Failed to fetch top forum threads:", error)
    return []
  }
}

/**
 * Returns the N most recently active public forum threads, enriched with each
 * thread's latest visible reply. Activity includes replies, not only creation.
 */
export async function getRecentForumThreads(limit = 3): Promise<ForumThread[]> {
  try {
    const supabase = await createClient()

    const { data: threadRows, error } = await supabase
      .from("forum_threads")
      .select(
        "id, slug, title, body, created_at, updated_at, reply_count, category, is_pinned, is_featured, profiles(display_name)"
      )
      .eq("is_soft_deleted", false)
      .eq("is_pending", false)
      .eq("status", "published")
      .order("created_at", { ascending: false })
      .limit(Math.max(limit * 6, 50))

    if (error) {
      console.error("[v0] Failed to fetch recent forum activity:", error)
      return []
    }
    if (!threadRows || threadRows.length === 0) return []

    const threadIds = threadRows.map((t: any) => t.id)

    // Replies are the only meaningful activity after thread creation. Fetch them
    // before limiting the result so an older thread with a new reply can surface.
    const { data: recentReplies } = await supabase
      .from("forum_replies")
      .select("id, thread_id, body, created_at, profiles(display_name)")
      .in("thread_id", threadIds)
      .eq("is_pending", false)
      .eq("is_hidden", false)
      .order("created_at", { ascending: false })

    const latestReplyMap = new Map<string, ForumThreadLatestReply>()
    const replyThreadMap = new Map<string, string>()
    for (const r of recentReplies ?? []) {
      replyThreadMap.set(r.id, r.thread_id)
      if (!latestReplyMap.has(r.thread_id)) {
        latestReplyMap.set(r.thread_id, {
          body: r.body ?? "",
          authorName: (r as any).profiles?.display_name || "Anonymous",
          createdAt: r.created_at,
        })
      }
    }

    const rankedThreads = [...threadRows]
      .map((thread: any) => {
        const latestReply = latestReplyMap.get(thread.id)
        const activityAt = latestReply?.createdAt || thread.created_at
        return { thread, latestReply, activityAt }
      })
      .sort((a, b) => {
        const activityDifference = Date.parse(b.activityAt) - Date.parse(a.activityAt)
        return activityDifference || Date.parse(b.thread.created_at) - Date.parse(a.thread.created_at)
      })
      .slice(0, limit)

    const topIds = rankedThreads.map(({ thread }) => thread.id)
    const replyIds = rankedThreads.flatMap(({ thread }) =>
      (recentReplies ?? []).filter((reply: any) => reply.thread_id === thread.id).map((reply: any) => reply.id),
    )
    const [threadAttachmentsResult, replyAttachmentsResult] = await Promise.all([
      supabase
        .from("forum_attachments")
        .select("thread_id, url, created_at")
        .in("thread_id", topIds)
        .eq("status", "active")
        .like("mime_type", "image/%")
        .order("created_at", { ascending: false }),
      replyIds.length
        ? supabase
            .from("forum_attachments")
            .select("reply_id, url, created_at")
            .in("reply_id", replyIds)
            .eq("status", "active")
            .like("mime_type", "image/%")
            .order("created_at", { ascending: false })
        : Promise.resolve({ data: [] }),
    ])

    const imageCandidates = [
      ...(threadAttachmentsResult.data ?? []).map((attachment: any) => ({
        threadId: attachment.thread_id,
        url: attachment.url,
        createdAt: attachment.created_at,
      })),
      ...(replyAttachmentsResult.data ?? []).map((attachment: any) => ({
        threadId: replyThreadMap.get(attachment.reply_id),
        url: attachment.url,
        createdAt: attachment.created_at,
      })),
    ].sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))

    const latestImageMap = new Map<string, string>()
    for (const image of imageCandidates) {
      if (image.threadId && !latestImageMap.has(image.threadId)) {
        latestImageMap.set(image.threadId, image.url)
      }
    }

    return rankedThreads.map(({ thread: t, latestReply, activityAt }) => ({
      id: t.id,
      slug: t.slug || undefined,
      title: t.title,
      body: t.body,
      authorName: t.profiles?.display_name || "Anonymous",
      createdAt: t.created_at,
      updatedAt: t.updated_at || undefined,
      lastActivityAt: activityAt,
      latestImageUrl: latestImageMap.get(t.id),
      replyCount: Number(t.reply_count ?? 0),
      category: t.category || undefined,
      isPinned: t.is_pinned || false,
      isFeatured: t.is_featured || false,
      latestReply: latestReply ?? null,
    }))
  } catch (error) {
    console.error("[v0] Failed to fetch recent forum threads:", error)
    return []
  }
}

export async function getLatestForumThread(): Promise<ForumThread | null> {
  try {
    const supabase = await createClient()

    const { data: thread, error } = await supabase
      .from("forum_threads")
      .select(
        "id, title, body, created_at, category, is_pinned, is_featured, profiles(display_name), forum_replies(count)"
      )
      .eq("is_soft_deleted", false)
      .order("created_at", { ascending: false })
      .limit(1)
      .single()

    if (error || !thread) return null

    const t = thread as any
    return {
      id: t.id,
      title: t.title,
      body: t.body,
      authorName: t.profiles?.display_name || "Anonymous",
      createdAt: t.created_at,
      replyCount: (t.forum_replies?.[0]?.count ?? 0) as number,
      category: t.category || undefined,
      isPinned: t.is_pinned || false,
      isFeatured: t.is_featured || false,
    }
  } catch (error) {
    console.error("[v0] Failed to fetch latest forum thread:", error)
    return null
  }
}

export type ForumOrigin = "community" | "primary-source"
export type ForumMediaFilter = "images" | "video" | "links" | "social"

export interface ForumFilters {
  q: string
  category: string
  desk: string
  origin: ForumOrigin | ""
  media: ForumMediaFilter | ""
  sort: SortOption
  page: number
}

export interface ForumThreadRecord {
  id: string
  slug: string | null
  title: string
  body: string
  excerpt: string | null
  category: string | null
  desk: string | null
  tags: string | null
  sourceUrl: string | null
  origin: ForumOrigin
  media: {
    hasImages: boolean
    hasLinks: boolean
    hasSocialLinks: boolean
    hasVideo: boolean
  }
  latestImageUrl: string | null
  created_at: string
  last_activity_at: string
  viewCount: number
  author_id: string
  authorName: string
  replyCount: number
  is_pinned: boolean
  is_locked: boolean
  is_featured: boolean
  is_soft_deleted: boolean
  upVoteCount: number
  userVote: 1 | -1 | null
}

export interface ForumQueryResult {
  threads: ForumThreadRecord[]
  total: number
  page: number
  pageSize: number
  hasMore: boolean
}

export interface ForumSidebarData {
  threadCount: number
  replyCount: number
  memberCount: number
  categoryCounts: Record<string, number>
  pinned: Array<{ id: string; slug: string | null; title: string; replyCount: number }>
}

const FORUM_PAGE_SIZE = 15
const SAFE_SORTS = new Set(["latest", "newest", "most-replies", "featured", "pinned"])
const SAFE_MEDIA = new Set(["images", "video", "links", "social"])

function cleanParam(value: string | null | undefined): string {
  return (value ?? "").trim().slice(0, 120)
}

function safeIlike(value: string): string {
  return value.replace(/[%,()\\]/g, " ").replace(/\s+/g, " ").trim()
}

export function parseForumFilters(input: URLSearchParams | Record<string, string | undefined>): ForumFilters {
  const get = (key: string) => input instanceof URLSearchParams ? input.get(key) ?? "" : input[key] ?? ""
  const sort = cleanParam(get("sort")) as ForumFilters["sort"]
  const pageValue = Number.parseInt(cleanParam(get("page")), 10)
  const category = cleanParam(get("category")).toLowerCase()
  const desk = cleanParam(get("desk")).toLowerCase()
  const origin = cleanParam(get("origin")).toLowerCase()
  const media = cleanParam(get("media")).toLowerCase()

  return {
    q: cleanParam(get("q")),
    category,
    desk,
    origin: origin === "community" || origin === "primary-source" ? origin : "",
    media: SAFE_MEDIA.has(media) ? media as ForumMediaFilter : "",
    sort: SAFE_SORTS.has(sort) ? sort : "latest",
    page: Number.isFinite(pageValue) && pageValue > 0 ? Math.min(pageValue, 100) : 1,
  }
}

function applyForumFilters(query: any, filters: ForumFilters, authorIds: string[]) {
  query = query.eq("is_soft_deleted", false).eq("is_pending", false).eq("status", "published")

  if (filters.category) {
    const categoryName = FORUM_CATEGORIES.find((category) => category.slug === filters.category)?.name
    query = categoryName ? query.or(`category.eq.${filters.category},category.eq.${categoryName}`) : query.eq("category", filters.category)
  }
  if (filters.desk) query = query.eq("desk", filters.desk)
  if (filters.origin === "primary-source") query = query.not("source_url", "is", null)
  if (filters.origin === "community") query = query.is("source_url", null)

  if (filters.q) {
    const term = safeIlike(filters.q)
    const clauses = ["title", "excerpt", "body", "tags", "category", "desk"].map((column) => `${column}.ilike.%${term}%`)
    if (authorIds.length > 0) clauses.push(`author_id.in.(${authorIds.join(",")})`)
    query = query.or(clauses.join(","))
  }

  if (filters.media) {
    const patterns: Record<ForumMediaFilter, string[]> = {
      images: ["body.ilike.%!image%", "body.ilike.%.jpg%", "body.ilike.%.jpeg%", "body.ilike.%.png%", "body.ilike.%.webp%"],
      video: ["body.ilike.%youtube%", "body.ilike.%youtu.be%", "body.ilike.%rumble%", "body.ilike.%.mp4%", "body.ilike.%.webm%"],
      links: ["body.ilike.%http%", "source_url.ilike.%http%"],
      social: ["body.ilike.%twitter.com%", "body.ilike.%x.com%", "body.ilike.%facebook.com%", "body.ilike.%t.me%", "body.ilike.%reddit.com%", "source_url.ilike.%twitter.com%", "source_url.ilike.%x.com%", "source_url.ilike.%facebook.com%", "source_url.ilike.%t.me%", "source_url.ilike.%reddit.com%"],
    }
    query = query.or(patterns[filters.media].join(","))
  }

  return query
}

function applyForumSort(query: any, sort: ForumFilters["sort"]) {
  query = query.order("is_pinned", { ascending: false })
  if (sort === "newest") return query.order("created_at", { ascending: false })
  if (sort === "most-replies") return query.order("reply_count", { ascending: false }).order("last_activity_at", { ascending: false, nullsFirst: false })
  if (sort === "featured") return query.order("is_featured", { ascending: false }).order("last_activity_at", { ascending: false, nullsFirst: false })
  if (sort === "pinned") return query.order("is_pinned", { ascending: false }).order("last_activity_at", { ascending: false, nullsFirst: false })
  return query.order("last_activity_at", { ascending: false, nullsFirst: false }).order("created_at", { ascending: false })
}

export async function getForumThreads(filters: ForumFilters, userId?: string): Promise<ForumQueryResult> {
  const supabase = await createClient()
  let authorIds: string[] = []

  if (filters.q) {
    const authorResult = await supabase.from("profiles").select("id").ilike("display_name", `%${safeIlike(filters.q)}%`).limit(50)
    authorIds = (authorResult.data ?? []).map((profile: { id: string }) => profile.id)
  }

  const select = "id, slug, title, body, excerpt, category, desk, tags, source_url, created_at, last_activity_at, reply_count, view_count, author_id, is_pinned, is_locked, is_featured, is_soft_deleted, profiles(display_name)"
  const from = () => {
    let query = supabase.from("forum_threads").select(select)
    query = applyForumFilters(query, filters, authorIds)
    return query
  }
  const countQuery = applyForumFilters(supabase.from("forum_threads").select("id", { count: "exact", head: true }), filters, authorIds)

  const fromIndex = (filters.page - 1) * FORUM_PAGE_SIZE
  const [countResult, rowsResult] = await Promise.all([
    countQuery,
    applyForumSort(from(), filters.sort).range(fromIndex, fromIndex + FORUM_PAGE_SIZE - 1),
  ])

  if (rowsResult.error) throw new Error(rowsResult.error.message)
  if (countResult.error) throw new Error(countResult.error.message)

  const rows = rowsResult.data ?? []
  const threadIds = rows.map((thread: any) => thread.id)
  const [attachmentsResult, votesResult, userVotesResult] = await Promise.all([
    threadIds.length
      ? supabase.from("forum_attachments").select("thread_id, url, mime_type, created_at").in("thread_id", threadIds).eq("status", "active").order("created_at", { ascending: false })
      : Promise.resolve({ data: [] }),
    threadIds.length
      ? supabase.from("thread_votes").select("thread_id, vote").in("thread_id", threadIds).eq("vote", 1)
      : Promise.resolve({ data: [] }),
    userId && threadIds.length
      ? supabase.from("thread_votes").select("thread_id, vote").eq("user_id", userId).in("thread_id", threadIds)
      : Promise.resolve({ data: [] }),
  ])

  const latestImageMap = new Map<string, string>()
  for (const attachment of attachmentsResult.data ?? []) {
    if (attachment.mime_type?.startsWith("image/") && !latestImageMap.has(attachment.thread_id)) latestImageMap.set(attachment.thread_id, attachment.url)
  }
  const upVoteMap = new Map<string, number>()
  for (const vote of votesResult.data ?? []) upVoteMap.set(vote.thread_id, (upVoteMap.get(vote.thread_id) ?? 0) + 1)
  const userVoteMap = new Map<string, 1 | -1>()
  for (const vote of userVotesResult.data ?? []) if (vote.vote === 1 || vote.vote === -1) userVoteMap.set(vote.thread_id, vote.vote)

  const threads = rows.map((thread: any): ForumThreadRecord => {
    const body = thread.body ?? ""
    const detected = detectMediaBadges(`${body} ${thread.source_url ?? ""}`)
    const media = {
      ...detected,
      hasImages: detected.hasImages || latestImageMap.has(thread.id),
    }
    return {
      id: thread.id,
      slug: thread.slug ?? null,
      title: thread.title,
      body,
      excerpt: thread.excerpt?.trim() || buildExcerpt(body, 200) || null,
      category: thread.category ?? null,
      desk: thread.desk ?? null,
      tags: thread.tags ?? null,
      sourceUrl: thread.source_url ?? null,
      origin: thread.source_url ? "primary-source" : "community",
      media,
      latestImageUrl: latestImageMap.get(thread.id) ?? null,
      created_at: thread.created_at,
      last_activity_at: thread.last_activity_at ?? thread.created_at,
      viewCount: Number(thread.view_count ?? 0),
      author_id: thread.author_id,
      authorName: thread.profiles?.display_name ?? "operator",
      replyCount: Number(thread.reply_count ?? 0),
      is_pinned: Boolean(thread.is_pinned),
      is_locked: Boolean(thread.is_locked),
      is_featured: Boolean(thread.is_featured),
      is_soft_deleted: Boolean(thread.is_soft_deleted),
      upVoteCount: upVoteMap.get(thread.id) ?? 0,
      userVote: userVoteMap.get(thread.id) ?? null,
    }
  })

  const total = countResult.count ?? 0
  return { threads, total, page: filters.page, pageSize: FORUM_PAGE_SIZE, hasMore: fromIndex + threads.length < total }
}

export async function getForumSidebarData(): Promise<ForumSidebarData> {
  const supabase = await createClient()
  const publicFilter = (table: string) => supabase.from(table).select("id", { count: "exact", head: true }).eq("is_soft_deleted", false).eq("is_pending", false).eq("status", "published")
  const categoryCounts: Record<string, number> = {}
  const categoryResults = await Promise.all(FORUM_CATEGORIES.map((category) => publicFilter("forum_threads").or(`category.eq.${category.slug},category.eq.${category.name}`)))
  FORUM_CATEGORIES.forEach((category, index) => { categoryCounts[category.slug] = categoryResults[index].count ?? 0 })

  const [threadCount, replyCount, memberCount, pinnedResult] = await Promise.all([
    publicFilter("forum_threads"),
    supabase.from("forum_replies").select("id", { count: "exact", head: true }).eq("is_pending", false).eq("is_hidden", false).eq("status", "published"),
    supabase.from("profiles").select("id", { count: "exact", head: true }).eq("status", "active"),
    supabase.from("forum_threads").select("id, slug, title, reply_count").eq("is_soft_deleted", false).eq("is_pending", false).eq("status", "published").eq("is_pinned", true).order("last_activity_at", { ascending: false, nullsFirst: false }).limit(5),
  ])

  return {
    threadCount: threadCount.count ?? 0,
    replyCount: replyCount.count ?? 0,
    memberCount: memberCount.count ?? 0,
    categoryCounts,
    pinned: (pinnedResult.data ?? []).map((thread: any) => ({ id: thread.id, slug: thread.slug ?? null, title: thread.title, replyCount: Number(thread.reply_count ?? 0) })),
  }
}
