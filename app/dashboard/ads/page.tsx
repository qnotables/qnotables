import { redirect } from "next/navigation"
import { validateDashboardAccess } from "@/lib/dashboard-auth"
import { getAllAds } from "@/lib/ads"
import { PageHeader, StatCard } from "@/components/dashboard/ui"
import { AdsManager } from "@/components/dashboard/ads-manager"
import { Megaphone, Power } from "lucide-react"

export const metadata = {
  title: "Ads Management — Admin Dashboard",
  description: "Manage advertisements and promotions.",
}

export default async function AdsPage() {
  const hasAccess = await validateDashboardAccess()
  if (!hasAccess) redirect("/dashboard/login")

  const ads = await getAllAds()
  const active = ads.filter((a) => a.is_active).length

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Ads Management"
        description="Create and manage ad banners across the site."
        breadcrumbs={[{ label: "Ads" }]}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <StatCard label="Total Ads" value={ads.length} icon={Megaphone} />
        <StatCard label="Active" value={active} icon={Power} />
      </div>

      <AdsManager ads={ads} />
    </div>
  )
}
