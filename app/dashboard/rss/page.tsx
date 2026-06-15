import { redirect } from "next/navigation"
import { createAdminClient } from "@/lib/supabase/admin"
import { validateDashboardAccess } from "@/lib/dashboard-auth"
import { PageHeader, StatCard } from "@/components/dashboard/ui"
import { RssManager, type RssItemRow } from "@/components/dashboard/rss-manager"
import { Rss, CheckCircle2, ExternalLink } from "lucide-react"

export const metadata = {
  title: "RSS Feed — Admin Dashboard",
  description: "Curate items for the public RSS feed.",
}

export default async function RssPage() {
  const hasAccess = await validateDashboardAccess()
  if (!hasAccess) redirect("/dashboard/login")

  const admin = createAdminClient()
  const { data } = await admin
    .from("rss_items")
    .select("*")
    .order("created_at", { ascending: false })

  const items = (data || []) as RssItemRow[]
  const published = items.filter((i) => i.status === "published").length

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="RSS Feed"
        description="Curate items distributed through the public feed."
        breadcrumbs={[{ label: "RSS Feed" }]}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Total Items" value={items.length} icon={Rss} />
        <StatCard label="Published" value={published} icon={CheckCircle2} />
        <div className="flex flex-col justify-center border border-border bg-card p-6">
          <a
            href="/feed.xml"
            target="_blank"
            rel="noopener noreferrer"
            className="label-mono inline-flex items-center gap-2 text-sm text-primary hover:underline"
          >
            <ExternalLink className="h-4 w-4" /> View public feed
          </a>
        </div>
      </div>

      <RssManager items={items} />
    </div>
  )
}
