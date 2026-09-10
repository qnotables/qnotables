import { del, head, put } from "@vercel/blob"
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client"
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

type UploadFolder = "forum" | "blog"

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

function uploadPolicy(folder: "forum" | "blog", contentType: string) {
  const isImage = ALLOWED_IMAGE_TYPES.has(contentType)
  const isVideo = ALLOWED_VIDEO_TYPES.has(contentType)
  if (!isImage && !isVideo) return null

  return {
    isVideo,
    allowedExtensions: isVideo ? ALLOWED_VIDEO_EXTS : ALLOWED_IMAGE_EXTS,
    maxBytes: isVideo ? (folder === "forum" ? 50 * 1024 * 1024 : MAX_VIDEO_BYTES) : MAX_IMAGE_BYTES,
    maxLabel: isVideo ? (folder === "forum" ? "50 MB" : "500 MB") : "5 MB",
  }
}

function isSafeClientPathname(
  pathname: string,
  folder: "forum" | "blog",
  allowedExtensions: Set<string>,
) {
  const parts = pathname.split("/")
  if (parts.length !== 2 || parts[0] !== folder) return false

  const filename = parts[1] ?? ""
  const extension = filename.toLowerCase().split(".").pop() ?? ""
  const stem = filename.slice(0, -(extension.length + 1))
  return Boolean(stem) && /^[a-zA-Z0-9_-]+$/.test(stem) && allowedExtensions.has(extension)
}

function uploadRateLimit(userId: string, folder: "forum" | "blog") {
  const isBlogUpload = folder === "blog"
  const uploadLimit = isBlogUpload
    ? SPAM_LIMITS.MAX_BLOG_UPLOADS_PER_WINDOW
    : SPAM_LIMITS.MAX_UPLOADS_PER_WINDOW
  const uploadRlKey = isBlogUpload ? "upload:blog" : "upload:forum"

  return checkRateLimit(
    userId,
    uploadRlKey,
    SPAM_LIMITS.UPLOAD_COOLDOWN_MS,
    uploadLimit,
  )
}

function uploadLimitResponse(uploadRl: ReturnType<typeof uploadRateLimit>) {
  const secs = Math.ceil(uploadRl.retryAfterMs / 1000)
  return NextResponse.json(
    { success: false, error: `Upload limit reached. Please wait ${secs}s before uploading again.` },
    { status: 429, headers: { "Retry-After": String(secs) } },
  )
}

function safeClientPayload(raw: string | null) {
  if (!raw) return null
  try {
    const payload: unknown = JSON.parse(raw)
    if (!payload || typeof payload !== "object") return null
    const value = payload as Record<string, unknown>
    const folder: UploadFolder | null =
      value.folder === "blog" || value.folder === "forum" ? value.folder : null
    const contentType = typeof value.contentType === "string" ? value.contentType : ""
    const filename = typeof value.filename === "string" ? value.filename : ""
    const size = typeof value.size === "number" ? value.size : Number(value.size)
    if (!folder || !contentType || !filename || !Number.isSafeInteger(size) || size < 0) return null
    return { folder, contentType, filename, size }
  } catch {
    return null
  }
}

