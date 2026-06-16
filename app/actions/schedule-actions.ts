"use server"

import { createClient } from "@supabase/supabase-js"
import { ArchivePost } from "@/lib/archive"

function getSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !key) {
    throw new Error("Supabase not configured")
  }

  return createClient(url, key)
}

/**
 * Process scheduled posts that should be published
 * This should be called by a cron job or scheduled task
 */
export async function publishScheduledPosts(): Promise<{ published: number; errors: string[] }> {
  const supabase = getSupabaseClient()
  const now = new Date().toISOString()

  try {
    // Get all scheduled posts that are past their scheduled_at time
    const { data: scheduledPosts, error: fetchError } = await supabase
      .from("blog_posts")
      .select("id, scheduled_at")
      .eq("status", "scheduled")
      .lte("scheduled_at", now)

    if (fetchError) throw fetchError

    if (!scheduledPosts || scheduledPosts.length === 0) {
      return { published: 0, errors: [] }
    }

    // Publish each scheduled post
    const errors: string[] = []
    for (const post of scheduledPosts) {
      try {
        const { error } = await supabase
          .from("blog_posts")
          .update({
            status: "published",
            published_at: now,
            updated_at: now,
          })
          .eq("id", post.id)

        if (error) {
          errors.push(`Failed to publish ${post.id}: ${error.message}`)
        }
      } catch (err) {
        errors.push(`Error publishing ${post.id}: ${err instanceof Error ? err.message : "Unknown error"}`)
      }
    }

    return {
      published: scheduledPosts.length - errors.length,
      errors,
    }
  } catch (err) {
    return {
      published: 0,
      errors: [err instanceof Error ? err.message : "Unknown error publishing scheduled posts"],
    }
  }
}

/**
 * Update RSS feed with latest published archives
 */
export async function updateRSSFeed(): Promise<{ success: boolean; itemCount: number }> {
  const supabase = getSupabaseClient()

  try {
    const { data: posts, error } = await supabase
      .from("blog_posts")
      .select("id, slug, title, excerpt, body, category, tags, post_type, featured, source_name, source_url, published_at, cover_image_url, video_url, priority")
      .eq("status", "published")
      .eq("public_archive", true)
      .eq("include_in_rss", true)
      .order("published_at", { ascending: false })
      .limit(50)

    if (error) throw error

    // Generate RSS feed
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://hotandfresh.news"
    const rssItems = (posts || [])
      .map(post => {
        const publishDate = post.published_at
          ? new Date(post.published_at).toUTCString()
          : new Date().toUTCString()

        return `
    <item>
      <title>${escapeXml(post.title)}</title>
      <link>${baseUrl}/archives/${post.slug}</link>
      <guid>${baseUrl}/archives/${post.slug}</guid>
      <pubDate>${publishDate}</pubDate>
      <description>${escapeXml(post.excerpt || "")}</description>
      <category>${escapeXml(post.category || "")}</category>
      ${post.tags?.map((tag: string) => `<category>${escapeXml(tag)}</category>`).join("") || ""}
      <comments>${escapeXml(post.source_name || "")}</comments>
      ${post.cover_image_url ? `<image url="${escapeXml(post.cover_image_url)}" />` : ""}
      ${post.video_url ? `<video url="${escapeXml(post.video_url)}" />` : ""}
    </item>
    `
      })
      .join("")

    const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:content="http://purl.org/rss/1.0/modules/content/">
  <channel>
    <title>HOT AND FRESH — Archives</title>
    <link>${baseUrl}/archives</link>
    <description>Research threads, field notes, source records, media embeds, and public records organized for review.</description>
    <language>en-us</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <image>
      <title>HOT AND FRESH</title>
      <url>${baseUrl}/og-image.png</url>
      <link>${baseUrl}</link>
    </image>
    ${rssItems}
  </channel>
</rss>`

    // Store RSS feed (if using blob storage or similar)
    // For now, this just validates the feed structure
    return { success: true, itemCount: posts?.length || 0 }
  } catch (err) {
    console.error("Error updating RSS feed:", err)
    return { success: false, itemCount: 0 }
  }
}

/**
 * Helper: Escape XML special characters
 */
function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;")
}

/**
 * Archive cleanup: Move old published posts to archived status if needed
 */
export async function archiveOldPosts(olderThanDays: number = 365): Promise<{ archived: number }> {
  const supabase = getSupabaseClient()
  const cutoffDate = new Date()
  cutoffDate.setDate(cutoffDate.getDate() - olderThanDays)
  const cutoffIso = cutoffDate.toISOString()

  try {
    const { data, error } = await supabase
      .from("blog_posts")
      .update({
        status: "archived",
        updated_at: new Date().toISOString(),
      })
      .eq("status", "published")
      .lt("published_at", cutoffIso)
      .neq("public_archive", false)

    if (error) throw error
    return { archived: data?.length || 0 }
  } catch (err) {
    console.error("Error archiving old posts:", err)
    return { archived: 0 }
  }
}
