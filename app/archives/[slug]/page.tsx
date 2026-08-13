import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft, AlertCircle, ExternalLink, FileText, Calendar } from "lucide-react"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { Markdown } from "@/components/markdown"
import { TiptapRenderer } from "@/components/tiptap-renderer"
import { isTiptapJson } from "@/lib/tiptap-utils"
import { SafeEmbed } from "@/components/safe-embed"
import { getArchiveBySlug, getAllArchives, formatDate } from "@/lib/archive"
import { getPublishedVideoById, getPublishedVideos } from "@/app/actions/video-actions"
import { ShareButtons } from "@/components/share-buttons"
import { getSiteUrl } from "@/lib/rss-utils"
import { resolveFirstPostMedia, resolveSocialImage } from "@/lib/post-media"
import { PostFeaturedMedia } from "@/components/post-featured-media"
import { getArchiveVotes, incrementArchiveViews } from "@/app/actions/archive-vote-actions"
import { ArchiveVotes } from "@/components/archive-votes"
import { JsonLd } from "@/components/json-ld"
import { articleSchema, breadcrumbSchema, pageMetadata, socialImageUrl } from "@/lib/seo"

export const dynamic = "force-dynamic"

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  let post = await getArchiveBySlug(slug)
  let video = null
  
  if (!post) {
    video = await getPublishedVideoById(slug)
    if (!video) return pageMetadata({ title: "Record not found", path: `/archives/${slug}`, noIndex: true })
  }

  const site = getSiteUrl()
  const title = post?.title || video?.title || "Archive record"
  const desc = post?.excerpt || post?.subtitle || video?.description || "Archived QNotables record."
  const path = `/archives/${post?.slug || video?.id}`
  const ogImage = socialImageUrl(post
    ? resolveSocialImage({
        content: post.body,
        customImage: post.og_image_url,
        coverImage: post.cover_image_url,
        siteUrl: site,
      })
    : video?.thumbnail_url)

  const base = pageMetadata({ title, description: desc, path, image: ogImage, type: "article" })
  return {
    ...base,
    openGraph: {
      ...base.openGraph,
      type: "article",
      publishedTime: post?.published_at || video?.date,
      modifiedTime: post?.updated_at,
      authors: post?.source_author ? [post.author_name] : undefined,
    },
  }
}

export async function generateStaticParams() {
  try {
    const archives = await getAllArchives()
    const videos = await getPublishedVideos()
    const params = [
      ...archives.slice(0, 50).map((post) => ({
        slug: post.slug,
      })),
      ...videos.slice(0, 50).map((video) => ({
        slug: video.id,
      })),
    ]
    return params
  } catch {
    return []
  }
}

