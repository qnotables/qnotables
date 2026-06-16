import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft, Clock, MapPin, AlertCircle, ExternalLink, Share2 } from "lucide-react"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { Markdown } from "@/components/markdown"
import { SafeEmbed } from "@/components/safe-embed"
import { createAdminClient } from "@/lib/supabase/admin"
import { formatDate } from "@/lib/blog-posts"

export const dynamic = "force-dynamic"

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const supabase = createAdminClient()

  const { data: post } = await supabase
    .from("blog_posts")
    .select("*")
    .eq("slug", slug)
    .eq("status", "published")
    .single()

  if (!post) return { title: "Not found — HOT AND FRESH" }

  return {
    title: `${post.title} — HOT AND FRESH`,
    description: post.excerpt || post.subtitle,
    openGraph: {
      title: post.title,
      description: post.excerpt || post.subtitle,
      images: post.cover_image_url ? [{ url: post.cover_image_url }] : undefined,
      type: "article",
      publishedTime: post.published_at,
      authors: post.author_name ? [post.author_name] : undefined,
    },
  }
}

interface ArchivePost {
  id: string
  slug: string
  title: string
  subtitle: string | null
  excerpt: string
  body: string
  author_name: string
  tag: string
  category: string | null
  post_type: string | null
  read_minutes: number
  featured: boolean
  priority: string | null
  source_url: string | null
  source_name: string | null
  cover_image_url: string | null
  video_url: string | null
  published_at: string
  updated_at: string
  created_at: string
}

