import { getFeedItems, generateRssXml } from "@/lib/rss-utils"

export const dynamic = "force-dynamic"
export const revalidate = 300

/**
 * Public RSS 2.0 feed at /feed.xml.
 * Never throws — on any failure it returns a valid (possibly empty) feed.
 */
export async function GET() {
  try {
    const items = await getFeedItems(50)
    const xml = generateRssXml(items)
    return new Response(xml, {
      headers: {
        "Content-Type": "application/rss+xml; charset=utf-8",
        "Cache-Control": "public, max-age=300, stale-while-revalidate=600",
      },
    })
  } catch (error) {
    console.error("[v0] /feed.xml generation error:", error)
    // Return a valid empty feed instead of a 500 so consumers don't break.
    const fallback = generateRssXml([])
    return new Response(fallback, {
      status: 200,
      headers: {
        "Content-Type": "application/rss+xml; charset=utf-8",
        "Cache-Control": "public, max-age=60",
      },
    })
  }
}
