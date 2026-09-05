import Link from "next/link"
import { redirect } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { NewThreadForm } from "@/components/new-thread-form"
import { createClient } from "@/lib/supabase/server"

export const metadata = { title: "New Thread — Hot and Fresh" }

type ImportedDraft = {
  title?: string
  content?: string
  sourceUrl?: string
  category?: string
  tags?: string
  desk?: string
  author?: string
  publishedAt?: string
  imageUrl?: string
  sourceName?: string
}

export default async function NewThreadPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const params = await searchParams
  const value = (key: string) => {
    const value = params[key]
    return Array.isArray(value) ? value[0] : value
  }
  const importedDraft: ImportedDraft | undefined = value("imported") === "1"
    ? {
        title: value("title"),
        content: value("content"),
        sourceUrl: value("source_url"),
        category: value("category"),
        tags: value("tags"),
        desk: value("desk"),
        author: value("author"),
        publishedAt: value("published_at"),
        imageUrl: value("image_url"),
        sourceName: value("source_name"),
      }
    : undefined

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
          <NewThreadForm initialDraft={importedDraft} />
        </div>
      </main>

      <SiteFooter />
    </div>
  )
}
