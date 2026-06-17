import { redirect } from "next/navigation"
import Link from "next/link"
import { ImportForm } from "@/components/import-form"
import { validateDashboardAccess } from "@/lib/dashboard-auth"
import { PageHeader } from "@/components/dashboard/ui"
import { Rss, ArrowRight } from "lucide-react"

export const dynamic = "force-dynamic"

export const metadata = {
  title: "Import Posts — Admin Dashboard",
  description: "Import posts from Wix, CSV, JSON, Markdown, or RSS feeds.",
}

export default async function ImportPage() {
  const hasAccess = await validateDashboardAccess()
  if (!hasAccess) redirect("/dashboard/login")

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Import Posts"
        description="Import posts from Wix, CSV, JSON, Markdown, or RSS feeds."
        breadcrumbs={[{ label: "Import" }]}
      />

      {/* Wix import card */}
      <div className="max-w-4xl">
        <Link
          href="/dashboard/import/wix"
          className="flex items-center justify-between gap-4 rounded border border-primary/40 bg-primary/5 p-5 transition-colors hover:bg-primary/10"
        >
          <div className="flex items-center gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded border border-primary/30 bg-primary/10">
              <Rss className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="stencil text-base text-foreground">IMPORT FROM WIX</p>
              <p className="label-mono text-xs text-muted-foreground">
                RSS feed · Wix API JSON · Manual paste — preserves original publish dates
              </p>
            </div>
          </div>
          <ArrowRight className="h-5 w-5 shrink-0 text-primary" />
        </Link>
      </div>

      {/* Generic import form */}
      <div className="max-w-4xl">
        <p className="label-mono mb-4 text-xs font-semibold text-muted-foreground">
          GENERAL IMPORT (CSV / JSON / MARKDOWN / RSS)
        </p>
        <ImportForm />
      </div>
    </div>
  )
}
