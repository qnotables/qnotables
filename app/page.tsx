import Link from "next/link"
import { ArrowUpRight } from "lucide-react"
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
import { getEmbedLearnMoreUrl } from "@/lib/embed-settings"
import { getConfiguredRssSources, getNews } from "@/lib/rss"
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
    embedLearnMoreUrl,
    monitoredSources,
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
    getEmbedLearnMoreUrl(),
    getConfiguredRssSources(),
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
        <SiteSwitcherEmbed learnMoreUrl={embedLearnMoreUrl} />

        <section className="mb-10 border-y border-border py-8 md:py-10">
          <p className="label-mono text-primary">QNOTABLES / INDEPENDENT SIGNAL</p>
          <div className="mt-3 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <h1 className="stencil text-4xl leading-none text-foreground md:text-6xl">The record, organized.</h1>
              <p className="mt-4 max-w-2xl text-pretty text-base leading-7 text-muted-foreground">Research, reporting, public records, and community discussion brought together for careful review.</p>
            </div>
            <Link href="/about" className="label-mono inline-flex items-center text-primary underline underline-offset-4">How QNotables works <ArrowUpRight className="ml-2 size-4" aria-hidden="true" /></Link>
          </div>
        </section>

        <div className="mb-8 mx-auto max-w-3xl text-center">
          <p className="text-pretty text-sm leading-relaxed text-muted-foreground">
            We are researchers who deal in open-source information, reasoned argument, and dank memes. We do battle in the sphere of ideas and ideas only. We neither need nor condone the use of force in our work here.
          </p>
          <p className="mt-3 font-mono text-[10px] font-semibold tracking-[0.18em] text-primary">
            NOTABLES DO NOT EQUAL ENDORSEMENTS
          </p>
        </div>

        <FeaturedRecords records={getFeaturedRecords(archivePosts)} />

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
        <div id="the-wire">
          <WireFeed desks={desks} isLoggedIn={isLoggedIn} />
        </div>

        <TownHallPulse pulse={townHallPulse} isLoggedIn={isLoggedIn} />

        <section className="mt-8 flex flex-col gap-4 border-y border-border py-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="label-mono text-xs text-primary">MONITORED SOURCES</p>
            <p className="mt-2 text-sm text-muted-foreground">Tracking reporting, public records, government releases, and independent media across {monitoredSources.length} active sources.</p>
          </div>
          <Link href="/sources" className="label-mono inline-flex shrink-0 items-center text-primary underline underline-offset-4">View all sources <ArrowUpRight className="ml-2 size-4" aria-hidden="true" /></Link>
        </section>
      </main>

      <BottomAd />
      <SiteFooter />
    </div>
    </DeskFilterProvider>
  )
}
