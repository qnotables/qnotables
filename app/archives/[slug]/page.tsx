import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft, AlertCircle, ExternalLink, FileText, Calendar, Clock, User } from "lucide-react"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { Markdown } from "@/components/markdown"
import { SafeEmbed } from "@/components/safe-embed"
import { getArchiveBySlug, getAllArchives, formatDate } from "@/lib/archive"
import { getAllPosts, getPost, formatDate as formatBlogDate } from "@/lib/blog-posts"
import { ShareButtons } from "@/components/share-buttons"
import { getSiteUrl } from "@/lib/rss-utils"

export const dynamic = "force-dynamic"

/**
 * Normalised shape used by this page — covers both ArchivePost (DB) and BlogPost (MDX).
 */
interface PagePost {
  slug: string
  title: string
  subtitle?: string
  excerpt?: string
  body: string
  author?: string
  published_at?: string
  updated_at?: string
  cover_image_url?: string
  video_url?: string
  embed_url?: string
  iframe_url?: string
  document_url?: string
  source_name?: string
  source_url?: string
  category?: string
  post_type?: string
  priority?: string
  tags?: string[]
  related_links?: { title: string; url: string }[]
  timeline_date?: string
  readMinutes?: number
  source: "db" | "mdx"
}

async function resolvePost(slug: string): Promise<PagePost | null> {
  // Try DB (ArchivePost) first
  try {
    const dbPost = await getArchiveBySlug(slug)
    if (dbPost) {
      return {
        slug: dbPost.slug,
        title: dbPost.title,
        subtitle: dbPost.subtitle,
        excerpt: dbPost.excerpt,
        body: dbPost.body,
        author: dbPost.source_author,
        published_at: dbPost.published_at,
        updated_at: dbPost.updated_at,
        cover_image_url: dbPost.cover_image_url,
        video_url: dbPost.video_url,
        embed_url: dbPost.embed_url,
        iframe_url: dbPost.iframe_url,
        document_url: dbPost.document_url,
        source_name: dbPost.source_name,
        source_url: dbPost.source_url,
        category: dbPost.category,
        post_type: dbPost.post_type,
        priority: dbPost.priority,
        tags: dbPost.tags,
        related_links: dbPost.related_links,
        timeline_date: dbPost.timeline_date,
        source: "db",
      }
    }
  } catch {
    // DB lookup failed — fall through to MDX
  }

  // Fall back to MDX / merged posts
  const mdxPost = await getPost(slug)
  if (!mdxPost) return null

  return {
    slug: mdxPost.slug,
    title: mdxPost.title,
    subtitle: mdxPost.subtitle,
    excerpt: mdxPost.excerpt,
    body: mdxPost.content,
    author: mdxPost.author,
    published_at: mdxPost.publishedAt || mdxPost.date,
    updated_at: mdxPost.updatedAt,
    cover_image_url: mdxPost.coverImage ?? undefined,
    source_name: mdxPost.sourceName,
    source_url: mdxPost.sourceUrl,
    category: mdxPost.category,
    post_type: mdxPost.postType,
    priority: mdxPost.priority,
    tags: mdxPost.tags ?? (mdxPost.tag ? [mdxPost.tag] : []),
    readMinutes: mdxPost.readMinutes,
    source: "mdx",
  }
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const post = await resolvePost(slug)

  if (!post) return { title: "Not found — HOT AND FRESH" }

  const site = getSiteUrl()
  const canonical = `${site}/archives/${post.slug}`
  const description = post.excerpt || post.subtitle || "Archived HOT AND FRESH record."

  return {
    title: `${post.title} — HOT AND FRESH`,
    description,
    alternates: { canonical },
    openGraph: {
      title: post.title,
      description,
      url: canonical,
      images: post.cover_image_url ? [{ url: post.cover_image_url }] : undefined,
      type: "article",
      publishedTime: post.published_at,
      modifiedTime: post.updated_at,
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description,
      images: post.cover_image_url ? [post.cover_image_url] : undefined,
    },
  }
}

export async function generateStaticParams() {
  try {
    const [dbArchives, allPosts] = await Promise.all([
      getAllArchives().catch(() => []),
      getAllPosts().catch(() => []),
    ])
    const slugs = new Set<string>([
      ...dbArchives.map((p) => p.slug),
      ...allPosts.map((p) => p.slug),
    ])
    return Array.from(slugs).slice(0, 200).map((slug) => ({ slug }))
  } catch {
    return []
  }
}

