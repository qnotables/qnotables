import { redirect } from "next/navigation"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { validateDashboardAccess } from "@/lib/dashboard-auth"

export const metadata = {
  title: "Blog — Admin Dashboard",
  description: "Manage blog posts.",
}

export default async function BlogPage() {
  const hasAccess = await validateDashboardAccess()
  if (!hasAccess) {
    redirect("/dashboard/login")
  }

  return (
    <>
      <SiteHeader />
      <main className="min-h-screen bg-background">
        <div className="mx-auto max-w-7xl px-4 py-8 md:px-6 md:py-12">
          <Link
            href="/dashboard"
            className="label-mono mb-8 inline-flex items-center gap-2 text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Link>

          <div className="border border-border bg-card p-8 text-center">
            <h1 className="stencil mb-2 text-2xl text-foreground">Blog Management</h1>
            <p className="label-mono text-muted-foreground">Coming soon</p>
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  )
}
