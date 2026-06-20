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

const ALLOWED_IMAGE_EXTS = new Set(["jpg", "jpeg", "png", "webp", "gif"])

// Explicitly blocked dangerous extensions (defence-in-depth beyond MIME check)
const BLOCKED_EXTS = new Set([
  "svg", "html", "htm", "xhtml",
  "js", "mjs", "cjs", "ts",
  "php", "php3", "php4", "php5", "phtml",
  "exe", "bat", "cmd", "sh", "bash", "zsh",
  "py", "rb", "pl", "asp", "aspx", "jsp",
  "xml", "xsl", "css",
])

// 5 MB for forum images
const MAX_IMAGE_BYTES = 5 * 1024 * 1024

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
  }
  if (mimeMap[mimeType]) return mimeMap[mimeType]

  // Fall back to the last segment of the filename only
  const parts = filename.toLowerCase().split(".")
  const ext = parts[parts.length - 1] ?? ""
  if (ALLOWED_IMAGE_EXTS.has(ext)) return ext
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

  // Per-user upload rate limit: max 3 uploads per 60 s
  const uploadRl = checkRateLimit(
    user.id,
    "upload",
    SPAM_LIMITS.UPLOAD_COOLDOWN_MS,
    SPAM_LIMITS.MAX_UPLOADS_PER_WINDOW,
  )
  if (!uploadRl.allowed) {
    const secs = Math.ceil(uploadRl.retryAfterMs / 1000)
    return NextResponse.json(
      { success: false, error: `Upload limit reached. Please wait ${secs}s before uploading again.` },
      { status: 429, headers: { "Retry-After": String(secs) } },
    )
  }

  try {
    const formData = await request.formData()
    const file = formData.get("file") as File | null

    if (!file) {
      return NextResponse.json({ success: false, error: "No file provided." }, { status: 400 })
    }

    // Validate MIME type — images only
    if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
      return NextResponse.json(
        {
          success: false,
          error: "Only JPG, PNG, WEBP, and GIF images are allowed.",
        },
        { status: 400 },
      )
    }

    // Validate size
    if (file.size > MAX_IMAGE_BYTES) {
      return NextResponse.json(
        { success: false, error: "Image must be 5 MB or smaller." },
        { status: 400 },
      )
    }

    // Validate original filename extension as a second check
    const originalExt = file.name.toLowerCase().split(".").pop() ?? ""
    if (originalExt && !ALLOWED_IMAGE_EXTS.has(originalExt)) {
      return NextResponse.json(
        { success: false, error: "Only JPG, PNG, WEBP, and GIF images are allowed." },
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

    // Sanitize folder param
    const folderRaw = String(formData.get("folder") ?? "forum")
    const folder = folderRaw === "blog" ? "blog" : "forum"

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
