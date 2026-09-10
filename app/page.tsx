import { SiteHeader } from "@/components/site-header"
import { StoryCard } from "@/components/story-card"
import { TrendingPanel } from "@/components/trending-panel"
import { GallerySection } from "@/components/gallery-section"
import { SiteFooter } from "@/components/site-footer"
import { WireFeed } from "@/components/wire-feed"
import { DeskFilterProvider } from "@/components/desk-filter-context"
import { TopAd, BottomAd, InFeedAd } from "@/components/ad-display"
import { ContentSidebar } from "@/components/content-sidebar"
import { LiveStreamButton } from "@/components/live-stream-button"
import { HomeContentSections } from "@/components/home-content-sections"

import { SiteSwitcherEmbed } from "@/components/site-switcher-embed"
import { FlashStory } from "@/components/flash-story"
import { RssFeedCards } from "@/components/rss-feed-cards"
import { getNews } from "@/lib/rss"
import { getRecentBlogPosts } from "@/lib/blog-posts"
import { getRecentForumThreads } from "@/lib/forum"
import { categories } from "@/lib/news-data"
import { JsonLd } from "@/components/json-ld"
import { pageMetadata, websiteSchema } from "@/lib/seo"
import { getImportAccess } from "@/app/actions/rss-import-actions"

export const metadata = pageMetadata({
  title: "QNotables — News, Research, and Public Records",
  path: "/",
})

export const dynamic = "force-dynamic"

export default async function Page() {
  const [
    { featured, topStories, feed, trending, live },
    recentThreads,
    recentBlogs,
    isLoggedIn,
  ] = await Promise.all([
    getNews(),
    getRecentForumThreads(8),
    getRecentBlogPosts(4),
    getImportAccess(),
  ])

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

        {/* Media Library */}
        <div className="mb-8">
          <GallerySection />
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
            {/* Stable editorial and community cards; no automatic rotation. */}
            <HomeContentSections posts={recentBlogs} threads={recentThreads} />

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
                  isLoggedIn={isLoggedIn}
                  importContent={story.summary}
                />
              ))}
            </div>

            {/* In-feed ad */}
            <div className="mt-6">
              <InFeedAd index={4} />
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
                frameBorder="0"
                sandbox="allow-popups allow-popups-to-escape-sandbox allow-same-origin allow-scripts"
                title="Discord"
                className="block w-full"
              />
            </div>
          </div>

          {/* sidebar */}
          <ContentSidebar>
            <TrendingPanel items={trending} />
          </ContentSidebar>
        </div>

        {/* wire feed, grouped by desk (client-filtered via nav) */}
        <WireFeed desks={desks} isLoggedIn={isLoggedIn} />

        {/* RSS source directory */}
        <details className="group mt-6 border-y border-border">
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
      </main>

      <BottomAd />
      <SiteFooter />
    </div>
    </DeskFilterProvider>
  )
}
