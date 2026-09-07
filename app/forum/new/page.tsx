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
  publishedAt?: string
}

const IMPORT_TITLE_MAX = 140
const IMPORT_BODY_MAX = 20_000
const IMPORT_SOURCE_MAX = 2_048

function sanitizeImportedText(value: string | undefined, maxLength: number) {
  if (!value) return undefined
  return value
    .replace(/[<>]/g, "")
    .replace(/[\u0000-\u001F\u007F]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength) || undefined
}

function sanitizeImportedBody(value: string | undefined, publishedAt: string | undefined) {
  const body = value
    ?.replace(/[<>]/g, "")
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, " ")
    .trim()
    .slice(0, IMPORT_BODY_MAX)
  const postedAt = sanitizeImportedText(publishedAt, 80)
  if (!body && !postedAt) return undefined
  return [body, postedAt ? `Originally posted: ${postedAt}` : ""].filter(Boolean).join("\n\n")
}

function validateImportedUrl(value: string | undefined) {
  if (!value) return undefined
  try {
    const url = new URL(value)
    if (!/^https?:$/i.test(url.protocol)) return undefined
    return url.toString().slice(0, IMPORT_SOURCE_MAX)
  } catch {
    return undefined
  }
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
  const isImported = value("import") === "1"
  const importedDraft: ImportedDraft | undefined = isImported
    ? {
        title: sanitizeImportedText(value("title"), IMPORT_TITLE_MAX),
        content: sanitizeImportedBody(value("body"), value("postedAt")),
        sourceUrl: validateImportedUrl(value("sourceUrl")),
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
          <NewThreadForm initialDraft={importedDraft} imported={isImported} />
        </div>
      </main>

      <SiteFooter />
    </div>
  )
}
