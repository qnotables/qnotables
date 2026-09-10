"use server"

import { createClient as createServiceClient } from "@supabase/supabase-js"
import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"

const COMMENT_SELECT = "id, post_id, parent_comment_id, author_id, author_name, body, created_at, updated_at, is_deleted"
const MAX_COMMENT_LENGTH = 1000

// Service-role client for reads (bypasses RLS — safe for SELECTs only)
function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) throw new Error("Supabase configuration missing")
  return createServiceClient(url, key)
}

export interface BlogComment {
  id: string
  post_id: string
  parent_comment_id: string | null
  author_id: string | null
  author_name: string
  body: string
  created_at: string
  updated_at: string
  is_deleted: boolean
}

/**
 * Create a new blog comment — requires an authenticated session.
 * Uses the SSR client so RLS enforces auth.uid() = author_id.
 */
export async function createBlogComment(
  postId: string,
  body: string,
  parentCommentId?: string | null,
): Promise<{ success: boolean; comment?: BlogComment; error?: string }> {
  try {
    const trimmedBody = body?.trim() ?? ""
    if (!postId || !trimmedBody) {
      return { success: false, error: "Missing required fields" }
    }
    if (trimmedBody.length < 2) {
      return { success: false, error: "Comment must be at least 2 characters" }
    }
    if (trimmedBody.length > MAX_COMMENT_LENGTH) {
      return { success: false, error: `Comment must be ${MAX_COMMENT_LENGTH} characters or fewer` }
    }

    // Get session user
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { success: false, error: "You must be logged in to comment" }
    }

    // Fetch display name from profiles
    const { data: profile } = await supabase
      .from("profiles")
      .select("display_name, username")
      .eq("id", user.id)
      .single()

    const authorName =
      profile?.display_name ||
      profile?.username ||
      user.email?.split("@")[0] ||
      "Anonymous"

    const service = getServiceClient()
    const { data: post, error: postError } = await service
      .from("blog_posts")
      .select("id")
      .eq("id", postId)
      .eq("status", "published")
      .maybeSingle()

    if (postError || !post) {
      return { success: false, error: "This record is no longer available for comments" }
    }

    if (parentCommentId) {
      const { data: parent, error: parentError } = await service
        .from("blog_comments")
        .select("id, post_id, is_deleted")
        .eq("id", parentCommentId)
        .maybeSingle()

      if (parentError || !parent || parent.is_deleted || parent.post_id !== postId) {
        return { success: false, error: "That comment is not available for replies" }
      }
    }

    const { data, error } = await supabase
      .from("blog_comments")
      .insert([{
        post_id: postId,
        parent_comment_id: parentCommentId || null,
        author_id: user.id,
        author_name: authorName,
        body: trimmedBody,
        is_deleted: false,
      }])
      .select(COMMENT_SELECT)
      .single()

    if (error) {
      console.error("[v0] Blog comment creation error:", error)
      return { success: false, error: "Failed to post comment" }
    }

    revalidatePath("/archives", "layout")
    return { success: true, comment: data as BlogComment }
  } catch (err) {
    console.error("[v0] Blog comment action error:", err)
    return { success: false, error: "An error occurred while creating the comment" }
  }
}

/**
 * Get all comments for a blog post (including nested replies)
 */
export async function getBlogComments(postId: string): Promise<BlogComment[]> {
  try {
    const { data, error } = await getServiceClient()
      .from("blog_comments")
      .select(COMMENT_SELECT)
      .eq("post_id", postId)
      .eq("is_deleted", false)
      .order("created_at", { ascending: true })

    if (error) {
      console.error("[v0] Blog comments fetch error:", error)
      return []
    }

    return (data || []) as BlogComment[]
  } catch (err) {
    console.error("[v0] Blog comments action error:", err)
    return []
  }
}

/**
 * Update a blog comment (only body text)
 */
export async function updateBlogComment(
  commentId: string,
  newBody: string,
  authorId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const trimmedBody = newBody?.trim() ?? ""
    if (!trimmedBody || trimmedBody.length < 2 || trimmedBody.length > MAX_COMMENT_LENGTH) {
      return { success: false, error: "Comment must be between 2 and 1000 characters" }
    }

    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user || user.id !== authorId) {
      return { success: false, error: "You can only edit your own comments" }
    }

    const { error } = await supabase
      .from("blog_comments")
      .update({
        body: trimmedBody,
        updated_at: new Date().toISOString(),
      })
      .eq("id", commentId)
      .eq("author_id", user.id)

    if (error) {
      console.error("[v0] Blog comment update error:", error)
      return { success: false, error: "Failed to update comment" }
    }

    revalidatePath("/archives", "layout")
    return { success: true }
  } catch (err) {
    console.error("[v0] Blog comment update action error:", err)
    return { success: false, error: "An error occurred while updating the comment" }
  }
}

/**
 * Soft-delete a comment — user session is used so RLS ensures ownership.
 */
export async function deleteBlogComment(
  commentId: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { success: false, error: "You must be logged in to delete a comment" }
    }

    // RLS policy "comments_update_own" enforces auth.uid() = author_id
    const { error } = await supabase
      .from("blog_comments")
      .update({ is_deleted: true, updated_at: new Date().toISOString() })
      .eq("id", commentId)
      .eq("author_id", user.id)

    if (error) {
      console.error("[v0] Blog comment delete error:", error)
      return { success: false, error: "Failed to delete comment" }
    }

    revalidatePath("/archives", "layout")
    return { success: true }
  } catch (err) {
    console.error("[v0] Blog comment delete action error:", err)
    return { success: false, error: "An error occurred while deleting the comment" }
  }
}
