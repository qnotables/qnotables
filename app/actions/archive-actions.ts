"use server"

import { createClient } from "@supabase/supabase-js"
import { ArchivePost } from "@/lib/archive"
import { generateSlug } from "@/lib/slug-utils"

function getSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !key) {
    throw new Error("Supabase not configured")
  }

  return createClient(url, key)
}

// Check if slug exists
export async function checkSlugExists(slug: string, excludeId?: string): Promise<boolean> {
  const supabase = getSupabaseClient()
  let query = supabase.from("blog_posts").select("id").eq("slug", slug)

  if (excludeId) {
    query = query.neq("id", excludeId)
  }

  const { data, error } = await query.limit(1)

  if (error) throw error
  return (data?.length || 0) > 0
}

// Create or update archive post
export async function saveArchivePost(post: Partial<ArchivePost> & { id?: string }): Promise<ArchivePost> {
  const supabase = getSupabaseClient()

  // Validate required fields
  if (!post.title || post.title.length < 3) {
    throw new Error("Title must be at least 3 characters")
  }

  if (!post.body || post.body.length < 10) {
    throw new Error("Body must be at least 10 characters")
  }

  // Generate or validate slug
  let slug = post.slug || generateSlug(post.title)
  const slugExists = await checkSlugExists(slug, post.id)
  if (slugExists) {
    let counter = 1
    while (await checkSlugExists(`${slug}-${counter}`, post.id)) {
      counter++
    }
    slug = `${slug}-${counter}`
  }

  const now = new Date().toISOString()
  const postData = {
    title: post.title,
    slug,
    subtitle: post.subtitle || null,
    excerpt: post.excerpt || post.body.substring(0, 200),
    body: post.body,
    category: post.category || null,
    tags: post.tags || [],
    post_type: post.post_type || "Research Thread",
    status: post.status || "draft",
    priority: post.priority || "medium",
    featured: post.featured || false,
    source_name: post.source_name || null,
    source_url: post.source_url || null,
    source_author: post.source_author || null,
    original_publish_date: post.original_publish_date || null,
    published_at: post.published_at || (post.status === "published" ? now : null),
    scheduled_at: post.scheduled_at || null,
    updated_at: now,
    cover_image_url: post.cover_image_url || null,
    og_image_url: post.og_image_url || null,
    media_type: post.media_type || "none",
    video_url: post.video_url || null,
    embed_url: post.embed_url || null,
    iframe_url: post.iframe_url || null,
    document_url: post.document_url || null,
    related_links: post.related_links || [],
    timeline_date: post.timeline_date || null,
    show_title: post.show_title || null,
    episode_date: post.episode_date || null,
    seo_title: post.seo_title || post.title,
    seo_description: post.seo_description || post.excerpt,
    include_in_rss: post.include_in_rss !== false,
    public_archive: post.public_archive !== false,
    imported_at: post.imported_at || null,
  }

  if (post.id) {
    // Update existing
    const { data, error } = await supabase
      .from("blog_posts")
      .update(postData)
      .eq("id", post.id)
      .select()
      .single()

    if (error) throw new Error(`Failed to update archive: ${error.message}`)
    return data as ArchivePost
  } else {
    // Create new
    const { data, error } = await supabase
      .from("blog_posts")
      .insert([{ ...postData, created_at: now }])
      .select()
      .single()

    if (error) throw new Error(`Failed to create archive: ${error.message}`)
    return data as ArchivePost
  }
}

// Publish archive post
export async function publishArchivePost(id: string): Promise<ArchivePost> {
  const supabase = getSupabaseClient()
  const now = new Date().toISOString()

  const { data, error } = await supabase
    .from("blog_posts")
    .update({
      status: "published",
      published_at: now,
      updated_at: now,
    })
    .eq("id", id)
    .select()
    .single()

  if (error) throw new Error(`Failed to publish: ${error.message}`)
  return data as ArchivePost
}