async function registerBlobUpload(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  body: Record<string, unknown>,
) {
  const folder = body.folder === "blog" || body.folder === "forum" ? body.folder : null
  const pathname = typeof body.pathname === "string" ? body.pathname : ""
  const url = typeof body.url === "string" ? body.url : ""
  const filename = typeof body.filename === "string" ? body.filename : "uploaded media"

  if (!folder || !pathname || !url) {
    return NextResponse.json({ success: false, error: "Invalid upload registration." }, { status: 400 })
  }

  const blobUrl = new URL(url)
  if (
    blobUrl.protocol !== "https:" ||
    !blobUrl.hostname.endsWith(".public.blob.vercel-storage.com")
  ) {
    return NextResponse.json({ success: false, error: "Invalid uploaded media URL." }, { status: 400 })
  }

  const extension = pathname.toLowerCase().split(".").pop() ?? ""
  const isVideo = ALLOWED_VIDEO_EXTS.has(extension)
  const allowedExtensions = isVideo ? ALLOWED_VIDEO_EXTS : ALLOWED_IMAGE_EXTS
  if (!isSafeClientPathname(pathname, folder, allowedExtensions)) {
    return NextResponse.json({ success: false, error: "Invalid uploaded media path." }, { status: 400 })
  }

  const blob = await head(url)
  if (blob.pathname !== pathname) {
    return NextResponse.json({ success: false, error: "Uploaded media path mismatch." }, { status: 400 })
  }

  const policy = uploadPolicy(folder, blob.contentType)
  if (!policy || !policy.allowedExtensions.has(extension) || blob.size > policy.maxBytes) {
    return NextResponse.json(
      { success: false, error: policy ? `Media must be ${policy.maxLabel} or smaller.` : "Uploaded media type is not allowed." },
      { status: 400 },
    )
  }

  const { data: attachment, error: attachmentError } = await supabase
    .from("forum_attachments")
    .insert({
      owner_id: userId,
      storage_key: pathname,
      url: blob.url,
      original_name: filename.slice(0, 255),
      mime_type: blob.contentType,
      byte_size: blob.size,
      status: "orphaned",
    })
    .select("id")
    .single()

  if (attachmentError) {
    await del(blob.url)
    throw new Error("Could not register uploaded media.")
  }

  return NextResponse.json({
    success: true,
    attachmentId: attachment.id,
    url: blob.url,
    filename: pathname.split("/").pop() ?? pathname,
    storageKey: pathname,
    size: blob.size,
    contentType: blob.contentType,
  })
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json(
      { success: false, error: "Sign in to upload media." },
      { status: 401 },
    )
  }

  try {
    const contentType = request.headers.get("content-type") ?? ""
    if (contentType.includes("application/json")) {
      const body = (await request.json()) as Record<string, unknown>

      if (body.action === "register") {
        return registerBlobUpload(supabase, user.id, body)
      }

      if (body.type !== "blob.generate-client-token") {
        return NextResponse.json({ success: false, error: "Invalid upload request." }, { status: 400 })
      }

      const blobBody = body as unknown as HandleUploadBody
      const pathname = typeof body.payload === "object" && body.payload
        ? (body.payload as Record<string, unknown>).pathname
        : null
      const clientPayload = typeof body.payload === "object" && body.payload
        ? (body.payload as Record<string, unknown>).clientPayload
        : null
      const payload = safeClientPayload(typeof clientPayload === "string" ? clientPayload : null)
      if (typeof pathname !== "string" || !payload || payload.folder !== pathname.split("/")[0]) {
        return NextResponse.json({ success: false, error: "Invalid upload metadata." }, { status: 400 })
      }

      const policy = uploadPolicy(payload.folder, payload.contentType)
      if (
        !policy ||
        payload.size > policy.maxBytes ||
        !isSafeClientPathname(pathname, payload.folder, policy.allowedExtensions)
      ) {
        return NextResponse.json(
          { success: false, error: policy ? `Media must be ${policy.maxLabel} or smaller.` : "This file type is not allowed." },
          { status: 400 },
        )
      }

      const uploadRl = uploadRateLimit(user.id, payload.folder)
      if (!uploadRl.allowed) return uploadLimitResponse(uploadRl)

      const result = await handleUpload({
        request,
        body: blobBody,
        onBeforeGenerateToken: async (requestedPathname, requestedPayload) => {
          if (requestedPathname !== pathname || requestedPayload !== clientPayload) {
            throw new Error("Upload metadata changed.")
          }
          return {
            allowedContentTypes: [payload.contentType],
            maximumSizeInBytes: policy.maxBytes,
            addRandomSuffix: false,
          }
        },
      })

      return NextResponse.json(result)
    }

    const formData = await request.formData()
    const file = formData.get("file") as File | null
    if (!file) {
      return NextResponse.json({ success: false, error: "No file provided." }, { status: 400 })
    }

    const folder = formData.get("folder") === "blog" ? "blog" : "forum"
    const policy = uploadPolicy(folder, file.type)
    if (!policy) {
      return NextResponse.json(
        { success: false, error: "Only images (JPG, PNG, WEBP, GIF) and videos (MP4, WEBM, MOV) are allowed." },
        { status: 400 },
      )
    }

    const uploadRl = uploadRateLimit(user.id, folder)
    if (!uploadRl.allowed) return uploadLimitResponse(uploadRl)

    if (file.size > policy.maxBytes) {
      return NextResponse.json(
        { success: false, error: `${policy.isVideo ? "Video" : "Image"} must be ${policy.maxLabel} or smaller.` },
        { status: 400 },
      )
    }

    const originalExt = file.name.toLowerCase().split(".").pop() ?? ""
    if (originalExt && !policy.allowedExtensions.has(originalExt)) {
      return NextResponse.json(
        { success: false, error: "File extension does not match file type." },
        { status: 400 },
      )
    }
    if (originalExt && BLOCKED_EXTS.has(originalExt)) {
      return NextResponse.json(
        { success: false, error: "This file type is not allowed." },
        { status: 400 },
      )
    }

    const ext = safeExtension(file.name, file.type)
    const filename = safeFilename(user.id, folder, ext)
    const blob = await put(filename, file, { access: "public", addRandomSuffix: false })

    const { data: attachment, error: attachmentError } = await supabase
      .from("forum_attachments")
      .insert({
        owner_id: user.id,
        storage_key: filename,
        url: blob.url,
        original_name: file.name.slice(0, 255),
        mime_type: file.type,
        byte_size: file.size,
        status: "orphaned",
      })
      .select("id")
      .single()

    if (attachmentError) {
      await del(blob.url)
      throw new Error("Could not register uploaded media.")
    }

    return NextResponse.json({
      success: true,
      attachmentId: attachment.id,
      url: blob.url,
      filename: filename.split("/").pop() ?? filename,
      storageKey: filename,
      size: file.size,
      contentType: file.type,
    })
  } catch (err) {
    console.error("[upload] error:", err)
    return NextResponse.json(
      { success: false, error: "Upload failed. Please try again." },
      { status: 500 },
    )
  }
}
