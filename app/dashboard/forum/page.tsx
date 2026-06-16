import { redirect } from "next/navigation"
import { createAdminClient } from "@/lib/supabase/admin"
import { validateDashboardAccess } from "@/lib/dashboard-auth"
import { PageHeader, StatCard } from "@/components/dashboard/ui"
import { ForumTable, type ForumThreadRow } from "@/components/dashboard/forum-table"
import { MessageSquare, Pin, Lock, Star } from "lucide-react"

export const dynamic = "force-dynamic"

export const metadata = {
  title: "Forum Management — Admin Dashboard",
  description: "Moderate forum discussions and topics.",
}

export default async function ForumPage() {
  const hasAccess = await validateDashboardAccess()
  if (!hasAccess) redirect("/dashboard/login")

  const admin = createAdminClient()

  // All threads (including soft-deleted, so admins can see hidden posts)
  const { data: threadsData } = await admin
    .from("forum_threads")
    .select(
      "id, title, body, author_id, category, created_at, is_pinned, is_locked, is_featured, is_soft_deleted",
    )
    .order("created_at", { ascending: false })

  const threadsRaw = threadsData ?? []

  // Author display names
  const authorIds = Array.from(
    new Set(threadsRaw.map((t: any) => t.author_id).filter(Boolean)),
  )
  const authorMap = new Map<string, string>()
  if (authorIds.length > 0) {
    const { data: profs } = await admin
      .from("profiles")
      .select("id, display_name, username")
      .in("id", authorIds)
    for (const p of profs ?? []) {
      authorMap.set(p.id, p.display_name || p.username || "Anonymous")
    }
  }

  // Reply counts per thread
  const { data: repliesData } = await admin.from("forum_replies").select("thread_id")
  const replyCounts = new Map<string, number>()
  for (const r of repliesData ?? []) {
    replyCounts.set(r.thread_id, (replyCounts.get(r.thread_id) ?? 0) + 1)
  }

  const threads: ForumThreadRow[] = threadsRaw.map((t: any) => ({
    id: t.id,
    title: t.title,
    body: t.body ?? "",
    author: authorMap.get(t.author_id) ?? "Anonymous",
    category: t.category,
    replies: replyCounts.get(t.id) ?? 0,
    createdAt: t.created_at,
    isPinned: Boolean(t.is_pinned),
    isLocked: Boolean(t.is_locked),
    isFeatured: Boolean(t.is_featured),
    isHidden: Boolean(t.is_soft_deleted),
  }))

  const visible = threads.filter((t) => !t.isHidden)
  const hidden = threads.filter((t) => t.isHidden)
  const pinned = threads.filter((t) => t.isPinned).length
  const locked = threads.filter((t) => t.isLocked).length
  const featured = threads.filter((t) => t.isFeatured).length
  const totalReplies = [...replyCounts.values()].reduce((a, b) => a + b, 0)

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Forum Management"
        description="Moderate discussions — pin, lock, feature, or remove threads."
        breadcrumbs={[{ label: "Forum" }]}
      />

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        <StatCard label="Total Threads" value={visible.length} icon={MessageSquare} />
        <StatCard label="Total Replies" value={totalReplies} icon={MessageSquare} />
        <StatCard label="Pinned" value={pinned} icon={Pin} />
        <StatCard label="Locked" value={locked} icon={Lock} />
        <StatCard label="Featured" value={featured} icon={Star} />
        <StatCard label="Hidden" value={hidden.length} icon={MessageSquare} />
      </div>

      <ForumTable threads={threads} />
    </div>
  )
}
