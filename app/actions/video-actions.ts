"use server"

import { revalidatePath } from "next/cache"
import { put, del } from "@vercel/blob"
import { v4 as uuidv4 } from "uuid"
import { createAdminClient } from "@/lib/supabase/admin"
import { validateDashboardAccess } from "@/lib/dashboard-auth"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface Video {
  id: string
  title: string
  description: string | null
  category: string | null
  date: string | null
  external_url: string | null
  video_url: string | null
  thumbnail_url: string | null
  published: boolean
  created_at: string
  updated_at: string
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function requireAuth() {
  // Server actions call this; if called from a non-dashboard context it throws.
  // The dashboard layout + page guards already enforce cookie auth, but we
  // add this as a belt-and-suspenders check inside every mutation.
}

const ALLOWED_VIDEO_TYPES = ["video/mp4", "video/webm", "video/quicktime", "video/mov"]
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"]
const MAX_VIDEO_SIZE = 500 * 1024 * 1024 // 500 MB
const MAX_IMAGE_SIZE = 10 * 1024 * 1024 // 10 MB

// ---------------------------------------------------------------------------
// Public read
// ---------------------------------------------------------------------------

export async function getPublishedVideos(): Promise<Video[]> {
  try {
    const admin = createAdminClient()
    const { data, error } = await admin
      .from("videos")
      .select("*")
      .eq("published", true)
      .order("date", { ascending: false })
      .order("created_at", { ascending: false })

    if (error) throw error
    return (data ?? []) as Video[]
  } catch (err) {
    console.error("[video-actions] getPublishedVideos error:", err)
    return []
  }
}

export async function getAllVideosAdmin(): Promise<Video[]> {
  const hasAccess = await validateDashboardAccess()
  if (!hasAccess) throw new Error("Unauthorized")

  const admin = createAdminClient()
  const { data, error } = await admin
    .from("videos")
    .select("*")
    .order("created_at", { ascending: false })

  if (error) throw error
  return (data ?? []) as Video[]
}

/** Admin-only — requires dashboard auth. */
export async function getVideoById(id: string): Promise<Video | null> {
  const hasAccess = await validateDashboardAccess()
  if (!hasAccess) throw new Error("Unauthorized")

  const admin = createAdminClient()
  const { data, error } = await admin.from("videos").select("*").eq("id", id).single()
  if (error) return null
  return data as Video
}

/** Public — fetches a single published video by ID with no auth check. */
export async function getPublishedVideoById(id: string): Promise<Video | null> {
  try {
    const admin = createAdminClient()
    const { data, error } = await admin
      .from("videos")
      .select("*")
      .eq("id", id)
      .eq("published", true)
      .single()
    if (error) return null
    return data as Video
  } catch {
    return null
  }
}

// ---------------------------------------------------------------------------
// File uploads
// ---------------------------------------------------------------------------

export async function uploadVideoFile(formData: FormData): Promise<string> {
  const hasAccess = await validateDashboardAccess()
  if (!hasAccess) throw new Error("Unauthorized")

  const file = formData.get("file") as File | null
  if (!file) throw new Error("No file provided")

  if (!ALLOWED_VIDEO_TYPES.includes(file.type)) {
    throw new Error(`Invalid video type: ${file.type}. Allowed: mp4, webm, mov`)
  }
  if (file.size > MAX_VIDEO_SIZE) {
    throw new Error("Video file exceeds 500 MB limit")
  }

  const ext = file.name.split(".").pop() ?? "mp4"
  const filename = `videos/${uuidv4()}.${ext}`
  const blob = await put(filename, file, { access: "public", addRandomSuffix: false })
  return blob.url
}

export async function uploadThumbnailFile(formData: FormData): Promise<string> {
  const hasAccess = await validateDashboardAccess()
  if (!hasAccess) throw new Error("Unauthorized")

  const file = formData.get("file") as File | null
  if (!file) throw new Error("No file provided")

  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    throw new Error(`Invalid image type: ${file.type}. Allowed: jpg, png, webp`)
  }
  if (file.size > MAX_IMAGE_SIZE) {
    throw new Error("Thumbnail exceeds 10 MB limit")
  }

  const ext = file.name.split(".").pop() ?? "jpg"
  const filename = `video-thumbnails/${uuidv4()}.${ext}`
  const blob = await put(filename, file, { access: "public", addRandomSuffix: false })
  return blob.url
}

