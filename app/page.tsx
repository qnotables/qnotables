import { SiteHeader } from "@/components/site-header"
import { FlashStory } from "@/components/flash-story"
import { FeaturedStory } from "@/components/featured-story"
import { StoryCard } from "@/components/story-card"
import { TrendingPanel } from "@/components/trending-panel"
import { BriefSignup } from "@/components/brief-signup"
import { SiteFooter } from "@/components/site-footer"
import { WireFeed } from "@/components/wire-feed"
import { DeskNav } from "@/components/desk-nav"
import { DeskFilterProvider } from "@/components/desk-filter-context"
import { TopAd, SidebarAd, BottomAd } from "@/components/ad-display"
import { IconLinksCard } from "@/components/icon-links-card"
import { LiveStreamButton } from "@/components/live-stream-button"
import { ForumThreadCard } from "@/components/forum-thread-card"
import { getNews } from "@/lib/rss"
import { getLatestPost } from "@/lib/blog-posts"
import { getHottestForumThread } from "@/lib/forum"
import { categories } from "@/lib/news-data"

export default async function Page() {
  const { featured, topStories, feed, trending, live } = await getNews()
  const flashPost = await getLatestPost()
  const hottestThread = await getHottestForumThread()
  
  const wireStories = [featured, ...topStories, ...feed].map((s) => ({
    id: s.id,
    headline: s.headline,
    summary: s.summary,
    source: s.source,
    url: s.url,
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
            
            {/* Flash Story - Latest Archive */}
            {flashPost && (
              <div className="mt-6">
                <FlashStory
                  title={flashPost.title}
                  excerpt={flashPost.excerpt}
                  category={flashPost.category}
                  date={flashPost.date}
                  readMinutes={flashPost.readMinutes}
                  image={flashPost.coverImage}
                  slug={flashPost.slug}
                  source={flashPost.sourceName}
                  type="archive"
                />
              </div>
            )}
            
            {/* Blog and Forum Section */}
            {hottestThread && (
              <div className="mt-6">
                <ForumThreadCard
                  id={hottestThread.id}
                  title={hottestThread.title}
                  body={hottestThread.body}
                  authorName={hottestThread.authorName}
                  createdAt={hottestThread.createdAt}
                  replyCount={hottestThread.replyCount}
                />
              </div>
            )}
            
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
