import Link from "next/link"
import Image from "next/image"
import { notFound, redirect } from "next/navigation"
import { ArrowLeft, Clock } from "lucide-react"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { TopAd, SidebarAd, BottomAd } from "@/components/ad-display"
import { Markdown } from "@/components/markdown"
import { TiptapRenderer } from "@/components/tiptap-renderer"
import { isTiptapJson } from "@/lib/tiptap-utils"
import { getPost, formatDate } from "@/lib/blog-posts"
import { getRelatedPosts } from "@/lib/archives"
import { ShareButtons } from "@/components/share-buttons"
import { getSiteUrl } from "@/lib/rss-utils"
import { resolveFirstPostMedia, resolveSocialImage } from "@/lib/post-media"
import { PostFeaturedMedia } from "@/components/post-featured-media"
import { BlogComments } from "@/components/blog-comments"
import { getBlogComments } from "@/app/actions/blog-comment-actions"
import { getPostViewCount } from "@/app/actions/blog-view-actions"
import { ViewCounter } from "@/components/view-counter"
import { createClient } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const post = await getPost(slug)
  if (!post) return { title: "Not found — HOT AND FRESH" }
  const site = getSiteUrl()
  const canonical = `${site}/archives/${post.slug}`
  const description = post.subtitle || post.excerpt || "Archived HOT AND FRESH record."
  
  const ogImage = resolveSocialImage({
    content: post.content,
    customImage: post.seoImageUrl,
    coverImage: post.coverImage,
    siteUrl: site,
  })
  
  return {
    title: `${post.title} — HOT AND FRESH`,
    description,
    alternates: { canonical },
    openGraph: {
      title: post.title,
      description,
      url: canonical,
      images: [{ url: ogImage }],
      type: "article",
      publishedTime: post.publishedAt || post.date,
      modifiedTime: post.updatedAt,
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description,
      images: [ogImage],
    },
  }
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const post = await getPost(slug)
  if (!post) notFound()

  // Redirect /blog/slug to /archives/slug
  if (slug !== post.slug) {
    redirect(`/archives/${post.slug}`)
  }

  const featuredMedia = resolveFirstPostMedia(post.content)
  const relatedPosts = post.id ? await getRelatedPosts(post.id, 2) : []
  const comments = post.id ? await getBlogComments(post.id) : []
  const initialViewCount = post.id ? await getPostViewCount(post.id) : 0

  // Fetch current user for comment form
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const currentUserId = user?.id ?? null

  return (
    <div id="top" className="min-h-screen tactical-grid">
      <SiteHeader />

      {/* Top ad — full width below the header */}
      <TopAd />

      <main className="mx-auto max-w-7xl px-4 py-10 md:px-6">
        {/* Two-column layout: article (left) + sidebar (right) */}
        <div className="flex flex-col gap-10 lg:flex-row lg:items-start lg:gap-12">

          {/* Article column */}
          <div className="min-w-0 flex-1">
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

            <div className="label-mono mt-6 flex flex-wrap items-center gap-4 border-b border-border pb-6 text-muted-foreground">
              <span>{post.author}</span>
              <span className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" /> {post.readMinutes} MIN READ
              </span>
              {post.id && (
                <ViewCounter postId={post.id} initialCount={initialViewCount} />
              )}
            </div>

            <article className="mt-8">
              {featuredMedia && (
                <div className="mb-8">
                  <PostFeaturedMedia media={featuredMedia} title={post.title} />
                </div>
              )}
              {isTiptapJson(post.content) ? (
                <TiptapRenderer content={post.content} omitFirstMedia={Boolean(featuredMedia)} />
              ) : (
                <Markdown content={post.content} omitFirstMedia={Boolean(featuredMedia)} />
              )}
            </article>

            {/* Share section */}
            <div className="mt-12 border-t border-border pt-8">
              <p className="label-mono mb-4 text-xs font-semibold text-muted-foreground">SHARE THIS RECORD</p>
              <ShareButtons
                title={post.title}
                url={`${getSiteUrl()}/archives/${post.slug}`}
                excerpt={post.subtitle || post.excerpt}
                hashtags={post.tags}
              />
            </div>

            {/* Related posts */}
            <section className="mt-12 border-t border-border pt-8">
              <div className="mb-6 flex items-center justify-between">
                <h2 className="stencil text-xl text-foreground">Continue Reading</h2>
                <Link
                  href="/archives"
                  className="label-mono text-xs text-muted-foreground transition-colors hover:text-primary"
                >
                  All Records →
                </Link>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                {relatedPosts.map((relatedPost) => {
                  const ogImage = relatedPost.seoImageUrl || relatedPost.coverImage || null
                  return (
                    <Link
                      key={relatedPost.slug}
                      href={`/archives/${relatedPost.slug}`}
                      className="group flex flex-col border border-border bg-card transition-colors hover:border-primary"
                    >
                      {ogImage ? (
                        <div className="relative aspect-video w-full overflow-hidden">
                          <Image
                            src={ogImage}
                            alt={relatedPost.title}
                            fill
                            className="object-cover transition-transform duration-300 group-hover:scale-105"
                            sizes="(max-width: 640px) 100vw, 50vw"
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
            </section>

            {/* Comments section */}
            {post.id && (
              <div className="mt-12">
                <BlogComments postId={post.id} initialComments={comments} currentUserId={currentUserId} />
              </div>
            )}
          </div>

          {/* Sidebar ad column — hidden on mobile, sticky on desktop */}
          <aside className="hidden lg:block lg:w-64 xl:w-72 shrink-0">
            <SidebarAd />
          </aside>

        </div>
      </main>

      {/* Bottom ad — full width above the footer */}
      <BottomAd />

      <SiteFooter />
    </div>
  )
}