export default async function ArchiveDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const post = await resolvePost(slug)

  if (!post) notFound()

  // Related posts — use merged pool so MDX posts also appear
  const allPosts = await getAllPosts().catch(() => [])
  const relatedPosts = allPosts
    .filter(
      (p) =>
        p.slug !== post.slug &&
        ((post.tags?.length && p.tags?.some((t) => post.tags!.includes(t))) ||
          (post.category && p.category === post.category))
    )
    .slice(0, 3)

  const site = getSiteUrl()

  return (
    <div id="top" className="min-h-screen tactical-grid">
      <SiteHeader />

      <main className="flex-1">
        {/* Hero section */}
        <div className="border-b border-border bg-card">
          <div className="mx-auto max-w-4xl px-4 py-8 md:px-6 md:py-12">
            <Link
              href="/archives"
              className="label-mono mb-6 inline-flex items-center gap-2 text-muted-foreground transition-colors hover:text-primary"
            >
              <ArrowLeft className="h-4 w-4" /> Archives
            </Link>

            {/* Badges */}
            <div className="mb-6 flex flex-wrap gap-2">
              {post.priority === "critical" && (
                <span className="label-mono inline-flex items-center gap-1 border border-red-600/50 bg-red-50/10 px-2 py-1 text-xs font-semibold text-red-600">
                  <AlertCircle className="h-3 w-3" /> CRITICAL
                </span>
              )}
              {post.post_type && (
                <span className="label-mono border border-primary bg-primary/10 px-2 py-1 text-xs font-semibold text-primary">
                  {post.post_type}
                </span>
              )}
              {post.category && (
                <span className="label-mono border border-border bg-background px-2 py-1 text-xs font-semibold text-muted-foreground">
                  {post.category}
                </span>
              )}
              {post.source === "mdx" && (
                <span className="label-mono border border-border bg-background px-2 py-1 text-xs font-semibold text-muted-foreground">
                  Editorial
                </span>
              )}
            </div>

            <h1 className="stencil text-balance text-4xl leading-tight text-foreground md:text-5xl lg:text-6xl">
              {post.title}
            </h1>

            {post.subtitle && (
              <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
                {post.subtitle}
              </p>
            )}

            {/* Meta row */}
            <div className="label-mono mt-6 flex flex-wrap items-center gap-4 border-t border-border pt-6 text-sm text-muted-foreground">
              {post.published_at && (
                <span className="flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" />
                  {formatDate(new Date(post.published_at))}
                </span>
              )}
              {post.readMinutes && (
                <span className="flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" />
                  {post.readMinutes} min read
                </span>
              )}
              {post.author && (
                <span className="flex items-center gap-1">
                  <User className="h-3.5 w-3.5" />
                  {post.author}
                </span>
              )}
              {post.timeline_date && (
                <span className="flex items-center gap-1 text-xs">
                  Timeline: {formatDate(new Date(post.timeline_date))}
                </span>
              )}
              {post.source_name && post.source_url && (
                <a
                  href={post.source_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 transition-colors hover:text-primary"
                >
                  {post.source_name}
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              )}
              {post.tags && post.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {post.tags.map((tag) => (
                    <Link
                      key={tag}
                      href={`/archives/tag/${encodeURIComponent(tag)}`}
                      className="text-xs text-primary hover:underline underline-offset-4"
                    >
                      #{tag}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Featured media */}
        {(post.cover_image_url || post.video_url || post.embed_url || post.iframe_url) && (
          <div className="border-b border-border bg-muted/20 px-4 py-8 md:px-6">
            <div className="mx-auto max-w-4xl space-y-4">
              {post.cover_image_url && (
                <img
                  src={post.cover_image_url}
                  alt={post.title}
                  className="w-full border border-border object-top object-cover"
                />
              )}
              {post.video_url && (
                <video
                  src={post.video_url}
                  controls
                  playsInline
                  preload="metadata"
                  className="w-full border border-border"
                />
              )}
              {post.embed_url && (
                <SafeEmbed url={post.embed_url} type="iframe" title={post.title} />
              )}
              {post.iframe_url && (
                <SafeEmbed iframeCode={post.iframe_url} type="iframe" title={post.title} />
              )}
            </div>
          </div>
        )}

        {/* Main content */}
        <article className="mx-auto max-w-4xl px-4 py-12 md:px-6 md:py-16">
          <div className="prose prose-invert max-w-none">
            <Markdown content={post.body} />
          </div>

          {/* Document link */}
          {post.document_url && (
            <div className="mt-12 border-l-4 border-primary bg-primary/5 p-4">
              <p className="label-mono text-sm font-semibold text-primary">Document</p>
              <a
                href={post.document_url}
                target="_blank"
                rel="noopener noreferrer"
                className="label-mono mt-2 inline-flex items-center gap-2 text-sm text-foreground hover:text-primary"
              >
                <FileText className="h-4 w-4" />
                Download or view document
                <ExternalLink className="h-4 w-4" />
              </a>
            </div>
          )}

          {/* Related links */}
          {post.related_links && post.related_links.length > 0 && (
            <div className="mt-12 border-t border-border pt-8">
              <p className="label-mono mb-4 text-xs font-semibold text-muted-foreground">RELATED LINKS</p>
              <div className="space-y-2">
                {post.related_links.map((link, idx) => (
                  <a
                    key={idx}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer nofollow"
                    className="block text-primary underline-offset-4 hover:underline"
                  >
                    {link.title}
                    <ExternalLink className="ml-1 inline h-3 w-3" />
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Share section */}
          <div className="mt-12 border-t border-border pt-8">
            <p className="label-mono mb-4 text-xs font-semibold text-muted-foreground">SHARE THIS RECORD</p>
            <ShareButtons
              title={post.title}
              url={`${site}/archives/${post.slug}`}
              excerpt={post.excerpt || post.subtitle}
              hashtags={post.tags}
            />
          </div>
        </article>

        {/* Related posts */}
        {relatedPosts.length > 0 && (
          <section className="border-t border-border bg-muted/20 px-4 py-12 md:px-6 md:py-16">
            <div className="mx-auto max-w-4xl">
              <h2 className="stencil mb-8 text-2xl text-foreground">Related Records</h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {relatedPosts.map((relatedPost) => (
                  <Link
                    key={relatedPost.slug}
                    href={`/archives/${relatedPost.slug}`}
                    className="group border border-border bg-card p-4 transition-colors hover:border-primary hover:bg-muted/30"
                  >
                    {relatedPost.coverImage && (
                      <img
                        src={relatedPost.coverImage}
                        alt={relatedPost.title}
                        className="mb-3 h-32 w-full object-cover object-top"
                      />
                    )}
                    <h3 className="stencil line-clamp-2 text-base text-foreground transition-colors group-hover:text-primary">
                      {relatedPost.title}
                    </h3>
                    <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                      {relatedPost.excerpt}
                    </p>
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


