import { redirect } from "next/navigation"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { ImportForm } from "@/components/import-form"
import { validateDashboardAccess } from "@/lib/dashboard-auth"

export const metadata = {
  title: "Import Posts — Admin Dashboard",
  description: "Import posts from CSV, JSON, Markdown, or RSS feeds.",
}

export default async function ImportPage() {
  const hasAccess = await validateDashboardAccess()
  if (!hasAccess) {
    redirect("/dashboard/login")
  }

  return (
    <>
      <SiteHeader />
      <main className="min-h-screen bg-background">
        <div className="mx-auto max-w-4xl px-4 py-8 md:px-6 md:py-12">
          <Link
            href="/dashboard"
            className="label-mono mb-8 inline-flex items-center gap-2 text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Link>

          <div className="mb-8">
            <h1 className="stencil mb-2 text-3xl text-foreground">Import Posts</h1>
            <p className="label-mono text-muted-foreground">
              Import posts from CSV, JSON, Markdown, or RSS feeds. Posts will be automatically dated and slug-generated.
            </p>
          </div>

          <ImportForm />
        </div>
      </main>
      <SiteFooter />
    </>
  )
}
