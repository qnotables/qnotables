import Link from "next/link"
import { ArrowLeft, FileText } from "lucide-react"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { getAllPosts } from "@/lib/blog-posts"
import { transformBlogPostToArchive, getAllArchiveRecords } from "@/lib/archives-utils"

export const dynamic = "force-dynamic"

export const metadata = {
  title: "Document Archives — Hot and Fresh",
  description: "Documents, PDFs, and research materials from Hot and Fresh archives",
}

export default async function DocumentsPage() {
  const allPosts = await getAllPosts()
  const allRecords = getAllArchiveRecords(allPosts)
  
  // Filter for documents (Document Drop, Public Record, Source Archive post types)
  const documentRecords = allRecords.filter(
    (record) =>
      record.post_type === "Document Drop" ||
      record.post_type === "Public Record" ||
      record.post_type === "Source Archive"
  )

  // Group documents by month
  const documentsByMonth: Record<string, typeof documentRecords> = {}
  documentRecords.forEach((doc) => {
    const date = new Date(doc.published_at)
    const key = date.toLocaleString("default", { month: "long", year: "numeric" })
    if (!documentsByMonth[key]) {
      documentsByMonth[key] = []
    }
    documentsByMonth[key].push(doc)
  })

  const sortedMonths = Object.keys(documentsByMonth).sort(
    (a, b) => new Date(b).getTime() - new Date(a).getTime()
  )

  return (
    <div className="min-h-screen tactical-grid flex flex-col">
      <SiteHeader />
      <main className="flex-1 mx-auto max-w-5xl px-4 py-10 md:px-6">
        <div className="mb-8 flex items-center gap-3">
          <Link href="/archives" className="text-primary hover:underline">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <span className="h-2 w-2 bg-primary" />
          <h1 className="stencil text-3xl text-foreground md:text-4xl">Document Archives</h1>
          <span className="ml-auto h-px flex-1 bg-border" />
          <span className="label-mono text-sm text-muted-foreground">{documentRecords.length} DOCUMENTS</span>
        </div>

        {documentRecords.length === 0 ? (
          <div className="border border-dashed border-border p-12 text-center">
            <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <p className="label-mono text-muted-foreground">No documents archived yet.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Documents grouped by month */}
            {sortedMonths.map((month) => (
              <div key={month}>
                <div className="mb-4 flex items-center gap-2 pb-3 border-b border-border">
                  <FileText className="h-4 w-4 text-primary" />
                  <h2 className="label-mono text-sm font-semibold text-foreground">{month.toUpperCase()}</h2>
                  <span className="ml-auto label-mono text-xs text-muted-foreground">{documentsByMonth[month].length} documents</span>
                </div>

                <div className="space-y-3">
                  {documentsByMonth[month].map((doc) => (
                    <Link
                      key={doc.id}
                      href={`/archives/${doc.slug}`}
                      className="group block border border-border bg-muted/20 p-4 rounded hover:border-primary hover:bg-muted/40 transition-all"
                    >
                      <div className="flex items-start gap-3">
                        <FileText className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-2">
                            {doc.title}
                          </h3>
                          {doc.excerpt && (
                            <p className="line-clamp-1 mt-1 text-sm text-muted-foreground">{doc.excerpt}</p>
                          )}
                          <div className="flex flex-wrap gap-2 mt-2 items-center">
                            {doc.source_name && (
                              <span className="label-mono text-xs px-2 py-1 border border-border/50 bg-muted/30 rounded text-muted-foreground">
                                {doc.source_name}
                              </span>
                            )}
                            {doc.published_at && (
                              <span className="label-mono text-xs text-muted-foreground">
                                {new Date(doc.published_at).toLocaleDateString("en-US", {
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric",
                                })}
                              </span>
                            )}
                            {doc.tags && doc.tags.length > 0 && (
                              <div className="flex gap-1 flex-wrap">
                                {doc.tags.slice(0, 2).map((tag) => (
                                  <Link
                                    key={tag}
                                    href={`/archives/tag/${encodeURIComponent(tag)}`}
                                    onClick={(e) => e.stopPropagation()}
                                    className="label-mono text-xs px-1.5 py-0.5 border border-border/50 text-muted-foreground hover:text-foreground hover:border-foreground rounded transition-colors"
                                  >
                                    #{tag}
                                  </Link>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <SiteFooter />
    </div>
  )
}
