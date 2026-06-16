import { createClient } from "@supabase/supabase-js"

export const dynamic = "force-dynamic"

function getSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !key) {
    throw new Error("Supabase credentials not configured")
  }

  return createClient(url, key)
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;")
}

export async function GET(request: Request) {
  try {
    const supabase = getSupabaseClient()
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://hotandfresh.news"

    // Fetch published archives that should be in RSS
    const { data: posts, error } = await supabase
      .from("blog_posts")
      .select("id, slug, title, excerpt, body, category, tags, post_type, featured, source_name, source_url, published_at, cover_image_url, video_url, priority")
      .eq("status", "published")
      .eq("include_in_rss", true)
      .order("published_at", { ascending: false })
      .limit(50)

    if (error) {
      console.error("[v0] RSS fetch error:", error)
      throw error
    }

    // Build RSS items
    const items = (posts || [])
      .map(post => {
        const publishDate = post.published_at
          ? new Date(post.published_at).toUTCString()
          : new Date().toUTCString()

        return `
    <item>
      <title>${escapeXml(post.title)}</title>
      <link>${baseUrl}/archives/${post.slug}</link>
      <guid isPermaLink="false">${baseUrl}/archives/${post.slug}</guid>
      <pubDate>${publishDate}</pubDate>
      <description><![CDATA[${post.excerpt || ""}]]></description>
      ${post.category ? `<category>${escapeXml(post.category)}</category>` : ""}
      ${post.tags?.map((tag: string) => `<category>${escapeXml(tag)}</category>`).join("") || ""}
      ${post.source_name ? `<author>${escapeXml(post.source_name)}</author>` : ""}
      ${post.cover_image_url ? `<media:content url="${escapeXml(post.cover_image_url)}" medium="image" />` : ""}
      ${post.video_url ? `<enclosure url="${escapeXml(post.video_url)}" type="video/mp4" />` : ""}
    </item>
    `
      })
      .join("")

    const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:content="http://purl.org/rss/1.0/modules/content/" xmlns:media="http://search.yahoo.com/mrss/">
  <channel>
    <title>HOT AND FRESH — Archives</title>
    <link>${baseUrl}/archives</link>
    <description>Research threads, field notes, source records, media embeds, and public records organized for review.</description>
    <language>en-us</language>
    <copyright>HOT AND FRESH</copyright>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <image>
      <title>HOT AND FRESH</title>
      <url>${baseUrl}/logo.png</url>
      <link>${baseUrl}</link>
    </image>
    ${items}
  </channel>
</rss>`

    return new Response(rss, {
      headers: {
        "Content-Type": "application/rss+xml; charset=utf-8",
        "Cache-Control": "public, max-age=3600",
      },
    })
  } catch (error) {
    console.error("[v0] RSS generation error:", error)
    return new Response("Error generating RSS feed", {
      status: 500,
      headers: {
        "Content-Type": "text/plain",
      },
    })
  }
}
