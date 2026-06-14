import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft, Clock } from "lucide-react"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { getPostsByDate } from "@/lib/archives"
import { formatDate } from "@/lib/blog-posts"

export async function generateStaticParams() {
  const years = []
  const currentYear = new Date().getFullYear()
  for (let year = currentYear; year >= 2020; year--) {
    years.push({ year: year.toString() })
  }
  return years
}

export async function generateMetadata({ params }: { params: Promise<{ year: string }> }) {
  const { year } = await params
  return { title: `${year} — Archives — Hot and Fresh`, description: `Field notes from ${year}.` }
}

export default async function YearPage({ params }: { params: Promise<{ year: string }> }) {
  const { year } = await params
  const yearNum = parseInt(year)
  const posts = await getPostsByDate(yearNum)

  if (posts.length === 0) notFound()

  // Group by month
  const byMonth = new Map<number, typeof posts>()
  posts.forEach((post) => {
    const month = new Date(post.date).getMonth()
    if (!byMonth.has(month)) byMonth.set(month, [])
    byMonth.get(month)!.push(post)
  })

  const months = Array.from({ length: 12 }, (_, i) => i).reverse()

  return (
    <div id="top" className="min-h-screen tactical-grid">
      <SiteHeader />

      <main className="mx-auto max-w-4xl px-4 py-10 md:px-6">
        <Link
          href="/archives"
          className="label-mono mb-8 inline-flex items-center gap-2 text-muted-foreground transition-colors hover:text-primary"
        >
          <ArrowLeft className="h-4 w-4" /> Archives
        </Link>

        <div className="mb-8 flex items-center gap-3">
          <span className="h-2 w-2 bg-primary" />
          <h1 className="stencil text-3xl text-foreground md:text-4xl">{year}</h1>
          <span className="label-mono text-muted-foreground ml-auto">{posts.length} posts</span>
        </div>

        <div className="space-y-10">
          {months.map((month) => {
            const monthPosts = byMonth.get(month)
            if (!monthPosts) return null
            const monthName = new Date(yearNum, month).toLocaleString("en-US", { month: "long" })
            return (
              <section key={month}>
                <h2 className="label-mono mb-4 text-primary">{monthName}</h2>
                <div className="space-y-3">
                  {monthPosts.map((post) => (
                    <Link
                      key={post.slug}
                      href={`/archives/${post.slug}`}
                      className="group flex items-start gap-4 border border-border bg-card p-4 transition-colors hover:border-primary hover:bg-muted/20"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="label-mono mb-1 flex items-center gap-3 text-muted-foreground text-xs">
                          <span>{formatDate(post.date)}</span>
                        </div>
                        <h3 className="stencil text-lg text-foreground transition-colors group-hover:text-primary">
                          {post.title}
                        </h3>
                        <p className="mt-1 text-sm leading-relaxed text-muted-foreground line-clamp-1">
                          {post.excerpt}
                        </p>
                      </div>
                      <div className="label-mono mt-1 flex items-center gap-1 text-muted-foreground text-xs">
                        <Clock className="h-3.5 w-3.5" /> {post.readMinutes} MIN
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            )
          })}
        </div>
      </main>

      <SiteFooter />
    </div>
  )
}
