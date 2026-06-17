import { redirect } from "next/navigation"
import { validateDashboardAccess } from "@/lib/dashboard-auth"
import { PageHeader } from "@/components/dashboard/ui"
import { WixImportForm } from "@/components/dashboard/wix-import-form"

export const dynamic = "force-dynamic"

export const metadata = {
  title: "Import from Wix — Admin Dashboard",
  description: "Import old Wix blog posts while preserving original publish dates.",
}

export default async function WixImportPage() {
  const hasAccess = await validateDashboardAccess()
  if (!hasAccess) redirect("/dashboard/login")

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="IMPORT FROM WIX"
        description="Import old Wix blog posts via RSS feed, Wix API JSON, or manual paste. Original publish dates are preserved."
        breadcrumbs={[
          { label: "Import", href: "/dashboard/import" },
          { label: "Wix" },
        ]}
      />
      <div className="max-w-5xl">
        <WixImportForm />
      </div>
    </div>
  )
}