export default async function ArchivePostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const supabase = createAdminClient()

  const { data: post, error } = await supabase
    .from("blog_posts")
    .select("*")
    .eq("slug", slug)
    .eq("status", "published")
    .single()

  if (error || !post) {
    notFound()
  }

  const archivePost = post as ArchivePost

  // Get related posts by tag/category
  const { data: relatedPosts } = await supabase
    .from("blog_posts")
    .select("id, slug, title, excerpt, read_minutes, published_at")
    .eq("status", "published")
    .neq("id", archivePost.id)
    .or(`tag.eq.${archivePost.tag},category.eq.${archivePost.category}`)
    .order("published_at", { ascending: false })
    .limit(3)

  return (
    <div id="top" className="min-h-screen tactical-grid">
      <SiteHeader />

      <main className="flex-1">
        {/* Hero with back link */}
        <div className="border-b border-border bg-card">
          <div className="mx-auto max-w-4xl px-4 py-8 md:px-6 md:py-12">
            <Link
              href="/archives"
              className="label-mono mb-6 inline-flex items-center gap-2 text-muted-foreground transition-colors hover:text-primary"
            >
              <ArrowLeft className="h-4 w-4" /> Archives
            </Link>

            <div className="mb-6 flex flex-wrap gap-2">
              {archivePost.priority === "critical" && (
                <span className="label-mono inline-flex items-center gap-1 border border-red-600/50 bg-red-50/10 px-2 py-1 text-xs font-semibold text-red-600">
                  <AlertCircle className="h-3 w-3" /> CRITICAL
                </span>
              )}
              {archivePost.post_type && (
                <span className="label-mono border border-primary bg-primary/10 px-2 py-1 text-xs font-semibold text-primary">
                  {archivePost.post_type}
                </span>
              )}
              {archivePost.category && (
                <span className="label-mono border border-border bg-background px-2 py-1 text-xs font-semibold text-muted-foreground">
                  {archivePost.category}
                </span>
              )}
            </div>

            <h1 className="stencil text-balance text-4xl leading-tight text-foreground md:text-5xl lg:text-6xl">
              {archivePost.title}
            </h1>

            {archivePost.subtitle && (
              <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
                {archivePost.subtitle}
              </p>
            )}

            <div className="label-mono mt-6 flex flex-wrap items-center gap-4 border-t border-border pt-6 text-sm text-muted-foreground">
              {archivePost.author_name && <span className="font-semibold">{archivePost.author_name}</span>}
              <span className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" /> {archivePost.read_minutes} MIN READ
              </span>
              {archivePost.published_at && (
                <span>{formatDate(archivePost.published_at)}</span>
              )}
              {archivePost.source_name && archivePost.source_url && (
                <a
                  href={archivePost.source_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 transition-colors hover:text-primary"
                >
                  {archivePost.source_name}
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Featured media */}
        {(archivePost.cover_image_url || archivePost.video_url) && (
          <div className="border-b border-border bg-muted/20 px-4 py-8 md:px-6">
            <div className="mx-auto max-w-4xl">
              {archivePost.cover_image_url && (
                <img
                  src={archivePost.cover_image_url}
                  alt={archivePost.title}
                  className="w-full border border-border object-cover"
                />
              )}
              {archivePost.video_url && (
                <div className="mt-4">
                  <SafeEmbed url={archivePost.video_url} type="video" title={archivePost.title} />
                </div>
              )}
            </div>
          </div>
        )}

        {/* Main content */}
        <article className="mx-auto max-w-4xl px-4 py-12 md:px-6 md:py-16">
          <div className="prose prose-invert max-w-none">
            <Markdown content={archivePost.body} />
          </div>

          {/* Source info box */}
          {archivePost.source_url && (
            <div className="mt-12 border-l-4 border-primary bg-primary/5 p-4">
              <p className="label-mono text-sm font-semibold text-primary">Source</p>
              <a
                href={archivePost.source_url}
                target="_blank"
                rel="noopener noreferrer"
                className="label-mono mt-2 inline-flex items-center gap-2 text-sm text-foreground hover:text-primary"
              >
                {archivePost.source_url}
                <ExternalLink className="h-4 w-4" />
              </a>
            </div>
          )}

          {/* Share section */}
          <div className="mt-12 border-t border-border pt-8">
            <p className="label-mono mb-4 text-xs font-semibold text-muted-foreground">SHARE THIS RECORD</p>
            <div className="flex gap-2">
              <a
                href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(archivePost.title)}&url=${encodeURIComponent(`https://hotandfresh.news/archives/${archivePost.slug}`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="border border-border bg-background px-3 py-2 transition-colors hover:border-primary hover:text-primary"
              >
                <Share2 className="h-4 w-4" />
              </a>
              <a
                href={`mailto:?subject=${encodeURIComponent(archivePost.title)}&body=${encodeURIComponent(`https://hotandfresh.news/archives/${archivePost.slug}`)}`}
                className="border border-border bg-background px-3 py-2 transition-colors hover:border-primary hover:text-primary"
              >
                Email
              </a>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(`https://hotandfresh.news/archives/${archivePost.slug}`)
                }}
                className="border border-border bg-background px-3 py-2 transition-colors hover:border-primary hover:text-primary"
              >
                Copy Link
              </button>
            </div>
          </div>
        </article>

        {/* Related posts */}
        {relatedPosts && relatedPosts.length > 0 && (
          <section className="border-t border-border bg-muted/20 px-4 py-12 md:px-6 md:py-16">
            <div className="mx-auto max-w-4xl">
              <h2 className="stencil mb-8 text-2xl text-foreground">Related Reading</h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {relatedPosts.map((relatedPost: any) => (
                  <Link
                    key={relatedPost.slug}
                    href={`/archives/${relatedPost.slug}`}
                    className="group border border-border bg-card p-4 transition-colors hover:border-primary hover:bg-muted/30"
                  >
                    <h3 className="stencil line-clamp-2 text-base text-foreground transition-colors group-hover:text-primary">
                      {relatedPost.title}
                    </h3>
                    <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                      {relatedPost.excerpt}
                    </p>
                    <div className="label-mono mt-4 flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" /> {relatedPost.read_minutes} MIN
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}
      </main>

      <SiteFooter />
    </div>
  )
}