export default async function ArchiveDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  
  // Try to fetch as blog post first, then as video
  let post = await getArchiveBySlug(slug)
  let video = null
  
  if (!post) {
    // Try to fetch as video using the slug as video ID
    video = await getPublishedVideoById(slug)
    if (!video) {
      notFound()
    }
  }

  const featuredMedia = post ? resolveFirstPostMedia(post.body) : null
  const title = post?.title || video?.title || "Archive record"
  const description = post?.excerpt || post?.subtitle || video?.description || "Archived QNotables record."
  const articlePath = `/archives/${post?.slug || video?.id}`
  const articleImage = post
    ? resolveSocialImage({
        content: post.body,
        customImage: post.og_image_url,
        coverImage: post.cover_image_url,
        siteUrl: getSiteUrl(),
      })
    : video?.thumbnail_url
  const schemas = [
    articleSchema({
      title,
      description,
      path: articlePath,
      image: articleImage,
      published: post?.published_at || video?.date,
      modified: post?.updated_at,
      author: post?.source_author,
      type: "NewsArticle",
    }),
    breadcrumbSchema([
      { name: "Home", path: "/" },
      { name: "Archives", path: "/archives" },
      { name: title, path: articlePath },
    ]),
  ]

  // Fetch vote counts + increment views for blog posts
  const voteData = post
    ? await getArchiveVotes(post.id).catch(() => ({ upVotes: 0, downVotes: 0, userVote: null }))
    : { upVotes: 0, downVotes: 0, userVote: null }

  if (post?.id) {
    // Fire-and-forget — does not block page render
    void incrementArchiveViews(post.id)
  }

  // Get related posts by tag or category (only if this is a blog post), falling back to recents
  let relatedPosts: Awaited<ReturnType<typeof getAllArchives>> = []
  if (post) {
    const allPosts = await getAllArchives()
    const others = allPosts.filter((p) => p.slug !== post.slug)

    // 1. Same category or shared tag
    const matched = others.filter(
      (p) =>
        (post.tags && post.tags.some((t) => p.tags?.includes(t))) ||
        (post.category && p.category === post.category),
    )

    // 2. Fall back to most recent if no matches
    relatedPosts = (matched.length > 0 ? matched : others).slice(0, 2)
  }

  return (
    <div id="top" className="min-h-screen tactical-grid">
      <JsonLd data={schemas} />
      <SiteHeader />

      <main className="flex-1">
        {/* Hero section */}
        <div className="border-b border-border bg-card">
          <div className="mx-auto max-w-5xl px-4 py-8 md:px-6 md:py-12">
            <Link
              href="/archives"
              className="label-mono mb-6 inline-flex items-center gap-2 text-muted-foreground transition-colors hover:text-primary"
            >
              <ArrowLeft className="h-4 w-4" /> Archives
            </Link>

            {/* Badges */}
            <div className="mb-6 flex flex-wrap gap-2">
              {post?.priority === "critical" && (
                <span className="label-mono inline-flex items-center gap-1 border border-red-600/50 bg-red-50/10 px-2 py-1 text-xs font-semibold text-red-600">
                  <AlertCircle className="h-3 w-3" /> CRITICAL
                </span>
              )}
              {(post?.post_type || video?.category || "Video") && (
                <span className="label-mono border border-primary bg-primary/10 px-2 py-1 text-xs font-semibold text-primary">
                  {video ? "Video" : post?.post_type}
                </span>
              )}
              {(post?.category || video?.category) && (
                <span className="label-mono border border-border bg-background px-2 py-1 text-xs font-semibold text-muted-foreground">
                  {post?.category || video?.category}
                </span>
              )}
            </div>

            <h1 className="stencil text-balance text-4xl leading-tight text-foreground md:text-5xl lg:text-6xl">
              {post?.title || video?.title}
            </h1>

            {(post?.subtitle || video?.description) && (
              <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
                {post?.subtitle || video?.description}
              </p>
            )}

            {/* Meta */}
            <div className="label-mono mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-border pt-6 text-sm text-muted-foreground">
              <div className="flex flex-wrap items-center gap-4">
                {(post?.published_at || video?.date) && (
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" />
                    {formatDate(new Date(post?.published_at || video?.date || new Date()))}
                  </span>
                )}
                {post?.timeline_date && (
                  <span className="flex items-center gap-1 text-xs">
                    Timeline: {formatDate(new Date(post.timeline_date))}
                  </span>
                )}
                {post?.source_name && post?.source_url && (
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
                {video?.external_url && (
                  <a
                    href={video.external_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 transition-colors hover:text-primary"
                  >
                    External Link
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                )}
                {post?.tags && post.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {post.tags.map((tag) => (
                      <span key={tag} className="inline-block text-xs text-primary">
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Views + reputation voting — blog posts only */}
              {post && (
                <ArchiveVotes
                  postId={post.id}
                  slug={post.slug}
                  initialUpVotes={voteData.upVotes}
                  initialDownVotes={voteData.downVotes}
                  userVote={voteData.userVote}
                  viewCount={(post as any).view_count ?? 0}
                />
              )}
            </div>
          </div>
        </div>

        {/* First body media is featured; legacy dedicated media remains the fallback. */}
        {(featuredMedia || post?.cover_image_url || post?.video_url || post?.embed_url || post?.iframe_url || video?.thumbnail_url || video?.video_url) && (
          <div className="border-b border-border bg-muted/20 px-4 py-8 md:px-6">
            <div className="mx-auto max-w-5xl">
              {featuredMedia ? (
                <PostFeaturedMedia media={featuredMedia} title={post?.title || video?.title || "Featured media"} />
              ) : post?.cover_image_url ? (
                <img src={post.cover_image_url} alt={post.title} className="w-full border border-border object-cover" />
              ) : (post?.video_url || video?.video_url) ? (
                <video src={post?.video_url || video?.video_url || ""} poster={video?.thumbnail_url ?? undefined} controls playsInline preload="metadata" className="w-full border border-border" />
              ) : post?.embed_url ? (
                <SafeEmbed url={post.embed_url} type="iframe" title={post.title} />
              ) : post?.iframe_url ? (
                <SafeEmbed iframeCode={post.iframe_url} type="iframe" title={post.title} />
              ) : video?.thumbnail_url ? (
                <img src={video.thumbnail_url} alt={video.title} className="w-full border border-border object-cover" />
              ) : null}
            </div>
          </div>
        )}

        {/* Main content */}
        <article className="mx-auto max-w-5xl px-4 py-12 md:px-6 md:py-16">
          {post && (
            <div className="max-w-none">
              {isTiptapJson(post.body) ? (
                <TiptapRenderer content={post.body} omitFirstMedia={Boolean(featuredMedia)} />
              ) : (
                <Markdown content={post.body} omitFirstMedia={Boolean(featuredMedia)} />
              )}
            </div>
          )}
          {video && (
            <div className="space-y-6">
              {video.description && (
                <p className="text-lg leading-relaxed text-muted-foreground">
                  {video.description}
                </p>
              )}
            </div>
          )}

          {/* Document link */}
          {post?.document_url && (
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
          {post?.related_links && post.related_links.length > 0 && (
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
              title={post?.title || video?.title}
              url={`${getSiteUrl()}/archives/${post?.slug || video?.id}`}
              excerpt={post?.excerpt || post?.subtitle || (video?.description ?? undefined)}
              hashtags={post?.tags}
            />
          </div>
        </article>

        {/* Related posts */}
        <section className="border-t border-border bg-muted/20 px-4 py-12 md:px-6 md:py-16">
          <div className="mx-auto max-w-5xl">
            <div className="mb-8 flex items-center justify-between">
              <h2 className="stencil text-2xl text-foreground">Continue Reading</h2>
              <Link
                href="/archives"
                className="label-mono text-xs text-muted-foreground transition-colors hover:text-primary"
              >
                All Records →
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {relatedPosts.map((relatedPost) => {
                const cardImage = relatedPost.og_image_url || relatedPost.cover_image_url || null
                return (
                  <Link
                    key={relatedPost.slug}
                    href={`/archives/${relatedPost.slug}`}
                    className="group flex flex-col border border-border bg-card transition-colors hover:border-primary"
                  >
                    {cardImage ? (
                      <div className="relative aspect-video w-full overflow-hidden">
                        <img
                          src={cardImage}
                          alt={relatedPost.title}
                          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                      </div>
                    ) : (
                      <div className="aspect-video w-full bg-muted/30" />
                    )}
                    <div className="p-4">
                      <h3 className="stencil line-clamp-2 text-base leading-snug text-foreground transition-colors group-hover:text-primary">
                        {relatedPost.title}
                      </h3>
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  )
}


