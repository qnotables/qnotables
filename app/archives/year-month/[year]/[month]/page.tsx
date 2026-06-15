import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft, Clock } from "lucide-react"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { getPostsByDate } from "@/lib/archives"
import { formatDate } from "@/lib/blog-posts"

export const dynamic = "force-dynamic"

export async function generateMetadata({ params }: { params: Promise<{ year: string; month: string }> }) {
  const { year, month } = await params
  const monthNum = parseInt(month)
  const yearNum = parseInt(year)
  const monthName = new Date(yearNum, monthNum - 1).toLocaleString("default", { month: "long" })
  return {
    title: `${monthName} ${year} — HOT AND FRESH`,
  }
}

export default async function MonthlyArchivePage({
  params,
}: {
  params: Promise<{ year: string; month: string }>
}) {
  const { year, month } = await params
  const yearNum = parseInt(year)
  const monthNum = parseInt(month)

  if (isNaN(yearNum) || isNaN(monthNum) || monthNum < 1 || monthNum > 12) {
    notFound()
  }

  const posts = await getPostsByDate(yearNum, monthNum)
  if (posts.length === 0) {
    notFound()
  }

  const monthName = new Date(yearNum, monthNum - 1).toLocaleString("default", { month: "long" })

  return (
    <div id="top" className="min-h-screen tactical-grid">
      <SiteHeader />

      <main className="mx-auto max-w-4xl px-4 py-10 md:px-6">
        <div className="mb-8 flex flex-wrap items-center gap-3">
          <Link
            href="/archives"
            className="label-mono inline-flex items-center gap-2 text-muted-foreground transition-colors hover:text-primary"
          >
            <ArrowLeft className="h-4 w-4" /> Archives
          </Link>
          <span className="h-4 w-px bg-border" />
          <span className="h-2 w-2 bg-primary" />
          <h1 className="stencil text-2xl md:text-3xl text-foreground">
            {monthName} {year}
          </h1>
        </div>

        <div className="space-y-6">
          {posts.map((post) => (
            <article
              key={post.slug}
              className="corner-frame border border-border bg-card p-4 hover:bg-muted/50 transition-colors"
            >
              <Link href={`/archives/${post.slug}`} className="block group">
                <h2 className="stencil text-xl md:text-2xl text-foreground group-hover:text-primary transition-colors">
                  {post.title}
                </h2>
              </Link>

              <p className="mt-2 text-muted-foreground line-clamp-2">{post.excerpt}</p>

              <div className="mt-4 flex flex-wrap items-center gap-4 text-sm">
                <span className="label-mono text-primary">{post.tag}</span>
                {post.category && (
                  <span className="label-mono text-muted-foreground">{post.category}</span>
                )}
                <p className="label-mono flex items-center gap-1.5 text-muted-foreground ml-auto">
                  <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                  {formatDate(post.date)}
                </p>
              </div>

              <Link
                href={`/archives/${post.slug}`}
                className="label-mono mt-3 inline-block text-primary hover:underline text-sm font-medium"
              >
                Read More →
              </Link>
            </article>
          ))}
        </div>
      </main>

      <SiteFooter />
    </div>
  )
}
