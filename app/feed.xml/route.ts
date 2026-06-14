import { getNews } from "@/lib/rss"

export const dynamic = "force-dynamic"
export const revalidate = 300 // Cache for 5 minutes

// Map internal priority names to RSS priority levels
const PRIORITY_MAP = {
  FLASH: "Critical",
  PRIORITY: "High",
  ROUTINE: "Medium",
}

// Map internal category names to RSS categories
const CATEGORY_MAP: Record<string, string> = {
  WORLD: "International Conflict",
  POLITICS: "Domestic Politics",
  DEFENSE: "Defense",
  ECONOMY: "Economy",
  TECH: "Technology",
  SCIENCE: "Science",
  ENERGY: "Energy",
  OTHER: "General",
}

// Research status for items (can be extended based on data)
function getResearchStatus(priority: string): string {
  if (priority === "FLASH") return "Confirmed Source"
  if (priority === "PRIORITY") return "Developing"
  return "Unverified Lead"
}

// Build the RSS 2.0 feed XML
export async function GET() {
  try {
    const newsBundle = await getNews()
    const allStories = [
      newsBundle.featured,
      ...newsBundle.topStories,
      ...newsBundle.feed,
    ]

    // Filter to only published items (not drafts/hidden)
    const publishedStories = allStories.filter((s) => !s.id.includes("draft"))

    const buildDate = new Date().toUTCString()
    const lastBuildDate = publishedStories[0]
      ? new Date(Date.now() - publishedStories[0].minutesAgo * 60000).toUTCString()
      : buildDate

    // Escape XML special characters
    const escapeXml = (str: string) =>
      str
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&apos;")

    // Build RSS items
    const items = publishedStories
      .map((story) => {
        const priority = story.priority || "ROUTINE"
        const rssPriority = PRIORITY_MAP[priority as keyof typeof PRIORITY_MAP] || "Medium"
        const category = CATEGORY_MAP[story.category] || "General"
        const status = getResearchStatus(priority)
        const guid = `https://www.qnotables.app/story/${story.id}`
        const link = story.url || `https://www.qnotables.app#story-${story.id}`
        const pubDate = new Date(
          Date.now() - story.minutesAgo * 60000
        ).toUTCString()

        // Build media image tag if available
        const mediaImage = story.image
          ? `<media:content url="${escapeXml(story.image)}" medium="image" />`
          : ""

        // Build CDATA description with safe HTML/links
        const description = escapeXml(
          `${story.summary}\n\nSource: ${story.source}\nRead time: ${story.readMinutes} min\nReports: ${story.reports}`
        )

        return `    <item>
      <title>${escapeXml(story.headline)}</title>
      <link>${escapeXml(link)}</link>
      <guid isPermaLink="false">${guid}</guid>
      <pubDate>${pubDate}</pubDate>
      <description><![CDATA[${description}]]></description>
      <category>${escapeXml(category)}</category>
      <source url="${escapeXml(story.url || "")}">
        <title>${escapeXml(story.source)}</title>
      </source>
      <author>${escapeXml(story.source)}</author>
      ${mediaImage}
      <haf:priority>${rssPriority}</haf:priority>
      <haf:status>${status}</haf:status>
      <haf:sourceName>${escapeXml(story.source)}</haf:sourceName>
      <haf:sourceUrl>${escapeXml(story.url || "")}</haf:sourceUrl>
      <haf:rank>${allStories.indexOf(story) + 1}</haf:rank>
      <haf:readMinutes>${story.readMinutes}</haf:readMinutes>
      <haf:reports>${story.reports}</haf:reports>
    </item>`
      })
      .join("\n")

    const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"
  xmlns:content="http://purl.org/rss/1.0/modules/content/"
  xmlns:media="http://search.yahoo.com/mrss/"
  xmlns:haf="https://www.qnotables.app/rss/hot-and-fresh">
  <channel>
    <title>HOT AND FRESH Feed</title>
    <link>https://www.qnotables.app</link>
    <description>Fresh drops. Hot leads. Organized for the record.</description>
    <language>en-us</language>
    <lastBuildDate>${lastBuildDate}</lastBuildDate>
    <generator>HOT AND FRESH Research Wire</generator>
    <image>
      <title>HOT AND FRESH Feed</title>
      <url>https://www.qnotables.app/images/hot-and-fresh-default-feed.jpg</url>
      <link>https://www.qnotables.app</link>
    </image>
    ${items}
  </channel>
</rss>`

    return new Response(rss, {
      headers: {
        "Content-Type": "application/rss+xml; charset=utf-8",
        "Cache-Control": "public, max-age=300, stale-while-revalidate=600",
      },
    })
  } catch (error) {
    console.error("[v0] RSS feed generation error:", error)
    // Return an error RSS feed
    return new Response(
      `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>HOT AND FRESH Feed - Error</title>
    <link>https://www.qnotables.app</link>
    <description>Feed temporarily unavailable</description>
  </channel>
</rss>`,
      {
        status: 500,
        headers: {
          "Content-Type": "application/rss+xml; charset=utf-8",
        },
      }
    )
  }
}
