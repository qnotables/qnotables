import { redirect } from "next/navigation"
import { createAdminClient } from "@/lib/supabase/admin"
import { validateDashboardAccess } from "@/lib/dashboard-auth"
import { PageHeader, StatCard } from "@/components/dashboard/ui"
import { ModerationQueue, type FlagRow } from "@/components/dashboard/moderation-queue"
import { ShieldAlert, Inbox, CheckCircle2 } from "lucide-react"

export const metadata = {
  title: "Moderation — Admin Dashboard",
  description: "Review flagged content.",
}

export default async function ModerationPage() {
  const hasAccess = await validateDashboardAccess()
  if (!hasAccess) redirect("/dashboard/login")

  const admin = createAdminClient()
  const { data } = await admin
    .from("moderation_flags")
    .select("id, content_type, content_id, reason, reported_by, status, created_at")
    .order("created_at", { ascending: false })

  const raw = data || []

  // reporter names
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

  const open = flags.filter((f) => f.status === "open").length
  const resolved = flags.filter((f) => f.status === "actioned" || f.status === "dismissed").length

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Moderation"
        description="Review and resolve flagged content from the community."
        breadcrumbs={[{ label: "Moderation" }]}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Open Flags" value={open} icon={Inbox} />
        <StatCard label="Resolved" value={resolved} icon={CheckCircle2} />
        <StatCard label="Total" value={flags.length} icon={ShieldAlert} />
      </div>

      <ModerationQueue flags={flags} />
    </div>
  )
}
