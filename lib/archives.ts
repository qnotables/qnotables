import { createClient } from "@/lib/supabase/server"
import { BlogPost, BlogRow, rowToPost } from "./blog-posts"

/** Get all published categories */
export async function getCategories(): Promise<string[]> {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from("blog_posts")
      .select("category")
      .eq("status", "published")
      .not("category", "is", null)

    if (error) throw error

    const unique = [...new Set((data as { category: string }[]).map((d) => d.category))]
    return unique.filter(Boolean).sort()
  } catch (err) {
    console.error("[v0] getCategories error", err)
    return []
  }
}

/** Get all published tags */
export async function getTags(): Promise<string[]> {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from("blog_post_tags")
      .select("tag")

    if (error) throw error

    const unique = [...new Set((data as { tag: string }[]).map((d) => d.tag))]
    return unique.filter(Boolean).sort()
  } catch (err) {
    console.error("[v0] getTags error", err)
    return []
  }
}

/** Get posts by category */
export async function getPostsByCategory(category: string): Promise<BlogPost[]> {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from("blog_posts")
      .select(
        "id, slug, title, subtitle, excerpt, cover_image, body, author_name, tag, category, post_type, read_minutes, published, status, featured, source_url, source_name, created_at, published_at, updated_at, blog_post_tags(tag)",
      )
      .eq("status", "published")
      .eq("category", category)
      .order("published_at", { ascending: false, nullsFirst: false })

    if (error) throw error

    return (data as BlogRow[]).map(rowToPost)
  } catch (err) {
    console.error("[v0] getPostsByCategory error", err)
    return []
  }
}

/** Get posts by tag */
export async function getPostsByTag(tag: string): Promise<BlogPost[]> {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from("blog_post_tags")
      .select(
        "blog_posts(id, slug, title, subtitle, excerpt, cover_image, body, author_name, tag, category, post_type, read_minutes, published, status, featured, source_url, source_name, created_at, published_at, updated_at, blog_post_tags(tag))",
      )
      .eq("tag", tag)

    if (error) throw error

    const posts = (data as any[])
      .map((d) => d.blog_posts)
      .filter((p) => p && p.status === "published")

    return posts.map(rowToPost).sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    )
  } catch (err) {
    console.error("[v0] getPostsByTag error", err)
    return []
  }
}

/** Get posts by year/month for archive */
export async function getPostsByDate(year: number, month?: number): Promise<BlogPost[]> {
  try {
    const supabase = await createClient()

    let query = supabase
      .from("blog_posts")
      .select(
        "id, slug, title, subtitle, excerpt, cover_image, body, author_name, tag, category, post_type, read_minutes, published, status, featured, source_url, source_name, created_at, published_at, updated_at, blog_post_tags(tag)",
      )
      .eq("status", "published")

    // Filter by year/month
    const startDate = new Date(year, month ? month - 1 : 0, 1).toISOString()
    const endDate = month 
      ? new Date(year, month, 0, 23, 59, 59).toISOString()
      : new Date(year + 1, 0, 0).toISOString()

    query = query
      .gte("published_at", startDate)
      .lt("published_at", endDate)
      .order("published_at", { ascending: false })

    const { data, error } = await query

    if (error) throw error

    return (data as BlogRow[]).map(rowToPost)
  } catch (err) {
    console.error("[v0] getPostsByDate error", err)
    return []
  }
}

/** Get featured posts */
export async function getFeaturedPosts(): Promise<BlogPost[]> {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from("blog_posts")
      .select(
        "id, slug, title, subtitle, excerpt, cover_image, body, author_name, tag, category, post_type, read_minutes, published, status, featured, source_url, source_name, created_at, published_at, updated_at, blog_post_tags(tag)",
      )
      .eq("status", "published")
      .eq("featured", true)
      .order("published_at", { ascending: false })
      .limit(5)

    if (error) throw error

    return (data as BlogRow[]).map(rowToPost)
  } catch (err) {
    console.error("[v0] getFeaturedPosts error", err)
    return []
  }
}

/** Get related posts (same category or tags) */
export async function getRelatedPosts(postId: string, limit = 3): Promise<BlogPost[]> {
  try {
    const supabase = await createClient()

    // Get the current post to find its category and tags
    const { data: currentPost, error: postErr } = await supabase
      .from("blog_posts")
      .select("category, blog_post_tags(tag)")
      .eq("id", postId)
      .maybeSingle()

    if (postErr || !currentPost) throw postErr

    const category = currentPost.category
    const postTags = currentPost.blog_post_tags?.map((t: any) => t.tag) || []

    // Find posts with same category or tags
    let query = supabase
      .from("blog_posts")
      .select(
        "id, slug, title, subtitle, excerpt, cover_image, body, author_name, tag, category, post_type, read_minutes, published, status, featured, source_url, source_name, created_at, published_at, updated_at, blog_post_tags(tag)",
      )
      .eq("status", "published")
      .neq("id", postId)

    if (category) {
      query = query.eq("category", category)
    }

    const { data, error } = await query.limit(limit)

    if (error) throw error

    return (data as BlogRow[]).map(rowToPost)
  } catch (err) {
    console.error("[v0] getRelatedPosts error", err)
    return []
  }
}
