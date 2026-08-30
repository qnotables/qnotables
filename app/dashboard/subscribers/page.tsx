import { redirect } from "next/navigation"
import { Download, Mail, Radio } from "lucide-react"
import { Button } from "@/components/ui/button"
import { PageHeader, StatCard, ErrorState } from "@/components/dashboard/ui"
import {
  SubscribersTable,
  type SubscriberRow,
} from "@/components/dashboard/subscribers-table"
import { validateDashboardAccess } from "@/lib/dashboard-auth"
import { createAdminClient } from "@/lib/supabase/admin"

export const dynamic = "force-dynamic"

export const metadata = {
  title: "Newsletter Subscribers — Admin Dashboard",
  description: "View and export newsletter subscriber email addresses.",
}

export default async function SubscribersPage() {
  const hasAccess = await validateDashboardAccess()
  if (!hasAccess) redirect("/dashboard/login")

  let subscribers: SubscriberRow[] = []
  let loadError = false

  try {
    const admin = createAdminClient()
    const { data, error } = await admin
      .from("newsletter_subscribers")
      .select("id, email, source, created_at")
      .order("created_at", { ascending: false })

    if (error) throw error

    subscribers = (data ?? []).map((subscriber) => ({
      id: subscriber.id,
      email: subscriber.email,
      source: subscriber.source,
      createdAt: subscriber.created_at,
    }))
  } catch (error) {
    console.error("[v0] Failed to load newsletter subscribers:", error)
    loadError = true
  }

  const dailyBriefing = subscribers.filter(
    (subscriber) => subscriber.source === "homepage-daily-briefing",
  ).length
  const newToQ = subscribers.filter((subscriber) => subscriber.source === "new-to-q").length

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Newsletter Subscribers"
        description="Review collected email addresses and export your mailing list."
        breadcrumbs={[{ label: "Subscribers" }]}
        action={
          <Button render={<a href="/dashboard/subscribers/export" />} disabled={loadError}>
            <Download data-icon="inline-start" />
            Export CSV
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Total Subscribers" value={subscribers.length} icon={Mail} />
        <StatCard label="Daily Briefing" value={dailyBriefing} icon={Radio} />
        <StatCard label="New to Q" value={newToQ} icon={Mail} />
      </div>

      {loadError ? (
        <ErrorState message="Subscriber data could not be loaded. Please try again." />
      ) : (
        <SubscribersTable subscribers={subscribers} />
      )}
    </div>
  )
}
