import Link from "next/link"
import { Calendar } from "lucide-react"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { getAllArchives, formatDate } from "@/lib/archive"

export const dynamic = "force-dynamic"

export const metadata = {
  title: "Timeline — Hot and Fresh",
  description: "Archives organized chronologically by timeline date",
}

export default async function TimelinePage() {
  const allPosts = await getAllArchives()

  // Filter and sort by timeline_date
  const timelinePosts = allPosts
    .filter(p => p.timeline_date)
    .sort((a, b) => new Date(b.timeline_date || "").getTime() - new Date(a.timeline_date || "").getTime())

  // Group by year and month
  const grouped: Record<string, Record<string, typeof timelinePosts>> = {}
  timelinePosts.forEach(post => {
    if (!post.timeline_date) return
    const date = new Date(post.timeline_date)
    const year = date.getFullYear().toString()
    const month = date.toLocaleString("en-US", { month: "long" })
    const key = `${month} ${year}`

    if (!grouped[year]) grouped[year] = {}
    if (!grouped[year][key]) grouped[year][key] = []
    grouped[year][key].push(post)
  })

  const years = Object.keys(grouped).sort((a, b) => parseInt(b) - parseInt(a))

  return (
    <div className="min-h-screen tactical-grid flex flex-col">
      <SiteHeader />

      <main className="flex-1 mx-auto max-w-4xl px-4 py-10 md:px-6">
        <div className="mb-8 flex items-center gap-3">
          <span className="h-2 w-2 bg-primary" />
          <h1 className="stencil text-3xl text-foreground md:text-4xl">Timeline</h1>
          <span className="ml-auto h-px flex-1 bg-border" />
          <span className="label-mono text-sm text-muted-foreground">{timelinePosts.length} EVENTS</span>
        </div>

        {timelinePosts.length === 0 ? (
          <div className="border border-dashed border-border p-12 text-center">
            <p className="label-mono text-muted-foreground">No timeline events recorded yet.</p>
          </div>
        ) : (
          <div className="space-y-12">
            {years.map(year => (
              <div key={year}>
                <h2 className="stencil mb-6 text-2xl text-foreground">{year}</h2>
                <div className="space-y-8">
                  {Object.entries(grouped[year])
                    .sort((a, b) => new Date(b[1][0].timeline_date || "").getTime() - new Date(a[1][0].timeline_date || "").getTime())
                    .map(([monthKey, posts]) => (
                      <div key={monthKey}>
                        <div className="mb-4 flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-primary" />
                          <h3 className="label-mono text-sm font-semibold text-muted-foreground">{monthKey}</h3>
                        </div>
                        <div className="ml-6 space-y-4 border-l-2 border-border pl-6">
                          {posts.map(post => (
                            <Link
                              key={post.id}
                              href={`/archives/${post.slug}`}
                              className="group relative block pt-2 transition-colors hover:text-primary"
                            >
                              <div className="absolute -left-5 top-2 h-3 w-3 rounded-full border-2 border-border bg-background group-hover:border-primary" />
                              <div className="mb-2 flex flex-wrap items-center gap-2">
                                {post.timeline_date && (
                                  <span className="label-mono text-xs text-muted-foreground">
                                    {new Date(post.timeline_date).toLocaleDateString("en-US", {
                                      month: "short",
                                      day: "numeric",
                                    })}
                                  </span>
                                )}
                                {post.post_type && (
                                  <span className="label-mono inline-block border border-primary/30 bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
                                    {post.post_type}
                                  </span>
                                )}
                              </div>
                              <h4 className="font-semibold text-foreground group-hover:text-primary">{post.title}</h4>
                              {post.excerpt && (
                                <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{post.excerpt}</p>
                              )}
                            </Link>
                          ))}
                        </div>
                      </div>
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
