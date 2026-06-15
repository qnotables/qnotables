import Link from "next/link"
import { Calendar, Tag, Folder, Clock, ArrowRight } from "lucide-react"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { getCategories, getTags } from "@/lib/archives"
import { getAllPosts, formatDate } from "@/lib/blog-posts"

export const dynamic = "force-dynamic"

export const metadata = {
  title: "Archives — Hot and Fresh",
  description: "Search and browse field notes by category, tag, and date.",
}

export default async function ArchivesPage() {
  const [categories, tags, posts] = await Promise.all([
    getCategories(),
    getTags(),
    getAllPosts(),
  ])

  // Get years that actually have posts
  const years = Array.from(
    new Set(posts.map((p) => new Date(p.date).getFullYear())),
  ).sort((a, b) => b - a)

  return (
    <div id="top" className="min-h-screen tactical-grid">
      <SiteHeader />

      <main className="mx-auto max-w-5xl px-4 py-10 md:px-6">
        <div className="mb-8 flex items-center gap-3">
          <span className="h-2 w-2 bg-primary" />
          <h1 className="stencil text-3xl text-foreground md:text-4xl">Archives</h1>
          <span className="label-mono hidden text-muted-foreground sm:inline">
            // FIELD NOTES
          </span>
          <span className="ml-auto h-px flex-1 bg-border" />
          <span className="label-mono text-sm text-muted-foreground">{posts.length} DISPATCHES</span>
        </div>

        <div className="grid grid-cols-1 gap-10 lg:grid-cols-[1fr_260px]">
          {/* ── Main post list ── */}
          <section>
            {posts.length === 0 ? (
              <div className="border border-dashed border-border p-12 text-center">
                <p className="label-mono text-muted-foreground">No dispatches filed yet.</p>
              </div>
            ) : (
              <div className="flex flex-col divide-y divide-border">
                {posts.map((post) => (
                  <article key={post.slug} className="group py-6 first:pt-0">
                    <div className="label-mono mb-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      <span className="text-primary">{post.tag}</span>
                      {post.category && (
                        <>
                          <span>•</span>
                          <span>{post.category}</span>
                        </>
                      )}
                      {post.postType && (
                        <>
                          <span>•</span>
                          <span>{post.postType}</span>
                        </>
                      )}
                      <span>•</span>
                      <span>{formatDate(post.date)}</span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" /> {post.readMinutes} MIN
                      </span>
                    </div>

                    <Link href={`/archives/${post.slug}`} className="block">
                      <h2 className="stencil text-xl leading-snug text-foreground transition-colors group-hover:text-primary md:text-2xl">
                        {post.title}
                      </h2>
                      {post.subtitle && (
                        <p className="mt-1 text-base leading-relaxed text-muted-foreground">
                          {post.subtitle}
                        </p>
                      )}
                      {post.excerpt && !post.subtitle && (
                        <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
                          {post.excerpt}
                        </p>
                      )}
                    </Link>

                    <div className="mt-3 flex items-center gap-3">
                      <span className="label-mono text-xs text-muted-foreground">
                        {post.author}
                      </span>
                      {post.featured && (
                        <span className="label-mono rounded border border-primary/40 bg-primary/10 px-1.5 py-0.5 text-xs text-primary">
                          FEATURED
                        </span>
                      )}
                      <Link
                        href={`/archives/${post.slug}`}
                        className="label-mono ml-auto flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-primary"
                      >
                        READ <ArrowRight className="h-3 w-3" />
                      </Link>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>

          {/* ── Sidebar browser ── */}
          <aside className="flex flex-col gap-8">
            {/* Categories */}
            {categories.length > 0 && (
              <div>
                <div className="mb-3 flex items-center gap-2 border-b border-border pb-2">
                  <Folder className="h-4 w-4 text-primary" />
                  <h2 className="label-mono text-xs font-semibold text-primary">CATEGORIES</h2>
                </div>
                <div className="flex flex-col gap-1">
                  {categories.map((cat) => (
                    <Link
                      key={cat}
                      href={`/archives/category/${encodeURIComponent(cat)}`}
                      className="label-mono border-l-2 border-transparent px-3 py-1 text-sm text-muted-foreground transition-all hover:border-primary hover:text-foreground"
                    >
                      {cat}
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Tags */}
            {tags.length > 0 && (
              <div>
                <div className="mb-3 flex items-center gap-2 border-b border-border pb-2">
                  <Tag className="h-4 w-4 text-primary" />
                  <h2 className="label-mono text-xs font-semibold text-primary">TAGS</h2>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {tags.slice(0, 24).map((tag) => (
                    <Link
                      key={tag}
                      href={`/archives/tag/${encodeURIComponent(tag)}`}
                      className="label-mono border border-border bg-card px-2 py-0.5 text-xs transition-all hover:border-primary hover:text-primary"
                    >
                      #{tag}
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Years */}
            {years.length > 0 && (
              <div>
                <div className="mb-3 flex items-center gap-2 border-b border-border pb-2">
                  <Calendar className="h-4 w-4 text-primary" />
                  <h2 className="label-mono text-xs font-semibold text-primary">BY YEAR</h2>
                </div>
                <div className="flex flex-col gap-1">
                  {years.map((year) => (
                    <Link
                      key={year}
                      href={`/archives/year/${year}`}
                      className="label-mono border-l-2 border-transparent px-3 py-1 text-sm text-muted-foreground transition-all hover:border-primary hover:text-foreground"
                    >
                      {year}
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* All tags fallback when no DB data */}
            {tags.length === 0 && categories.length === 0 && years.length === 0 && posts.length > 0 && (
              <div>
                <div className="mb-3 flex items-center gap-2 border-b border-border pb-2">
                  <Tag className="h-4 w-4 text-primary" />
                  <h2 className="label-mono text-xs font-semibold text-primary">DESKS</h2>
                </div>
                <div className="flex flex-col gap-1">
                  {Array.from(new Set(posts.map((p) => p.tag))).sort().map((desk) => (
                    <span key={desk} className="label-mono px-3 py-1 text-sm text-muted-foreground">
                      {desk}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </aside>
        </div>
      </main>

      <SiteFooter />
    </div>
  )
}
