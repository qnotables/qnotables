import Link from "next/link"
import { redirect } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { NewThreadForm } from "@/components/new-thread-form"
import { createClient } from "@/lib/supabase/server"

export const metadata = { title: "New Thread — Hot and Fresh" }

export default async function NewThreadPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/auth/login?next=/forum/new")

  return (
    <div id="top" className="min-h-screen tactical-grid">
      <SiteHeader />

      <main className="mx-auto max-w-5xl px-4 py-10 md:px-6">
        <Link
          href="/forum"
          className="label-mono mb-8 inline-flex items-center gap-2 text-muted-foreground transition-colors hover:text-primary"
        >
          <ArrowLeft className="h-4 w-4" /> The Town Hall
        </Link>

        <div className="mb-8 flex items-center gap-3">
          <span className="h-2 w-2 bg-primary" />
          <h1 className="stencil text-2xl text-foreground md:text-3xl">Open A New Thread</h1>
        </div>

        <div className="corner-frame border border-border bg-card p-6 md:p-8">
          <NewThreadForm />
        </div>
      </main>

      <SiteFooter />
    </div>
  )
}
