import { SiteHeader } from "@/components/site-header"
import { StoryCard } from "@/components/story-card"
import { TrendingPanel } from "@/components/trending-panel"
import { BriefSignup } from "@/components/brief-signup"
import { GallerySection } from "@/components/gallery-section"
import { SiteFooter } from "@/components/site-footer"
import { WireFeed } from "@/components/wire-feed"
import { DeskNav } from "@/components/desk-nav"
import { DeskFilterProvider } from "@/components/desk-filter-context"
import { TopAd, SidebarAd, BottomAd, InFeedAd } from "@/components/ad-display"
import { IconLinksCard } from "@/components/icon-links-card"
import { LiveStreamButton } from "@/components/live-stream-button"
import { SituationFeedCycle } from "@/components/situation-report-cycle"
import type { SituationForumItem, SituationBlogItem } from "@/components/situation-report-cycle"

import { DailyVerseWidget } from "@/components/daily-verse-widget"
import { SiteSwitcherEmbed } from "@/components/site-switcher-embed"
import { FlashStory } from "@/components/flash-story"
import { RssFeedCards } from "@/components/rss-feed-cards"
import { getNews } from "@/lib/rss"
import { getRecentBlogPosts } from "@/lib/blog-posts"
import { getRecentForumThreads } from "@/lib/forum"
import { categories } from "@/lib/news-data"
import { JsonLd } from "@/components/json-ld"
import { pageMetadata, websiteSchema } from "@/lib/seo"

export const metadata = pageMetadata({
  title: "QNotables — News, Research, and Public Records",
  path: "/",
})

export default async function Page() {
  const [
    { featured, topStories, feed, trending, live },
    recentThreads,
    recentBlogs,
  ] = await Promise.all([
    getNews(),
    getRecentForumThreads(5),
    getRecentBlogPosts(5),
  ])

  // Map to typed cycle props
  const forumItems: SituationForumItem[] = recentThreads.map((t) => ({
    type: "forum",
    id: t.id,
    slug: t.slug,
    title: t.title,
    body: t.body,
    authorName: t.authorName,
    createdAt: t.createdAt,
    lastActivityAt: t.lastActivityAt,
    latestImageUrl: t.latestImageUrl,
    replyCount: t.replyCount,
    category: t.category,
    isFeatured: t.isFeatured,
    latestReply: t.latestReply ?? null,
  }))

  const blogItems: SituationBlogItem[] = recentBlogs.map((p) => ({
    type: "blog",
    id: p.id,
    slug: p.slug,
    title: p.title,
    excerpt: p.excerpt,
    category: p.category,
    tag: p.tag,
    tags: p.tags,
    coverImage: p.coverImage,
    seoImageUrl: p.seoImageUrl,
    date: p.date,
    readMinutes: p.readMinutes,
    featured: p.featured,
    priority: p.priority,
    postType: p.postType,
    sourceName: p.sourceName,
    content: p.content,
  }))

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
      <JsonLd data={websiteSchema} />
      <SiteHeader wireStories={wireStories} />
      <TopAd />

      <main className="mx-auto max-w-7xl px-4 py-6 md:px-6 md:py-8">
        {/* Site Switcher Embed */}
        <SiteSwitcherEmbed />

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
            {/* Situation Report cyclers: recent blog posts (top) + recent forum posts (bottom) */}
            <div className="flex flex-col gap-6">
              <SituationFeedCycle
                items={blogItems}
                heading="LATEST DISPATCHES"
                iconName="blog"
                emptyLabel="BLOG DISPATCHES"
              />
              <SituationFeedCycle
                items={forumItems}
                heading="LATEST FORUM ACTIVITY"
                iconName="forum"
                emptyLabel="FORUM ACTIVITY"
              />
            </div>

            {/* Flash Story Cards */}
            <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2">
              {topStories.slice(0, 2).map((story) => (
                <FlashStory
                  key={story.id}
                  title={story.headline}
                  excerpt={story.summary}
                  category={story.category}
                  date={new Date(Date.now() - story.minutesAgo * 60 * 1000).toISOString()}
                  readMinutes={story.readMinutes}
                  image={story.image}
                  source={story.source}
                  url={story.url}
                  type="feed"
                />
              ))}
            </div>

            {/* In-feed ad */}
            <div className="mt-6">
              <InFeedAd />
            </div>

            <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2">
              {topStories.slice(2).map((story) => (
                <StoryCard key={story.id} story={story} />
              ))}
            </div>
            <div className="w-full">
              <iframe
                src="https://discord.com/widget?id=1521130800676995225&theme=dark"
                width="100%"
                height="300"
                allowTransparency={true}
                frameBorder="0"
                sandbox="allow-popups allow-popups-to-escape-sandbox allow-same-origin allow-scripts"
                title="Discord"
                className="block w-full"
              />
            </div>
          </div>

          {/* sidebar */}
          <aside className="flex flex-col gap-6">
            <IconLinksCard />
            <DailyVerseWidget />
            <TrendingPanel items={trending} />
            <div className="sticky top-6">
              <SidebarAd />
            </div>
            <BriefSignup />
          </aside>
        </div>

        {/* Gallery Section */}
        <div className="mt-12">
          <GallerySection />
        </div>

        {/* RSS source directory */}
        <details className="group mt-12 border-y border-border">
          <summary className="flex cursor-pointer list-none items-center gap-3 py-5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background [&::-webkit-details-marker]:hidden">
            <span className="h-2 w-2 bg-primary" />
            <h2 className="stencil text-xl text-foreground">RSS Sources</h2>
            <span className="h-px flex-1 bg-border" />
            <span className="label-mono text-xs text-muted-foreground group-open:hidden">Show sources</span>
            <span className="label-mono hidden text-xs text-muted-foreground group-open:inline">Hide sources</span>
            <span
              aria-hidden="true"
              className="text-lg leading-none text-primary transition-transform group-open:rotate-45"
            >
              +
            </span>
          </summary>
          <div className="pb-6">
            <RssFeedCards />
          </div>
        </details>

        {/* wire feed, grouped by desk (client-filtered via nav) */}
        <div className="mt-6">
          <DeskNav />
        </div>
        <WireFeed desks={desks} />
      </main>

      <BottomAd />
      <SiteFooter />
    </div>
    </DeskFilterProvider>
  )
}
