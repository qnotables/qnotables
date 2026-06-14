import Link from "next/link"
import { Calendar, Tag, Folder } from "lucide-react"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { getCategories, getTags, getPostsByDate } from "@/lib/archives"
import { formatDate } from "@/lib/blog-posts"

export const dynamic = "force-dynamic"

export const metadata = {
  title: "Archives — Hot and Fresh",
  description: "Search and browse field notes by category, tag, and date.",
}

export default async function ArchivesPage() {
  const categories = await getCategories()
  const tags = await getTags()

  // Get years with posts
  const currentYear = new Date().getFullYear()
  const years: number[] = []
  for (let year = currentYear; year >= 2020; year--) {
    const posts = await getPostsByDate(year)
    if (posts.length > 0) years.push(year)
  }

  return (
    <div id="top" className="min-h-screen tactical-grid">
      <SiteHeader />

      <main className="mx-auto max-w-5xl px-4 py-10 md:px-6">
        <div className="mb-8 flex items-center gap-3">
          <span className="h-2 w-2 bg-primary" />
          <h1 className="stencil text-3xl text-foreground md:text-4xl">Archives</h1>
          <span className="label-mono hidden text-muted-foreground sm:inline">
            // SEARCH & BROWSE
          </span>
          <span className="ml-auto h-px flex-1 bg-border" />
        </div>

        {/* Categories */}
        {categories.length > 0 && (
          <section className="mb-12">
            <div className="mb-4 flex items-center gap-2">
              <Folder className="h-5 w-5 text-primary" />
              <h2 className="label-mono text-sm font-semibold text-primary">CATEGORIES</h2>
            </div>
            <div className="flex flex-wrap gap-3">
              {categories.map((cat) => (
                <Link
                  key={cat}
                  href={`/archives/category/${encodeURIComponent(cat)}`}
                  className="label-mono border border-border bg-card px-4 py-2 text-sm transition-all hover:border-primary hover:text-primary"
                >
                  {cat}
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Tags */}
        {tags.length > 0 && (
          <section className="mb-12">
            <div className="mb-4 flex items-center gap-2">
              <Tag className="h-5 w-5 text-primary" />
              <h2 className="label-mono text-sm font-semibold text-primary">TAGS</h2>
            </div>
            <div className="flex flex-wrap gap-2">
              {tags.slice(0, 20).map((tag) => (
                <Link
                  key={tag}
                  href={`/archives/tag/${encodeURIComponent(tag)}`}
                  className="label-mono border border-border bg-card px-3 py-1 text-xs transition-all hover:border-primary hover:text-primary"
                >
                  #{tag}
                </Link>
              ))}
              {tags.length > 20 && (
                <span className="label-mono text-xs text-muted-foreground px-3 py-1">
                  +{tags.length - 20} more
                </span>
              )}
            </div>
          </section>
        )}

        {/* Years */}
        {years.length > 0 && (
          <section>
            <div className="mb-4 flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              <h2 className="label-mono text-sm font-semibold text-primary">BY YEAR</h2>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
              {years.map((year) => (
                <Link
                  key={year}
                  href={`/archives/year/${year}`}
                  className="label-mono border border-border bg-card px-4 py-3 text-center transition-all hover:border-primary hover:text-primary"
                >
                  {year}
                </Link>
              ))}
            </div>
          </section>
        )}
      </main>

      <SiteFooter />
    </div>
  )
}
