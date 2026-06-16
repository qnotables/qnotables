import Link from "next/link"
import { ArrowLeft, FileText } from "lucide-react"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { getArchiveDocuments, formatDate } from "@/lib/archive"

export const dynamic = "force-dynamic"

export const metadata = {
  title: "Document Archives — Hot and Fresh",
  description: "Documents, PDFs, and research materials from Hot and Fresh",
}

export default async function DocumentsPage() {
  const documents = await getArchiveDocuments()

  return (
    <div className="min-h-screen tactical-grid flex flex-col">
      <SiteHeader />

      <main className="flex-1 mx-auto max-w-4xl px-4 py-10 md:px-6">
        <div className="mb-8 flex items-center gap-3">
          <Link href="/archives" className="text-primary hover:underline">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <span className="h-2 w-2 bg-primary" />
          <h1 className="stencil text-3xl text-foreground md:text-4xl">Document Archives</h1>
          <span className="ml-auto h-px flex-1 bg-border" />
          <span className="label-mono text-sm text-muted-foreground">{documents.length} DOCUMENTS</span>
        </div>

        {documents.length === 0 ? (
          <div className="border border-dashed border-border p-12 text-center">
            <p className="label-mono text-muted-foreground">No documents archived yet.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {documents.map(doc => (
              <Link
                key={doc.id}
                href={`/archives/${doc.slug}`}
                className="flex items-center justify-between border border-border bg-muted/30 p-4 transition-colors hover:border-primary hover:bg-muted/50"
              >
                <div className="flex items-start gap-3 flex-1">
                  <FileText className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-foreground">{doc.title}</h3>
                    {doc.excerpt && <p className="line-clamp-1 mt-1 text-sm text-muted-foreground">{doc.excerpt}</p>}
                  </div>
                </div>
                {doc.published_at && (
                  <p className="label-mono ml-4 text-xs text-muted-foreground whitespace-nowrap">
                    {formatDate(new Date(doc.published_at))}
                  </p>
                )}
              </Link>
            ))}
          </div>
        )}
      </main>

      <SiteFooter />
    </div>
  )
}
