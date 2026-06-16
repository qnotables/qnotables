import { redirect } from "next/navigation"
import { ImportForm } from "@/components/import-form"
import { validateDashboardAccess } from "@/lib/dashboard-auth"
import { PageHeader } from "@/components/dashboard/ui"

export const dynamic = "force-dynamic"

export const metadata = {
  title: "Import Posts — Admin Dashboard",
  description: "Import posts from CSV, JSON, Markdown, or RSS feeds.",
}

export default async function ImportPage() {
  const hasAccess = await validateDashboardAccess()
  if (!hasAccess) redirect("/dashboard/login")

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Import Posts"
        description="Import posts from CSV, JSON, Markdown, or RSS feeds. Posts will be automatically dated and slug-generated."
        breadcrumbs={[{ label: "Import" }]}
      />
      <div className="max-w-4xl">
        <ImportForm />
      </div>
    </div>
  )
}
