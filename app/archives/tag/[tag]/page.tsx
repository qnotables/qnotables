import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft, Clock } from "lucide-react"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { getPostsByTag } from "@/lib/archives"
import { formatDate } from "@/lib/blog-posts"

export const dynamic = "force-dynamic"

export async function generateMetadata({ params }: { params: Promise<{ tag: string }> }) {
  const { tag } = await params
  return { title: `${tag} — Archives — Hot and Fresh`, description: `Field notes tagged with ${tag}.` }
}

export default async function TagPage({ params }: { params: Promise<{ tag: string }> }) {
  const { tag } = await params
  const posts = await getPostsByTag(decodeURIComponent(tag))

  if (posts.length === 0) notFound()

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
          <h1 className="stencil text-3xl text-foreground md:text-4xl">#{tag}</h1>
          <span className="label-mono text-muted-foreground ml-auto">{posts.length} posts</span>
        </div>

        <div className="space-y-4">
          {posts.map((post) => (
            <Link
              key={post.slug}
              href={`/archives/${post.slug}`}
              className="group flex items-start gap-4 border border-border bg-card p-5 transition-colors hover:border-primary hover:bg-muted/20"
            >
              <div className="min-w-0 flex-1">
                <div className="label-mono mb-2 flex items-center gap-3 text-primary">
                  <span>{post.tag}</span>
                  <span className="text-muted-foreground">{formatDate(post.date)}</span>
                </div>
                <h3 className="stencil text-lg text-foreground transition-colors group-hover:text-primary">
                  {post.title}
                </h3>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground line-clamp-2">
                  {post.excerpt}
                </p>
              </div>
              <div className="label-mono mt-1 flex items-center gap-1 text-muted-foreground">
                <Clock className="h-3.5 w-3.5" /> {post.readMinutes} MIN
              </div>
            </Link>
          ))}
        </div>
      </main>

      <SiteFooter />
    </div>
  )
}
