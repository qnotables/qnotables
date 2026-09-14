import { redirect } from "next/navigation"
import { createAdminClient } from "@/lib/supabase/admin"
import { validateDashboardAccess } from "@/lib/dashboard-auth"
import { getSignalAnalysisItems, getSignalAnalysisSettings } from "@/lib/signal-analysis"
import { PageHeader } from "@/components/dashboard/ui"
import { SignalAnalysisReview } from "@/components/dashboard/signal-analysis-review"

export const metadata = {
  title: "Signal Analysis — Admin Dashboard",
  description: "Review scored signals before they appear in the public preview.",
}

export default async function SignalAnalysisPage() {
  if (!(await validateDashboardAccess())) redirect("/dashboard/login")

  const [items, settings, { data: latestRun }] = await Promise.all([
    getSignalAnalysisItems({ limit: 100 }),
    getSignalAnalysisSettings(),
    createAdminClient()
      .from("signal_analysis_runs")
      .select("status, triggered_by, started_at, finished_at, scanned_count, created_count, updated_count, error_count")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ])

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Signal Analysis"
        description="Score, review, and publish high-signal items from the wire and notables desks."
        breadcrumbs={[{ label: "Signal Analysis" }]}
      />

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="border border-border bg-card p-4"><p className="label-mono text-[10px] text-muted-foreground">ENGINE</p><p className="stencil mt-2 text-lg text-foreground">{settings.enabled ? "ACTIVE" : "OFFLINE"}</p></div>
        <div className="border border-border bg-card p-4"><p className="label-mono text-[10px] text-muted-foreground">PUBLIC PREVIEW</p><p className="stencil mt-2 text-lg text-foreground">{settings.previewEnabled ? "VISIBLE" : "HIDDEN"}</p></div>
        <div className="border border-border bg-card p-4"><p className="label-mono text-[10px] text-muted-foreground">MINIMUM SCORE</p><p className="stencil mt-2 text-lg text-foreground">{settings.minScore}</p></div>
        <div className="border border-border bg-card p-4"><p className="label-mono text-[10px] text-muted-foreground">LAST RUN</p><p className="label-mono mt-2 text-xs text-foreground">{latestRun ? `${latestRun.status} · ${latestRun.scanned_count} scanned` : "No runs yet"}</p></div>
      </section>

      {latestRun ? <p className="label-mono text-xs text-muted-foreground">Last {latestRun.triggered_by} run started {new Date(latestRun.started_at).toLocaleString()} with {latestRun.created_count} new, {latestRun.updated_count} refreshed, and {latestRun.error_count} errors.</p> : null}
      <SignalAnalysisReview initialItems={items} />
    </div>
  )
}
