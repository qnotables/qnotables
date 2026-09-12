import { redirect } from "next/navigation"
import { PageHeader } from "@/components/dashboard/ui"
import { FooterManager } from "@/components/dashboard/footer-manager"
import { getFooterDraftConfig } from "@/lib/footer-config"
import { validateDashboardAccess } from "@/lib/dashboard-auth"

export const dynamic = "force-dynamic"

export const metadata = {
  title: "Footer & Social — Admin Dashboard",
  description: "Manage the published QNotables footer, links, and social profiles.",
}

export default async function FooterDashboardPage() {
  if (!(await validateDashboardAccess())) redirect("/dashboard/login")
  const config = await getFooterDraftConfig()

  return (
    <div className="flex flex-col gap-8">
      <PageHeader title="Footer & Social" description="Manage the shared footer without touching page templates." breadcrumbs={[{ label: "Footer & Social" }]} />
      <FooterManager initialConfig={config} />
    </div>
  )
}
