import Link from "next/link"
import { ArrowLeft, FileText, Calendar } from "lucide-react"
import { SiteHeader } from "@/components/site-header"
import { ArchiveHero } from "@/components/archive-hero"
import { SiteFooter } from "@/components/site-footer"
import { getArchiveDocuments } from "@/lib/archive"
import { getAllArchiveRecords } from "@/lib/archives-utils"
import { getAllPosts } from "@/lib/blog-posts"

export const dynamic = "force-dynamic"

export const metadata = {
  title: "Document Archives — Hot and Fresh",
  description: "Documents, PDFs, and research materials from Hot and Fresh archives",
}

export default async function DocumentsPage() {
  const documents = await getArchiveDocuments()
  const allPosts = await getAllPosts()
  const allRecords = getAllArchiveRecords(allPosts)

  // Calculate stats
  const stats = {
    totalRecords: allRecords.length,
    documents: documents.length,
    featured: allRecords.filter((r) => r.featured).length,
    videos: allRecords.filter((r) => r.media_type === "video").length,
    sources: new Set(allRecords.map((r) => r.source_name).filter(Boolean)).size,
  }

  // Group documents by category or date
  const documentsByMonth = documents.reduce(
    (acc, doc) => {
      const date = new Date(doc.published_at)
      const key = date.toLocaleString("default", { month: "long", year: "numeric" })
      if (!acc[key]) acc[key] = []
      acc[key].push(doc)
      return acc
    },
    {} as Record<string, typeof documents>
  )

  const sortedMonths = Object.keys(documentsByMonth).sort(
    (a, b) => new Date(b).getTime() - new Date(a).getTime()
  )

  return (
    <div className="min-h-screen tactical-grid flex flex-col">
      <SiteHeader />
      <main className="flex-1">
        <ArchiveHero currentPage="documents" />

        <div className="mx-auto max-w-6xl px-4 md:px-6">
          {/* Info section */}
          <div className="mb-12 max-w-3xl">
            <p className="text-muted-foreground mb-4">
              A curated collection of documents, research materials, PDFs, and source materials from Hot and Fresh archives. Browse by date or use search to find specific documents.
            </p>
            <div className="flex flex-wrap gap-2">
              <Link
                href="/archives"
                className="label-mono inline-flex items-center gap-2 px-3 py-2 border border-border bg-background text-sm text-foreground hover:bg-muted/50 rounded transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Archives
              </Link>
            </div>
          </div>

          {documents.length === 0 ? (
            <div className="rounded border border-dashed border-border p-12 text-center">
              <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="label-mono text-muted-foreground">No documents archived yet.</p>
            </div>
          ) : (
            <div className="space-y-12">
              {/* Stats strip */}
              <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                <div className="border border-border bg-card/50 p-3 rounded">
                  <p className="label-mono text-xs text-muted-foreground mb-1">TOTAL DOCUMENTS</p>
                  <p className="text-xl font-bold text-foreground">{stats.documents}</p>
                </div>
                <div className="border border-border bg-card/50 p-3 rounded">
                  <p className="label-mono text-xs text-muted-foreground mb-1">ARCHIVE RECORDS</p>
                  <p className="text-xl font-bold text-foreground">{stats.totalRecords}</p>
                </div>
                <div className="border border-border bg-card/50 p-3 rounded">
                  <p className="label-mono text-xs text-muted-foreground mb-1">SOURCES</p>
                  <p className="text-xl font-bold text-foreground">{stats.sources}</p>
                </div>
                <div className="border border-border bg-card/50 p-3 rounded">
                  <p className="label-mono text-xs text-muted-foreground mb-1">FEATURED</p>
                  <p className="text-xl font-bold text-primary">{stats.featured}</p>
                </div>
              </div>

              {/* Documents grouped by month */}
              {sortedMonths.map((month) => (
                <div key={month}>
                  <div className="mb-4 flex items-center gap-2 pb-3 border-b border-border">
                    <Calendar className="h-4 w-4 text-primary" />
                    <h2 className="label-mono text-sm font-semibold text-foreground">{month.toUpperCase()}</h2>
                    <span className="ml-auto label-mono text-xs text-muted-foreground">{documentsByMonth[month].length} documents</span>
                  </div>

                  <div className="space-y-2">
                    {documentsByMonth[month].map((doc) => (
                      <Link
                        key={doc.id}
                        href={`/archives/${doc.slug}`}
                        className="group flex items-start justify-between gap-4 border border-border rounded p-4 bg-card/30 hover:border-primary hover:bg-card/50 transition-all"
                      >
                        <div className="flex items-start gap-3 flex-1 min-w-0">
                          <FileText className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <h3 className="stencil text-base md:text-lg font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-2">
                              {doc.title}
                            </h3>
                            {doc.excerpt && (
                              <p className="line-clamp-1 mt-1 text-sm text-muted-foreground">{doc.excerpt}</p>
                            )}
                            {doc.source_name && (
                              <div className="flex flex-wrap gap-2 mt-2">
                                <span className="label-mono inline-flex items-center gap-1 text-xs px-2 py-1 border border-border/50 bg-muted/30 rounded text-muted-foreground">
                                  {doc.source_name}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex flex-col items-end gap-2 flex-shrink-0">
                          {doc.published_at && (
                            <p className="label-mono text-xs text-muted-foreground whitespace-nowrap">
                              {new Date(doc.published_at).toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                                year: "2-digit",
                              })}
                            </p>
                          )}
                          {doc.tags && doc.tags.length > 0 && (
                            <div className="flex gap-1 flex-wrap justify-end">
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
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      <SiteFooter />
    </div>
  )
}
