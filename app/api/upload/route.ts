import { put } from "@vercel/blob"
import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { checkRateLimit, SPAM_LIMITS } from "@/lib/forum-spam-guard"

// ─── Constants ────────────────────────────────────────────────────────────────

const ALLOWED_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/gif",
])

const ALLOWED_VIDEO_TYPES = new Set([
  "video/mp4",
  "video/webm",
  "video/quicktime",
  "video/mov",
])

const ALLOWED_IMAGE_EXTS = new Set(["jpg", "jpeg", "png", "webp", "gif"])
const ALLOWED_VIDEO_EXTS = new Set(["mp4", "webm", "mov"])

// Explicitly blocked dangerous extensions (defence-in-depth beyond MIME check)
const BLOCKED_EXTS = new Set([
  "svg", "html", "htm", "xhtml",
  "js", "mjs", "cjs", "ts",
  "php", "php3", "php4", "php5", "phtml",
  "exe", "bat", "cmd", "sh", "bash", "zsh",
  "py", "rb", "pl", "asp", "aspx", "jsp",
  "xml", "xsl", "css",
])

// 5 MB for forum/blog images; 500 MB for blog videos
const MAX_IMAGE_BYTES = 5 * 1024 * 1024
const MAX_VIDEO_BYTES = 500 * 1024 * 1024

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Return only the final extension, guarding against double-extension attacks. */
function safeExtension(filename: string, mimeType: string): string {
  // Derive from MIME first (most reliable)
  const mimeMap: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/jpg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "image/gif": "gif",
    "video/mp4": "mp4",
    "video/webm": "webm",
    "video/quicktime": "mov",
    "video/mov": "mov",
  }
  if (mimeMap[mimeType]) return mimeMap[mimeType]

  // Fall back to the last segment of the filename only
  const parts = filename.toLowerCase().split(".")
  const ext = parts[parts.length - 1] ?? ""
  if (ALLOWED_IMAGE_EXTS.has(ext) || ALLOWED_VIDEO_EXTS.has(ext)) return ext
  return "jpg"
}

function safeFilename(userId: string, folder: string, ext: string): string {
  // Format: forum/<userId>/<timestamp>-<random>.<ext>
  const rand = Math.random().toString(36).slice(2, 8)
  return `${folder}/${userId}/${Date.now()}-${rand}.${ext}`
}

// ─── Route ────────────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  // Auth check — no anonymous uploads
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json(
      { success: false, error: "Sign in to upload images." },
      { status: 401 },
    )
  }

  try {
    const formData = await request.formData()
    const file = formData.get("file") as File | null

    if (!file) {
      return NextResponse.json({ success: false, error: "No file provided." }, { status: 400 })
    }

    // Sanitize folder param (needed for video permission check and rate-limit bucket)
    const folderRaw = String(formData.get("folder") ?? "forum")
    const folder = folderRaw === "blog" ? "blog" : "forum"

    // Blog editors batch-upload many images at once; use a higher per-window limit
    // so multi-image drops don't immediately hit the forum spam guard.
    const isBlogUpload = folder === "blog"
    const uploadLimit = isBlogUpload
      ? SPAM_LIMITS.MAX_BLOG_UPLOADS_PER_WINDOW
      : SPAM_LIMITS.MAX_UPLOADS_PER_WINDOW
    const uploadRlKey = isBlogUpload ? "upload:blog" : "upload:forum"

    const uploadRl = checkRateLimit(
      user.id,
      uploadRlKey,
      SPAM_LIMITS.UPLOAD_COOLDOWN_MS,
      uploadLimit,
    )
    if (!uploadRl.allowed) {
      const secs = Math.ceil(uploadRl.retryAfterMs / 1000)
      return NextResponse.json(
        { success: false, error: `Upload limit reached. Please wait ${secs}s before uploading again.` },
        { status: 429, headers: { "Retry-After": String(secs) } },
      )
    }

    const isImage = ALLOWED_IMAGE_TYPES.has(file.type)
    const isVideo = ALLOWED_VIDEO_TYPES.has(file.type)

    // Videos only allowed in blog folder
    if (!isImage && !(isVideo && folder === "blog")) {
      return NextResponse.json(
        {
          success: false,
          error: folder === "blog"
            ? "Only images (JPG, PNG, WEBP, GIF) and videos (MP4, WEBM, MOV) are allowed."
            : "Only JPG, PNG, WEBP, and GIF images are allowed.",
        },
        { status: 400 },
      )
    }

    // Validate size
    const maxBytes = isVideo ? MAX_VIDEO_BYTES : MAX_IMAGE_BYTES
    const maxLabel = isVideo ? "500 MB" : "5 MB"
    if (file.size > maxBytes) {
      return NextResponse.json(
        { success: false, error: `${isVideo ? "Video" : "Image"} must be ${maxLabel} or smaller.` },
        { status: 400 },
      )
    }

    // Validate original filename extension as a second check
    const originalExt = file.name.toLowerCase().split(".").pop() ?? ""
    const allowedExts = isVideo ? ALLOWED_VIDEO_EXTS : ALLOWED_IMAGE_EXTS
    if (originalExt && !allowedExts.has(originalExt)) {
      return NextResponse.json(
        { success: false, error: "File extension does not match file type." },
        { status: 400 },
      )
    }
    // Block any explicitly dangerous extensions as defence-in-depth
    if (originalExt && BLOCKED_EXTS.has(originalExt)) {
      return NextResponse.json(
        { success: false, error: "This file type is not allowed." },
        { status: 400 },
      )
    }

    // Generate a safe, unique filename — never trust the original name
    const ext = safeExtension(file.name, file.type)
    const filename = safeFilename(user.id, folder, ext)

    const blob = await put(filename, file, { access: "public" })

    return NextResponse.json({
      success: true,
      url: blob.url,
      filename: filename.split("/").pop() ?? filename,
      size: file.size,
      contentType: file.type,
    })
  } catch (err) {
    console.error("[upload] error:", err)
    return NextResponse.json(
      { success: false, error: "Image upload failed." },
      { status: 500 },
    )
  }
}
