import { SiteHeader } from "@/components/site-header"
import { FeaturedStory } from "@/components/featured-story"
import { StoryCard } from "@/components/story-card"
import { TrendingPanel } from "@/components/trending-panel"
import { BriefSignup } from "@/components/brief-signup"
import { GallerySection } from "@/components/gallery-section"
import { SiteFooter } from "@/components/site-footer"
import { WireFeed } from "@/components/wire-feed"
import { DeskNav } from "@/components/desk-nav"
import { DeskFilterProvider } from "@/components/desk-filter-context"
import { TopAd, SidebarAd, BottomAd } from "@/components/ad-display"
import { IconLinksCard } from "@/components/icon-links-card"
import { LiveStreamButton } from "@/components/live-stream-button"
import { SituationReportCycle } from "@/components/situation-report-cycle"
import type { SituationForumItem, SituationBlogItem, SituationArchiveItem } from "@/components/situation-report-cycle"
import { RumbleLiveStream } from "@/components/rumble-live-stream"
import { getNews } from "@/lib/rss"
import { getHottestBlogPost, getHottestArchivePost } from "@/lib/blog-posts"
import { getHottestForumThread } from "@/lib/forum"
import { categories } from "@/lib/news-data"

export default async function Page() {
  const [
    { featured, topStories, feed, trending, live },
    hottestThread,
    hottestBlog,
    hottestArchive,
  ] = await Promise.all([
    getNews(),
    getHottestForumThread(),
    getHottestBlogPost(),
    getHottestArchivePost(),
  ])

  // Map to typed cycle props
  const forumItem: SituationForumItem | null = hottestThread
    ? {
        type: "forum",
        id: hottestThread.id,
        title: hottestThread.title,
        body: hottestThread.body,
        authorName: hottestThread.authorName,
        createdAt: hottestThread.createdAt,
        replyCount: hottestThread.replyCount,
        category: hottestThread.category,
        isFeatured: hottestThread.isFeatured,
      }
    : null

  const blogItem: SituationBlogItem | null = hottestBlog
    ? {
        type: "blog",
        id: hottestBlog.id,
        slug: hottestBlog.slug,
        title: hottestBlog.title,
        excerpt: hottestBlog.excerpt,
        category: hottestBlog.category,
        tag: hottestBlog.tag,
        tags: hottestBlog.tags,
        coverImage: hottestBlog.coverImage,
        date: hottestBlog.date,
        readMinutes: hottestBlog.readMinutes,
        featured: hottestBlog.featured,
        priority: hottestBlog.priority,
        postType: hottestBlog.postType,
        sourceName: hottestBlog.sourceName,
        content: hottestBlog.content,
      }
    : null

  const archiveItem: SituationArchiveItem | null = hottestArchive
    ? {
        type: "archive",
        id: hottestArchive.id,
        slug: hottestArchive.slug,
        title: hottestArchive.title,
        excerpt: hottestArchive.excerpt,
        category: hottestArchive.category,
        tag: hottestArchive.tag,
        postType: hottestArchive.postType,
        priority: hottestArchive.priority,
        featured: hottestArchive.featured,
        coverImage: hottestArchive.coverImage,
        sourceName: hottestArchive.sourceName,
        date: hottestArchive.date,
        readMinutes: hottestArchive.readMinutes,
      }
    : null
  
  const wireStories = [featured, ...topStories, ...feed].map((s) => ({
    id: s.id,
    headline: s.headline,
    summary: s.summary,
    source: s.source,
    url: s.url,
    image: s.image,
  }))

  const desks = categories
    .map((cat) => ({ cat, stories: feed.filter((s) => s.category === cat) }))
    .filter((d) => d.stories.length > 0)

  return (
    <DeskFilterProvider>
    <div id="top" className="min-h-screen tactical-grid">
      <SiteHeader wireStories={wireStories} />
      <TopAd />

      <main className="mx-auto max-w-7xl px-4 py-6 md:px-6 md:py-8">
        {/* 8kun QResearch Catalog Embed */}
        <div className="mb-6 border border-border bg-card overflow-hidden">
          <div className="flex items-center justify-between border-b border-border bg-muted/60 px-4 py-2.5">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 bg-primary flex-shrink-0" aria-hidden="true" />
              <span className="label-mono text-xs font-bold text-primary tracking-widest">QRESEARCH</span>
              <span className="label-mono text-xs text-muted-foreground hidden sm:inline">— 8kun Catalog</span>
            </div>
            <a
              href="https://8kun.top/qresearch/catalog.html"
              target="_blank"
              rel="noopener noreferrer"
              className="label-mono text-xs text-primary hover:underline whitespace-nowrap"
            >
              OPEN IN NEW TAB →
            </a>
          </div>
          <div className="relative w-full" style={{ height: "1300px" }}>
            <iframe
              src="https://8kun.top/qresearch/catalog.html"
              title="QResearch Catalog"
              className="absolute inset-0 h-full w-full border-0"
              loading="lazy"
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox"
            />
          </div>
        </div>

        {/* section label */}
        <div className="mb-5 flex items-center gap-3">
          <span className="h-2 w-2 bg-primary" />
          <h1 className="stencil text-xl text-foreground">Situation Report</h1>
          <LiveStreamButton live={live} />
          <span className="ml-auto h-px flex-1 bg-border" />
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* primary column */}
          <div className="lg:col-span-2">
            <FeaturedStory story={featured} />

            {/* Situation Report cycle: Forum / Blog / Archive */}
            <div className="mt-6">
              <SituationReportCycle
                forumItem={forumItem}
                blogItem={blogItem}
                archiveItem={archiveItem}
              />
            </div>
            
            <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2">
              {topStories.map((story) => (
                <StoryCard key={story.id} story={story} />
              ))}
            </div>
          </div>

          {/* sidebar */}
          <aside className="flex flex-col gap-6">
            <IconLinksCard />
            <TrendingPanel items={trending} />
            <SidebarAd />
            <BriefSignup />
          </aside>
        </div>

        {/* Rumble Live Stream — compact flash card */}
        <div className="mt-12">
          <RumbleLiveStream />
        </div>

        {/* Gallery Section - Below Brief Signup */}
        <div className="mt-12">
          <GallerySection />
        </div>

        {/* wire feed, grouped by desk (client-filtered via nav) */}
        <DeskNav />
        <WireFeed desks={desks} />
      </main>

      <BottomAd />
      <SiteFooter />
    </div>
    </DeskFilterProvider>
  )
}
