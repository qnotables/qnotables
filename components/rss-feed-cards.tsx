import { type Story } from "@/lib/news-data"
import { RSS_SOURCES } from "@/lib/rss"
import { StoryCard } from "@/components/story-card"

// Map each RSS source to a Story-compatible shape for display
const FEED_STORIES: Record<string, Partial<Story>> = {
  "/qr/": {
    headline: "QResearch Live Feed",
    summary: "Live tripcode feed from 8kun /qresearch/. Real-time Q drops and active research thread activity from the board.",
    source: "/QRESEARCH/",
    category: "OTHER",
    priority: "PRIORITY",
    minutesAgo: 0,
    reports: 0,
    readMinutes: 0,
  },
  "qnotables": {
    headline: "QNotables Feed",
    summary: "Curated notables feed from the /qnotables/ board. Aggregated highlights and key posts from active research threads.",
    source: "/QNOTABLES/",
    category: "OTHER",
    priority: "ROUTINE",
    minutesAgo: 0,
    reports: 0,
    readMinutes: 0,
  },
  "fox": {
    headline: "Fox News Politics",
    summary: "Breaking political headlines from the Fox News politics desk. Updated continuously with the latest from Washington.",
    source: "FOX NEWS",
    category: "POLITICS",
    priority: "PRIORITY",
    minutesAgo: 0,
    reports: 0,
    readMinutes: 0,
  },
  "foxn": {
    headline: "Fox News National",
    summary: "National news feed from Fox News. Top stories and breaking coverage from across the United States.",
    source: "FOX NEWS",
    category: "WORLD",
    priority: "ROUTINE",
    minutesAgo: 0,
    reports: 0,
    readMinutes: 0,
  },
  "NY Post": {
    headline: "New York Post",
    summary: "National and political coverage from the New York Post. Breaking news and investigative reporting.",
    source: "NY POST",
    category: "POLITICS",
    priority: "ROUTINE",
    minutesAgo: 0,
    reports: 0,
    readMinutes: 0,
  },
}

export function RssFeedCards() {
  const enabledSources = RSS_SOURCES.filter((s) => s.enabled).slice(0, 2)

  const stories: Story[] = enabledSources.map((source) => {
    const meta = FEED_STORIES[source.id] ?? {
      headline: source.name,
      summary: `Live RSS feed from ${source.name}.`,
      source: source.name,
      category: "OTHER" as const,
      priority: "ROUTINE" as const,
      minutesAgo: 0,
      reports: 0,
      readMinutes: 0,
    }

    return {
      id: `rss-${source.id}`,
      headline: meta.headline ?? source.name,
      summary: meta.summary ?? "",
      source: meta.source ?? source.name,
      category: meta.category ?? "OTHER",
      priority: meta.priority ?? "ROUTINE",
      minutesAgo: meta.minutesAgo ?? 0,
      reports: meta.reports ?? 0,
      readMinutes: meta.readMinutes ?? 0,
      url: source.url,
    }
  })

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
      {stories.map((story) => (
        <StoryCard key={story.id} story={story} />
      ))}
    </div>
  )
}
