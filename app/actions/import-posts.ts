"use server"

import { createAdminClient } from "@/lib/supabase/admin"
import { createClient } from "@/lib/supabase/server"
import { isAdminEmail } from "@/lib/admin"
import { generateSlug, deduplicateSlug } from "@/lib/import-utils"

export interface ImportPostInput {
  title: string
  excerpt: string
  author: string
  content: string
  tag?: string
  category?: string
  publishedAt?: string
  sourceUrl?: string
  sourceName?: string
  coverImage?: string
}

export interface ImportResult {
  success: boolean
  slug?: string
  id?: string
  error?: string
}

/**
 * Import a batch of posts to the database.
 * Validates each post, generates slugs with deduplication, and inserts into blog_posts table.
 */
export async function importPosts(posts: ImportPostInput[]): Promise<ImportResult[]> {
  // Auth check
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return [{ success: false, error: "Not authenticated" }]
  }

  if (!isAdminEmail(user.email)) {
    return [{ success: false, error: "Unauthorized: admin only" }]
  }

  const results: ImportResult[] = []
  const admin = createAdminClient()

  // Get existing slugs to avoid collisions
  const { data: existingPosts } = await admin
    .from("blog_posts")
    .select("slug")

  const existingSlugs = new Set((existingPosts || []).map((p: any) => p.slug))

  // Import each post
  for (const post of posts) {
    try {
      // Validate required fields
      if (!post.title?.trim() || !post.content?.trim()) {
        results.push({
          success: false,
          error: `Invalid post: missing title or content`,
        })
        continue
      }

      // Generate slug with deduplication
      const baseSlug = generateSlug(post.title)
      const slug = deduplicateSlug(baseSlug, existingSlugs)
      existingSlugs.add(slug)

      // Parse published_at date
      const publishedAt = post.publishedAt
        ? new Date(post.publishedAt).toISOString()
        : new Date().toISOString()

      // Insert into database
      const { data: inserted, error } = await admin
        .from("blog_posts")
        .insert({
          slug,
          title: post.title.trim(),
          excerpt: post.excerpt?.trim() || "",
          body: post.content,
          author_name: post.author || "HOT AND FRESH",
          tag: post.tag || "News",
          category: post.category || "General",
          read_minutes: Math.ceil(post.content.split(/\s+/).length / 200),
          published: true,
          status: "published",
          published_at: publishedAt,
          source_name: post.sourceName,
          source_url: post.sourceUrl,
          cover_image: post.coverImage || null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select("id")
        .single()

      if (error) {
        results.push({
          success: false,
          error: `Failed to insert: ${error.message}`,
        })
        continue
      }

      results.push({
        success: true,
        slug,
        id: inserted?.id,
      })
    } catch (err) {
      results.push({
        success: false,
        error: `Exception: ${err instanceof Error ? err.message : String(err)}`,
      })
    }
  }

  return results
}

/**
 * Delete a post by ID (admin only)
 */
export async function deletePost(id: string): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { success: false, error: "Not authenticated" }
  if (!isAdminEmail(user.email)) return { success: false, error: "Unauthorized" }

  const admin = createAdminClient()
  const { error } = await admin.from("blog_posts").delete().eq("id", id)

  if (error) return { success: false, error: error.message }
  return { success: true }
}

/**
 * Update a post (admin only)
 */
export async function updatePost(
  id: string,
  updates: Partial<ImportPostInput>,
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { success: false, error: "Not authenticated" }
  if (!isAdminEmail(user.email)) return { success: false, error: "Unauthorized" }

  const admin = createAdminClient()
  
  const dbUpdates: Record<string, any> = {}
  if (updates.title) dbUpdates.title = updates.title
  if (updates.excerpt) dbUpdates.excerpt = updates.excerpt
  if (updates.content) dbUpdates.body = updates.content
  if (updates.author) dbUpdates.author_name = updates.author
  if (updates.tag) dbUpdates.tag = updates.tag
  if (updates.category) dbUpdates.category = updates.category
  if (updates.publishedAt) dbUpdates.published_at = new Date(updates.publishedAt).toISOString()
  if (updates.sourceUrl) dbUpdates.source_url = updates.sourceUrl
  if (updates.sourceName) dbUpdates.source_name = updates.sourceName
  if (updates.coverImage !== undefined) dbUpdates.cover_image = updates.coverImage
  dbUpdates.updated_at = new Date().toISOString()

  const { error } = await admin.from("blog_posts").update(dbUpdates).eq("id", id)

  if (error) return { success: false, error: error.message }
  return { success: true }
}
