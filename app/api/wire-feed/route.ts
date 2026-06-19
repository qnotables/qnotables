import { getNews } from "@/lib/rss"

export async function GET() {
  try {
    const { featured, topStories, feed } = await getNews()
    const stories = [featured, ...topStories, ...feed].map((s) => ({
      id: s.id,
      headline: s.headline,
      summary: s.summary,
      source: s.source,
      url: s.url,
    }))

    return Response.json({ stories }, { headers: { "Cache-Control": "no-store, no-cache" } })
  } catch (error) {
    console.error("[v0] Wire feed API error:", error)
    return Response.json({ stories: [] }, { status: 500 })
  }
}
