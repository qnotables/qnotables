import { SiteHeader } from "@/components/site-header"
import { NewsTicker } from "@/components/news-ticker"
import { FeaturedStory } from "@/components/featured-story"
import { StoryCard } from "@/components/story-card"
import { TrendingPanel } from "@/components/trending-panel"
import { BriefSignup } from "@/components/brief-signup"
import { SiteFooter } from "@/components/site-footer"
import { WireFeed } from "@/components/wire-feed"
import { DeskFilterProvider } from "@/components/desk-filter-context"
import { getNews } from "@/lib/rss"
import { categories } from "@/lib/news-data"

export default async function Page() {
  const { featured, topStories, feed, trending, live } = await getNews()
  const tickerItems = [featured, ...topStories, ...feed].map((s) => ({
    headline: s.headline,
    url: s.url,
  }))

  // Group the wire feed into desks, keeping only desks that have stories.
  const desks = categories
    .map((cat) => ({ cat, stories: feed.filter((s) => s.category === cat) }))
    .filter((d) => d.stories.length > 0)

  return (
    <DeskFilterProvider>
    <div id="top" className="min-h-screen tactical-grid">
      <SiteHeader />
      <NewsTicker items={tickerItems} />

      <main className="mx-auto max-w-7xl px-4 py-6 md:px-6 md:py-8">
        {/* section label */}
        <div className="mb-5 flex items-center gap-3">
          <span className="h-2 w-2 bg-primary" />
          <h1 className="stencil text-xl text-foreground">Situation Report</h1>
          <span className="label-mono hidden text-muted-foreground sm:inline">
            {live ? "// UPDATED CONTINUOUSLY" : "// CACHED BRIEF"}
          </span>
          <span className="ml-auto h-px flex-1 bg-border" />
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* primary column */}
          <div className="lg:col-span-2">
            <FeaturedStory story={featured} />
            <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2">
              {topStories.map((story) => (
                <StoryCard key={story.id} story={story} />
              ))}
            </div>
          </div>

          {/* sidebar */}
          <aside className="flex flex-col gap-6">
            <TrendingPanel items={trending} />
            <BriefSignup />
          </aside>
        </div>

        {/* wire feed, grouped by desk (client-filtered via nav) */}
        <WireFeed desks={desks} />
      </main>

      <SiteFooter />
    </div>
    </DeskFilterProvider>
  )
}