// Schedule archive post
export async function scheduleArchivePost(id: string, scheduledAt: string): Promise<ArchivePost> {
  const supabase = getSupabaseClient()
  const now = new Date().toISOString()

  const { data, error } = await supabase
    .from("blog_posts")
    .update({
      status: "scheduled",
      scheduled_at: scheduledAt,
      updated_at: now,
    })
    .eq("id", id)
    .select()
    .single()

  if (error) throw new Error(`Failed to schedule: ${error.message}`)
  return data as ArchivePost
}

// Archive post
export async function archiveArchivePost(id: string): Promise<ArchivePost> {
  const supabase = getSupabaseClient()
  const now = new Date().toISOString()

  const { data, error } = await supabase
    .from("blog_posts")
    .update({
      status: "archived",
      updated_at: now,
    })
    .eq("id", id)
    .select()
    .single()

  if (error) throw new Error(`Failed to archive: ${error.message}`)
  return data as ArchivePost
}

// Delete archive post
export async function deleteArchivePost(id: string): Promise<void> {
  const supabase = getSupabaseClient()

  const { error } = await supabase
    .from("blog_posts")
    .delete()
    .eq("id", id)

  if (error) throw new Error(`Failed to delete: ${error.message}`)
}

// Toggle featured
export async function toggleArchiveFeatured(id: string, featured: boolean): Promise<ArchivePost> {
  const supabase = getSupabaseClient()
  const now = new Date().toISOString()

  const { data, error } = await supabase
    .from("blog_posts")
    .update({
      featured,
      updated_at: now,
    })
    .eq("id", id)
    .select()
    .single()

  if (error) throw new Error(`Failed to update featured: ${error.message}`)
  return data as ArchivePost
}

// Duplicate archive post
export async function duplicateArchivePost(id: string): Promise<ArchivePost> {
  const supabase = getSupabaseClient()
  const post = await supabase.from("blog_posts").select("*").eq("id", id).single()

  if (post.error) throw new Error(`Failed to fetch post: ${post.error.message}`)

  const original = post.data as ArchivePost
  const newSlug = `${original.slug}-copy`
  const now = new Date().toISOString()

  const { data, error } = await supabase
    .from("blog_posts")
    .insert([
      {
        ...original,
        id: undefined,
        slug: newSlug,
        status: "draft",
        published_at: null,
        created_at: now,
        updated_at: now,
      },
    ])
    .select()
    .single()

  if (error) throw new Error(`Failed to duplicate: ${error.message}`)
  return data as ArchivePost
}

// Batch update status
export async function batchUpdateStatus(ids: string[], status: string): Promise<void> {
  const supabase = getSupabaseClient()
  const now = new Date().toISOString()

  const { error } = await supabase
    .from("blog_posts")
    .update({ status, updated_at: now })
    .in("id", ids)

  if (error) throw new Error(`Failed to batch update: ${error.message}`)
}

// Search and filter
export async function searchArchivesByQuery(
  query: string,
  filters?: {
    status?: string
    category?: string
    tags?: string[]
    postType?: string
    mediaType?: string
    featured?: boolean
  },
  limit = 20
): Promise<ArchivePost[]> {
  const supabase = getSupabaseClient()

  let queryBuilder = supabase
    .from("blog_posts")
    .select("*")
    .order("published_at", { ascending: false })

  // Apply filters
  if (filters?.status) {
    queryBuilder = queryBuilder.eq("status", filters.status)
  }

  if (filters?.category) {
    queryBuilder = queryBuilder.eq("category", filters.category)
  }

  if (filters?.postType) {
    queryBuilder = queryBuilder.eq("post_type", filters.postType)
  }

  if (filters?.mediaType) {
    queryBuilder = queryBuilder.eq("media_type", filters.mediaType)
  }

  if (filters?.featured !== undefined) {
    queryBuilder = queryBuilder.eq("featured", filters.featured)
  }

  // Search query
  if (query) {
    queryBuilder = queryBuilder.or(
      `title.ilike.%${query}%,excerpt.ilike.%${query}%,body.ilike.%${query}%,tags.ilike.%${query}%`
    )
  }

  const { data, error } = await queryBuilder.limit(limit)

  if (error) throw new Error(`Search failed: ${error.message}`)
  return (data || []) as ArchivePost[]
}
