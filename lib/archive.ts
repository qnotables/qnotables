import { createClient } from "@supabase/supabase-js"

// Format date for display
export function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })
}

// Extended archive post types
export interface ArchivePost {
  id: string
  slug: string
  title: string
  subtitle?: string
  excerpt: string
  body: string
  category?: string
  tags?: string[]
  post_type: "Research Thread" | "Source Archive" | "Document Drop" | "Video Archive" | "Show Notes" | "Timeline Entry" | "Field Note" | "News Brief" | "Explainer" | "Media Clip" | "External Link" | "Public Record"
  status: "draft" | "published" | "scheduled" | "hidden" | "archived"
  priority: "low" | "medium" | "high" | "critical"
  featured: boolean
  source_name?: string
  source_url?: string
  source_author?: string
  original_publish_date?: string
  published_at?: string
  imported_at?: string
  updated_at?: string
  cover_image_url?: string
  og_image_url?: string
  media_type: "none" | "image" | "video" | "iframe" | "document" | "audio" | "external_link"
  video_url?: string
  embed_url?: string
  iframe_url?: string
  document_url?: string
  related_links?: { title: string; url: string }[]
  timeline_date?: string
  show_title?: string
  episode_date?: string
  seo_title?: string
  seo_description?: string
  include_in_rss: boolean
  public_archive: boolean
  scheduled_at?: string
  created_at: string
}

export interface ArchiveMedia {
  id: string
  filename: string
  original_name: string
  media_type: "image" | "document" | "video" | "audio"
  file_size: number
  mime_type: string
  storage_path: string
  alt_text?: string
  created_at: string
  updated_at: string
}

export interface ArchiveEmbed {
  id: string
  post_id: string
  provider: "youtube" | "rumble" | "vimeo" | "odysee" | "archive_org" | "google_docs"
  embed_url: string
  embed_code?: string
  title?: string
  thumbnail_url?: string
  created_at: string
}

function getSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !key) {
    throw new Error("Supabase credentials not configured")
  }

  return createClient(url, key)
}

// Get all published archives
export async function getAllArchives(): Promise<ArchivePost[]> {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase
    .from("blog_posts")
    .select("*")
    .eq("status", "published")
    .order("published_at", { ascending: false })

  if (error) throw new Error(`Failed to fetch archives: ${error.message}`)
  return (data || []) as ArchivePost[]
}

// Get archives by post type
export async function getArchivesByType(postType: string): Promise<ArchivePost[]> {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase
    .from("blog_posts")
    .select("*")
    .eq("status", "published")
    .eq("post_type", postType)
    .order("published_at", { ascending: false })

  if (error) throw new Error(`Failed to fetch archives by type: ${error.message}`)
  return (data || []) as ArchivePost[]
}

// Get archives by media type
export async function getArchivesByMediaType(mediaType: string): Promise<ArchivePost[]> {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase
    .from("blog_posts")
    .select("*")
    .eq("status", "published")
    .eq("media_type", mediaType)
    .order("published_at", { ascending: false })

  if (error) throw new Error(`Failed to fetch archives by media: ${error.message}`)
  return (data || []) as ArchivePost[]
}

// Get featured archives
export async function getFeaturedArchives(limit = 6): Promise<ArchivePost[]> {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase
    .from("blog_posts")
    .select("*")
    .eq("status", "published")
    .eq("featured", true)
    .order("published_at", { ascending: false })
    .limit(limit)

  if (error) throw new Error(`Failed to fetch featured archives: ${error.message}`)
  return (data || []) as ArchivePost[]
}

// Get archive by slug
export async function getArchiveBySlug(slug: string): Promise<ArchivePost | null> {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase
    .from("blog_posts")
    .select("*")
    .eq("slug", slug)
    .eq("status", "published")
    .single()

  if (error && error.code !== "PGRST116") throw error
  return (data || null) as ArchivePost | null
}

// Get archives by timeline date range
export async function getArchivesByTimeline(startDate: string, endDate: string): Promise<ArchivePost[]> {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase
    .from("blog_posts")
    .select("*")
    .eq("status", "published")
    .gte("timeline_date", startDate)
    .lte("timeline_date", endDate)
    .order("timeline_date", { ascending: false })

  if (error) throw new Error(`Failed to fetch timeline archives: ${error.message}`)
  return (data || []) as ArchivePost[]
}

// Get all videos
export async function getArchiveVideos(limit = 50): Promise<ArchivePost[]> {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase
    .from("blog_posts")
    .select("*")
    .eq("status", "published")
    .in("media_type", ["video", "iframe"])
    .order("published_at", { ascending: false })
    .limit(limit)

  if (error) throw new Error(`Failed to fetch videos: ${error.message}`)
  return (data || []) as ArchivePost[]
}

// Get all documents
export async function getArchiveDocuments(limit = 50): Promise<ArchivePost[]> {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase
    .from("blog_posts")
    .select("*")
    .eq("status", "published")
    .in("media_type", ["document", "external_link"])
    .order("published_at", { ascending: false })
    .limit(limit)

  if (error) throw new Error(`Failed to fetch documents: ${error.message}`)
  return (data || []) as ArchivePost[]
}

// Search archives
export async function searchArchives(query: string, limit = 20): Promise<ArchivePost[]> {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase
    .from("blog_posts")
    .select("*")
    .eq("status", "published")
    .or(`title.ilike.%${query}%,excerpt.ilike.%${query}%,body.ilike.%${query}%,tag.ilike.%${query}%`)
    .order("published_at", { ascending: false })
    .limit(limit)

  if (error) throw new Error(`Failed to search archives: ${error.message}`)
  return (data || []) as ArchivePost[]
}

// Get archives admin view (includes drafts, scheduled, etc)
export async function getArchivesAdmin(): Promise<ArchivePost[]> {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase
    .from("blog_posts")
    .select("*")
    .order("created_at", { ascending: false })

  if (error) throw new Error(`Failed to fetch admin archives: ${error.message}`)
  return (data || []) as ArchivePost[]
}

// Get archive by ID for admin editing
export async function getArchiveForEdit(id: string): Promise<ArchivePost | null> {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase
    .from("blog_posts")
    .select("*")
    .eq("id", id)
    .single()

  if (error && error.code !== "PGRST116") throw error
  return (data || null) as ArchivePost | null
}

// Get media by type
export async function getMediaByType(mediaType: string): Promise<ArchiveMedia[]> {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase
    .from("archive_media")
    .select("*")
    .eq("media_type", mediaType)
    .order("created_at", { ascending: false })

  if (error) throw new Error(`Failed to fetch media: ${error.message}`)
  return (data || []) as ArchiveMedia[]
}

// Helper: Generate archive statistics
export async function getArchiveStats() {
  const supabase = getSupabaseClient()
  const [publishedCount, mediaCount, mediaSize] = await Promise.all([
    supabase.from("blog_posts").select("id", { count: "exact", head: true }).eq("status", "published").then(r => r.count || 0),
    supabase.from("archive_media").select("id", { count: "exact", head: true }).then(r => r.count || 0),
    supabase.from("archive_media").select("file_size").then(r => {
      if (r.data) return r.data.reduce((sum: number, m: any) => sum + (m.file_size || 0), 0)
      return 0
    }),
  ])

  return {
    total_published: publishedCount,
    total_videos: 0,
    total_documents: 0,
    total_media_files: mediaCount,
    total_storage_bytes: mediaSize as number,
  }
}
