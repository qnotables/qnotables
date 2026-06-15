import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { isAdminEmail } from "@/lib/admin"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { ImportForm } from "@/components/import-form"

export const metadata = {
  title: "Import Posts — Dashboard",
}

export default async function ImportPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect("/auth/login")
  if (!isAdminEmail(user.email)) redirect("/")

  return (
    <div id="top" className="min-h-screen tactical-grid">
      <SiteHeader />

      <main className="mx-auto max-w-4xl px-4 py-10 md:px-6">
        <div className="mb-8 flex items-center gap-3">
          <span className="h-2 w-2 bg-primary" />
          <h1 className="stencil text-3xl md:text-4xl text-foreground">Import Posts</h1>
        </div>

        <p className="label-mono mb-6 text-muted-foreground">
          Import posts from CSV, JSON, Markdown, or RSS feeds. Posts will be automatically dated and slug-generated.
        </p>

        <ImportForm />
      </main>

      <SiteFooter />
    </div>
  )
}
