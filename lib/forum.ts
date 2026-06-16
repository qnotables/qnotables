import { createClient } from "@/lib/supabase/server"

export interface ForumThread {
  id: string
  title: string
  body: string
  authorName: string
  createdAt: string
  replyCount: number
}

export async function getHottestForumThread(): Promise<ForumThread | null> {
  try {
    const supabase = await createClient()

    const { data: threads } = await supabase
      .from("forum_threads")
      .select("id, title, body, created_at, author_id, profiles(display_name), forum_replies(count)")
      .order("created_at", { ascending: false })
      .limit(20) // Get last 20 to find the hottest

    if (!threads || threads.length === 0) return null

    // Find the thread with the most replies
    let hottestThread = threads[0]
    let maxReplies = 0

    for (const thread of threads) {
      const replyCount = (thread as any).forum_replies?.[0]?.count ?? 0
      if (replyCount > maxReplies) {
        maxReplies = replyCount
        hottestThread = thread
      }
    }

    const thread = hottestThread as any
    return {
      id: thread.id,
      title: thread.title,
      body: thread.body,
      authorName: thread.profiles?.display_name || "Anonymous",
      createdAt: thread.created_at,
      replyCount: (thread.forum_replies?.[0]?.count ?? 0) as number,
    }
  } catch (error) {
    console.error("[v0] Failed to fetch hottest forum thread:", error)
    return null
  }
}

export async function getLatestForumThread(): Promise<ForumThread | null> {
  try {
    const supabase = await createClient()

    const { data: threads } = await supabase
      .from("forum_threads")
      .select("id, title, body, created_at, author_id, profiles(display_name), forum_replies(count)")
      .order("created_at", { ascending: false })
      .limit(1)
      .single()

    if (!threads) return null

    const thread = threads as any
    return {
      id: thread.id,
      title: thread.title,
      body: thread.body,
      authorName: thread.profiles?.display_name || "Anonymous",
      createdAt: thread.created_at,
      replyCount: (thread.forum_replies?.[0]?.count ?? 0) as number,
    }
  } catch (error) {
    console.error("[v0] Failed to fetch latest forum thread:", error)
    return null
  }
}
