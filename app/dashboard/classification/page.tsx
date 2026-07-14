import { redirect } from "next/navigation"
import { BarChart3, Flag, Layers3, ShieldCheck } from "lucide-react"
import { ClassificationManager } from "@/components/dashboard/classification-manager"
import { PageHeader, StatCard } from "@/components/dashboard/ui"
import { validateDashboardAccess } from "@/lib/dashboard-auth"
import { createAdminClient } from "@/lib/supabase/admin"
import { previewReclassification } from "./actions"

export const dynamic = "force-dynamic"
export const metadata = { title: "Story Classification — Admin Dashboard", description: "Preview, review, and lock automated news-desk classifications." }

export default async function ClassificationPage() {
  if (!(await validateDashboardAccess())) redirect("/dashboard/login")
  const db = createAdminClient()
  const [{ count: classified }, { count: lowConfidence }, { count: manualCorrections }, distribution] = await Promise.all([
    db.from("rss_items").select("id", { count: "exact", head: true }).not("primary_category", "is", null),
    db.from("rss_items").select("id", { count: "exact", head: true }).lt("classification_confidence", 65),
    db.from("rss_classification_events").select("id", { count: "exact", head: true }).eq("event_type", "manual_correction"),
    db.from("rss_items").select("primary_category").not("primary_category", "is", null),
  ])
  const categoryCount = new Set((distribution.data ?? []).map((item) => item.primary_category)).size
  const initial = await previewReclassification({ reviewStatus: "moderation" })

  return <div className="flex flex-col gap-8">
    <PageHeader title="Story Classification" description="Audit deterministic desk assignments, preview bulk changes, and preserve editorial corrections." breadcrumbs={[{ label: "Classification" }]} />
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      <StatCard label="Classified" value={classified ?? 0} icon={ShieldCheck} />
      <StatCard label="Active Desks" value={categoryCount} icon={Layers3} />
      <StatCard label="Low Confidence" value={lowConfidence ?? 0} icon={Flag} />
      <StatCard label="Manual Corrections" value={manualCorrections ?? 0} icon={BarChart3} />
    </div>
    <ClassificationManager initial={initial} />
  </div>
}
