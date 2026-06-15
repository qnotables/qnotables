import { createAdminClient } from "@/lib/supabase/admin"
import { PRODUCTS } from "@/lib/products"

export interface DashboardStats {
  totalPosts: number
  publishedPosts: number
  draftPosts: number
  archivedPosts: number
  forumThreads: number
  forumReplies: number
  flaggedItems: number
  registeredUsers: number
  activeAds: number
  shopProducts: number
  mediaAssets: number
}

export interface ActivityEntry {
  id: string
  actor_label: string | null
  action: string
  target_type: string | null
  target_id: string | null
  details: string | null
  created_at: string
}

async function safeCount(
  table: string,
  build?: (q: any) => any,
): Promise<number> {
  try {
    const admin = createAdminClient()
    let q = admin.from(table).select("*", { count: "exact", head: true })
    if (build) q = build(q)
    const { count, error } = await q
    if (error) {
      console.error(`[v0] count(${table}) error`, error.message)
      return 0
    }
    return count ?? 0
  } catch (err) {
    console.error(`[v0] count(${table}) exception`, err)
    return 0
  }
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const [
    totalPosts,
    publishedPosts,
    draftPosts,
    archivedPosts,
    forumThreads,
    forumReplies,
    flaggedItems,
    registeredUsers,
    activeAds,
    mediaAssets,
  ] = await Promise.all([
    safeCount("blog_posts"),
    safeCount("blog_posts", (q) => q.eq("status", "published")),
    safeCount("blog_posts", (q) => q.eq("status", "draft")),
    safeCount("blog_posts", (q) => q.eq("status", "archived")),
    safeCount("forum_threads"),
    safeCount("forum_replies"),
    safeCount("moderation_flags", (q) => q.eq("status", "open")),
    safeCount("profiles"),
    safeCount("ads", (q) => q.eq("is_active", true)),
    safeCount("media_assets"),
  ])

  return {
    totalPosts,
    publishedPosts,
    draftPosts,
    archivedPosts,
    forumThreads,
    forumReplies,
    flaggedItems,
    registeredUsers,
    activeAds,
    shopProducts: PRODUCTS.length,
    mediaAssets,
  }
}

export async function getRecentActivity(limit = 8): Promise<ActivityEntry[]> {
  try {
    const admin = createAdminClient()
    const { data, error } = await admin
      .from("activity_log")
      .select("id, actor_label, action, target_type, target_id, details, created_at")
      .order("created_at", { ascending: false })
      .limit(limit)
    if (error) {
      console.error("[v0] getRecentActivity error", error.message)
      return []
    }
    return (data as ActivityEntry[]) ?? []
  } catch (err) {
    console.error("[v0] getRecentActivity exception", err)
    return []
  }
}

/** Records an admin/moderation action for the activity log. Best-effort. */
export async function logActivity(entry: {
  actorLabel?: string
  action: string
  targetType?: string
  targetId?: string
  details?: string
}): Promise<void> {
  try {
    const admin = createAdminClient()
    await admin.from("activity_log").insert({
      actor_label: entry.actorLabel ?? "Admin",
      action: entry.action,
      target_type: entry.targetType ?? null,
      target_id: entry.targetId ?? null,
      details: entry.details ?? null,
    })
  } catch (err) {
    console.error("[v0] logActivity exception", err)
  }
}
