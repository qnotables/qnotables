import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft, Clock } from "lucide-react"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { Markdown } from "@/components/markdown"
import { getPost, formatDate } from "@/lib/blog-posts"
import { getRelatedPosts } from "@/lib/archives"

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const post = await getPost(slug)
  if (!post) return { title: "Not found — Hot and Fresh" }
  return {
    title: `${post.title} — Hot and Fresh`,
    description: post.subtitle || post.excerpt,
    openGraph: {
      title: post.title,
      description: post.subtitle || post.excerpt,
      images: post.coverImage ? [{ url: post.coverImage }] : undefined,
    },
  }
}

export default async function ArchivePostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const post = await getPost(slug)
  if (!post) notFound()

  const relatedPosts = post.id ? await getRelatedPosts(post.id) : []

  return (
    <div id="top" className="min-h-screen tactical-grid">
      <SiteHeader />

      <main className="mx-auto max-w-3xl px-4 py-10 md:px-6">
        <Link
          href="/archives"
          className="label-mono mb-8 inline-flex items-center gap-2 text-muted-foreground transition-colors hover:text-primary"
        >
          <ArrowLeft className="h-4 w-4" /> Archives
        </Link>

        <div className="label-mono mb-4 flex items-center gap-3 text-primary">
          <span>{post.tag}</span>
          {post.category && <span className="text-muted-foreground">•</span>}
          {post.category && <span className="text-muted-foreground">{post.category}</span>}
          <span className="text-muted-foreground">•</span>
          <span className="text-muted-foreground">{formatDate(post.date)}</span>
        </div>

        <h1 className="stencil text-balance text-3xl leading-tight text-foreground md:text-5xl">
          {post.title}
        </h1>

        {post.subtitle && (
          <p className="mt-3 text-lg leading-relaxed text-muted-foreground">{post.subtitle}</p>
        )}

        <div className="label-mono mt-6 flex items-center gap-4 border-b border-border pb-6 text-muted-foreground">
          <span>{post.author}</span>
          <span className="flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" /> {post.readMinutes} MIN READ
          </span>
        </div>

        {post.coverImage && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={post.coverImage}
            alt={post.title}
            className="mt-8 w-full border border-border object-cover"
          />
        )}

        <article className="mt-8">
          <Markdown content={post.content} />
        </article>

        {/* Related posts */}
        {relatedPosts.length > 0 && (
          <section className="mt-12 border-t border-border pt-8">
            <h2 className="stencil mb-6 text-xl text-foreground">Related Reading</h2>
            <div className="space-y-4">
              {relatedPosts.map((relatedPost) => (
                <Link
                  key={relatedPost.slug}
                  href={`/archives/${relatedPost.slug}`}
                  className="group flex items-start gap-4 border border-border bg-card p-4 transition-colors hover:border-primary hover:bg-muted/20"
                >
                  <div className="min-w-0 flex-1">
                    <h3 className="stencil text-lg text-foreground transition-colors group-hover:text-primary">
                      {relatedPost.title}
                    </h3>
                    <p className="mt-1 text-sm leading-relaxed text-muted-foreground line-clamp-2">
                      {relatedPost.excerpt}
                    </p>
                  </div>
                  <div className="label-mono mt-1 flex items-center gap-1 text-muted-foreground">
                    <Clock className="h-3.5 w-3.5" /> {relatedPost.readMinutes} MIN
                  </div>
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