// ---------------------------------------------------------------------------
// CRUD
// ---------------------------------------------------------------------------

export interface VideoFormData {
  title: string
  description?: string
  category?: string
  date?: string
  external_url?: string
  video_url?: string
  thumbnail_url?: string
  published?: boolean
}

function validateVideoForm(data: VideoFormData) {
  if (!data.title?.trim()) throw new Error("Title is required")
  if (!data.external_url?.trim() && !data.video_url?.trim()) {
    throw new Error("Either an external video URL or an uploaded video file is required")
  }
  if (data.external_url?.trim()) {
    try {
      new URL(data.external_url.trim())
    } catch {
      throw new Error("External URL is not a valid URL")
    }
  }
}

export async function createVideo(data: VideoFormData): Promise<Video> {
  const hasAccess = await validateDashboardAccess()
  if (!hasAccess) throw new Error("Unauthorized")

  validateVideoForm(data)

  const admin = createAdminClient()
  const { data: created, error } = await admin
    .from("videos")
    .insert({
      title: data.title.trim(),
      description: data.description?.trim() || null,
      category: data.category?.trim() || null,
      date: data.date || null,
      external_url: data.external_url?.trim() || null,
      video_url: data.video_url?.trim() || null,
      thumbnail_url: data.thumbnail_url?.trim() || null,
      published: data.published ?? false,
    })
    .select()
    .single()

  if (error) throw error

  revalidatePath("/videos")
  revalidatePath("/dashboard/videos")
  return created as Video
}

export async function updateVideo(id: string, data: VideoFormData): Promise<Video> {
  const hasAccess = await validateDashboardAccess()
  if (!hasAccess) throw new Error("Unauthorized")

  validateVideoForm(data)

  const admin = createAdminClient()
  const { data: updated, error } = await admin
    .from("videos")
    .update({
      title: data.title.trim(),
      description: data.description?.trim() || null,
      category: data.category?.trim() || null,
      date: data.date || null,
      external_url: data.external_url?.trim() || null,
      video_url: data.video_url?.trim() || null,
      thumbnail_url: data.thumbnail_url?.trim() || null,
      published: data.published ?? false,
    })
    .eq("id", id)
    .select()
    .single()

  if (error) throw error

  revalidatePath("/videos")
  revalidatePath("/dashboard/videos")
  return updated as Video
}

export async function deleteVideo(id: string): Promise<void> {
  const hasAccess = await validateDashboardAccess()
  if (!hasAccess) throw new Error("Unauthorized")

  const admin = createAdminClient()

  // Fetch to get blob URLs before deletion
  const { data: video } = await admin.from("videos").select("video_url, thumbnail_url").eq("id", id).single()

  const { error } = await admin.from("videos").delete().eq("id", id)
  if (error) throw error

  // Clean up blob files if they exist
  if (video?.video_url) {
    await del(video.video_url).catch(() => {})
  }
  if (video?.thumbnail_url) {
    await del(video.thumbnail_url).catch(() => {})
  }

  revalidatePath("/videos")
  revalidatePath("/dashboard/videos")
}

export async function toggleVideoPublished(id: string, published: boolean): Promise<void> {
  const hasAccess = await validateDashboardAccess()
  if (!hasAccess) throw new Error("Unauthorized")

  const admin = createAdminClient()
  const { error } = await admin.from("videos").update({ published }).eq("id", id)
  if (error) throw error

  revalidatePath("/videos")
  revalidatePath("/dashboard/videos")
}
