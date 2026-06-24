"use server"

import { createClient } from "@/lib/supabase/server"
import { isValidUrl } from "@/lib/bookmarks"

export interface Bookmark {
  id: string
  title: string
  url: string
  description?: string
  category?: string
  submitted_by_id?: string
  submitted_by_name?: string
  is_approved: boolean
  created_at: string
  updated_at: string
}

/**
 * Submit a new bookmark for approval
 */
export async function submitBookmark(
  title: string,
  url: string,
  description: string | null,
  category: string | null,
): Promise<{ success: boolean; error?: string; bookmark?: Bookmark }> {
  try {
    // Validate inputs
    if (!title || title.trim().length < 3) {
      return { success: false, error: "Title must be at least 3 characters" }
    }

    if (!url || !isValidUrl(url)) {
      return { success: false, error: "Please enter a valid HTTP/HTTPS URL" }
    }

    if (description && description.length > 500) {
      return { success: false, error: "Description must be less than 500 characters" }
    }

    // Get current user
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: "You must be signed in to submit a bookmark" }
    }

    // Insert bookmark
    const { data, error } = await supabase
      .from("bookmarks")
      .insert({
        title: title.trim(),
        url: url.trim(),
        description: description ? description.trim() : null,
        category: category ? category.trim() : null,
        submitted_by_id: user.id,
        submitted_by_name: user.user_metadata?.display_name || user.user_metadata?.name || user.user_metadata?.full_name || "Anonymous",
        is_approved: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) {
      console.error("[v0] Bookmark insert error:", error)
      return { success: false, error: "Failed to submit bookmark" }
    }

    return { success: true, bookmark: data }
  } catch (err) {
    console.error("[v0] Submit bookmark error:", err)
    return { success: false, error: "An unexpected error occurred" }
  }
}

/**
 * Get all approved bookmarks, optionally filtered by category
 */
export async function getApprovedBookmarks(category?: string): Promise<Bookmark[]> {
  try {
    const supabase = await createClient()

    let query = supabase.from("bookmarks").select("*").eq("is_approved", true)

    if (category) {
      query = query.eq("category", category)
    }

    const { data, error } = await query.order("created_at", { ascending: false })

    if (error) {
      console.error("[v0] Get bookmarks error:", error)
      return []
    }

    return data || []
  } catch (err) {
    console.error("[v0] Get bookmarks error:", err)
    return []
  }
}

/**
 * Get user's own bookmarks
 */
export async function getUserBookmarks(): Promise<Bookmark[]> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return []
    }

    const { data, error } = await supabase
      .from("bookmarks")
      .select("*")
      .eq("submitted_by_id", user.id)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("[v0] Get user bookmarks error:", error)
      return []
    }

    return data || []
  } catch (err) {
    console.error("[v0] Get user bookmarks error:", err)
    return []
  }
}

/**
 * Delete a bookmark (user can delete own, admin can delete any)
 */
export async function deleteBookmark(bookmarkId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: "You must be signed in" }
    }

    // Get the bookmark to check ownership
    const { data: bookmark, error: fetchError } = await supabase
      .from("bookmarks")
      .select("*")
      .eq("id", bookmarkId)
      .single()

    if (fetchError || !bookmark) {
      return { success: false, error: "Bookmark not found" }
    }

    // Check if user is owner or admin
    if (bookmark.submitted_by_id !== user.id) {
      // Check if user is admin
      const isAdmin = await checkIsAdmin()
      if (!isAdmin) {
        return { success: false, error: "You can only delete your own bookmarks" }
      }
    }

    // Delete the bookmark
    const { error: deleteError } = await supabase.from("bookmarks").delete().eq("id", bookmarkId)

    if (deleteError) {
      console.error("[v0] Delete bookmark error:", deleteError)
      return { success: false, error: "Failed to delete bookmark" }
    }

    return { success: true }
  } catch (err) {
    console.error("[v0] Delete bookmark error:", err)
    return { success: false, error: "An unexpected error occurred" }
  }
}

/**
 * Check if current user is admin
 */
async function checkIsAdmin(): Promise<boolean> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return false
    }

    // Check if user is in admin list (stored in user metadata or a separate admin table)
    // For now, check user_metadata.role
    const role = user.user_metadata?.role
    return role === "admin"
  } catch {
    return false
  }
}

/**
 * Approve a bookmark (admin only)
 */
export async function approveBookmark(bookmarkId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const isAdmin = await checkIsAdmin()
    if (!isAdmin) {
      return { success: false, error: "Only admins can approve bookmarks" }
    }

    const supabase = await createClient()
    const { error } = await supabase.from("bookmarks").update({ is_approved: true }).eq("id", bookmarkId)

    if (error) {
      console.error("[v0] Approve bookmark error:", error)
      return { success: false, error: "Failed to approve bookmark" }
    }

    return { success: true }
  } catch (err) {
    console.error("[v0] Approve bookmark error:", err)
    return { success: false, error: "An unexpected error occurred" }
  }
}
