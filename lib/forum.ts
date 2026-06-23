import { createClient } from "@/lib/supabase/server"

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

    return scored.slice(0, limit).map(({ t }) => ({
      id: t.id,
      title: t.title,
      body: t.body,
      authorName: t.profiles?.display_name || "Anonymous",
      createdAt: t.created_at,
      replyCount: (t.forum_replies?.[0]?.count ?? 0) as number,
      category: t.category || undefined,
      isPinned: t.is_pinned || false,
      isFeatured: t.is_featured || false,
    }))
  } catch (error) {
    console.error("[v0] Failed to fetch top forum threads:", error)
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
