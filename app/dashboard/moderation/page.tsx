import { redirect } from "next/navigation"
import { createAdminClient } from "@/lib/supabase/admin"
import { validateDashboardAccess } from "@/lib/dashboard-auth"
import { PageHeader, StatCard } from "@/components/dashboard/ui"
import { ModerationQueue, type FlagRow } from "@/components/dashboard/moderation-queue"
import { PendingPostsQueue, type PendingThread, type PendingReply } from "@/components/dashboard/pending-posts-queue"
import { ShieldAlert, Inbox, CheckCircle2, Clock } from "lucide-react"

export const metadata = {
  title: "Moderation — Admin Dashboard",
  description: "Review flagged content.",
}

export default async function ModerationPage() {
  const hasAccess = await validateDashboardAccess()
  if (!hasAccess) redirect("/dashboard/login")

  const admin = createAdminClient()

  // Fetch moderation flags, pending threads, and pending replies in parallel
  const [flagsResult, pendingThreadsResult, pendingRepliesResult] = await Promise.all([
    admin
      .from("moderation_flags")
      .select("id, content_type, content_id, reason, reported_by, status, created_at")
      .order("created_at", { ascending: false }),
    admin
      .from("forum_threads")
      .select("id, title, body, created_at, author_id, profiles(display_name)")
      .eq("is_pending", true)
      .eq("is_soft_deleted", false)
      .order("created_at", { ascending: false }),
    admin
      .from("forum_replies")
      .select("id, body, created_at, author_id, thread_id, profiles(display_name), forum_threads(title)")
      .eq("is_pending", true)
      .eq("is_hidden", false)
      .order("created_at", { ascending: false }),
  ])

  const raw = flagsResult.data || []

  // Reporter names
  const reporterIds = Array.from(new Set(raw.map((f: any) => f.reported_by).filter(Boolean)))
  const nameMap = new Map<string, string>()
  if (reporterIds.length > 0) {
    const { data: profs } = await admin.from("profiles").select("id, display_name, username").in("id", reporterIds)
    for (const p of profs || []) nameMap.set(p.id, p.display_name || p.username || "Anonymous")
  }

  const flags: FlagRow[] = raw.map((f: any) => ({
    id: f.id,
    content_type: f.content_type,
    content_id: f.content_id,
    reason: f.reason,
    reporter: f.reported_by ? nameMap.get(f.reported_by) ?? "Anonymous" : null,
    status: f.status,
    created_at: f.created_at,
  }))

  const pendingThreads: PendingThread[] = (pendingThreadsResult.data ?? []).map((t: any) => ({
    id: t.id,
    title: t.title,
    body: t.body ?? "",
    created_at: t.created_at,
    author_id: t.author_id,
    authorName: t.profiles?.display_name ?? "operator",
  }))

  const pendingReplies: PendingReply[] = (pendingRepliesResult.data ?? []).map((r: any) => ({
    id: r.id,
    thread_id: r.thread_id,
    threadTitle: r.forum_threads?.title ?? "Unknown thread",
    body: r.body ?? "",
    created_at: r.created_at,
    author_id: r.author_id,
    authorName: r.profiles?.display_name ?? "operator",
  }))

  const pendingCount = pendingThreads.length + pendingReplies.length
  const open = flags.filter((f) => f.status === "open").length
  const resolved = flags.filter((f) => f.status === "actioned" || f.status === "dismissed").length

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Moderation"
        description="Review flagged content and posts awaiting approval."
        breadcrumbs={[{ label: "Moderation" }]}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        <StatCard label="Pending Approval" value={pendingCount} icon={Clock} />
        <StatCard label="Open Flags" value={open} icon={Inbox} />
        <StatCard label="Resolved" value={resolved} icon={CheckCircle2} />
        <StatCard label="Total Flags" value={flags.length} icon={ShieldAlert} />
      </div>

      {pendingCount > 0 && (
        <section className="flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <Clock className="h-4 w-4 text-amber-400" />
            <h2 className="stencil text-lg text-foreground">
              Pending Approval
              <span className="ml-2 label-mono text-sm font-normal text-amber-400">
                {pendingCount}
              </span>
            </h2>
          </div>
          <PendingPostsQueue threads={pendingThreads} replies={pendingReplies} />
        </section>
      )}

      <section className="flex flex-col gap-4">
        <h2 className="stencil text-lg text-foreground">Flagged Content</h2>
        <ModerationQueue flags={flags} />
      </section>
    </div>
  )
}
