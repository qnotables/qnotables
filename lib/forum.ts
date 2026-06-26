import { createClient } from "@/lib/supabase/server"

export interface ForumThreadLatestReply {
  body: string
  authorName: string
  createdAt: string
}

export interface ForumThread {
  id: string
  title: string
  body: string
  authorName: string
  createdAt: string
  updatedAt?: string
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
 * Returns the N most recent forum threads, sorted newest first,
 * enriched with each thread's latest visible reply.
 */
export async function getRecentForumThreads(limit = 3): Promise<ForumThread[]> {
  try {
    const supabase = await createClient()

    const { data: threads } = await supabase
      .from("forum_threads")
      .select(
        "id, title, body, created_at, category, is_pinned, is_featured, profiles(display_name), forum_replies(count)"
      )
      .eq("is_soft_deleted", false)
      .order("created_at", { ascending: false })
      .limit(limit)

    if (!threads || threads.length === 0) return []

    const topIds = threads.map((t: any) => t.id)

    // Fetch the most recent visible reply for each thread in one query
    const { data: recentReplies } = await supabase
      .from("forum_replies")
      .select("thread_id, body, created_at, profiles(display_name)")
      .in("thread_id", topIds)
      .eq("is_pending", false)
      .eq("is_hidden", false)
      .order("created_at", { ascending: false })

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

    return threads.map((t: any) => ({
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
