import { SiteHeader } from "@/components/site-header"
import { TrendingPanel } from "@/components/trending-panel"
import { GallerySection } from "@/components/gallery-section"
import { SiteFooter } from "@/components/site-footer"
import { WireFeed } from "@/components/wire-feed"
import { DeskFilterProvider } from "@/components/desk-filter-context"
import { TopAd, BottomAd, InFeedAd } from "@/components/ad-display"
import { ContentSidebar } from "@/components/content-sidebar"
import { LiveStreamButton } from "@/components/live-stream-button"
import { HomeFeed } from "@/components/home-feed"
import { SiteSwitcherEmbed } from "@/components/site-switcher-embed"
import { RssFeedCards } from "@/components/rss-feed-cards"
import { getNews } from "@/lib/rss"
import { getAllPosts, getRecentBlogPosts } from "@/lib/blog-posts"
import { getFeaturedRecords } from "@/lib/archives-utils"
import { FeaturedRecords } from "@/components/featured-records"
import { getRecentForumThreads } from "@/lib/forum"
import { categories } from "@/lib/news-data"
import { JsonLd } from "@/components/json-ld"
import { pageMetadata, websiteSchema } from "@/lib/seo"
import { getImportAccess } from "@/app/actions/rss-import-actions"
import { getActiveSignalActions } from "@/app/actions/signal-actions"
import { getNotables } from "@/app/actions/notables-actions"
import { adaptHomeFeed } from "@/lib/home-feed"
import { getApprovedSignalAnalysisItems } from "@/lib/signal-analysis"
import { getTownHallPulse } from "@/lib/pulse"
import { TownHallPulse } from "@/components/town-hall-pulse"

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
    archivePosts,
    notables,
    isLoggedIn,
    activeSignalActions,
    approvedSignalItems,
    townHallPulse,
  ] = await Promise.all([
    getNews(),
    getRecentForumThreads(5),
    getRecentBlogPosts(5),
    getAllPosts(),
    getNotables({ pageSize: 5 }),
    getImportAccess(),
    getActiveSignalActions(),
    getApprovedSignalAnalysisItems(8),
    getTownHallPulse(),
  ])

  const homeFeedItems = adaptHomeFeed({
    blogs: recentBlogs,
    threads: recentThreads,
    stories: [featured, ...topStories, ...feed],
    notables: notables.items,
    analysis: approvedSignalItems,
  })

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

        <div className="mb-8 mx-auto max-w-3xl text-center">
          <p className="text-pretty text-sm leading-relaxed text-muted-foreground">
            We are researchers who deal in open-source information, reasoned argument, and dank memes. We do battle in the sphere of ideas and ideas only. We neither need nor condone the use of force in our work here.
          </p>
          <p className="mt-3 font-mono text-[10px] font-semibold tracking-[0.18em] text-primary">
            NOTABLES DO NOT EQUAL ENDORSEMENTS
          </p>
        </div>

        <FeaturedRecords records={getFeaturedRecords(archivePosts)} />

        <TownHallPulse pulse={townHallPulse} isLoggedIn={isLoggedIn} />

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
            <HomeFeed items={homeFeedItems} isLoggedIn={isLoggedIn} activeActions={activeSignalActions} />

            <div className="mt-6">
              <InFeedAd index={4} />
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
