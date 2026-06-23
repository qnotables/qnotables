import { put } from "@vercel/blob"
import { type NextRequest, NextResponse } from "next/server"
import { validateDashboardAccess } from "@/lib/dashboard-auth"

// Raise the Next.js body-parser limit so large audio/video files (up to 500 MB)
// are not rejected with 413 before the route handler is reached.
export const maxDuration = 60
export const dynamic = "force-dynamic"

export const config = {
  api: {
    bodyParser: {
      sizeLimit: "500mb",
    },
  },
}

export async function POST(request: NextRequest) {
  const hasAccess = await validateDashboardAccess()
  if (!hasAccess) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const formData = await request.formData()
    const file = formData.get("file") as File | null
    if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 })

    const isImage = file.type.startsWith("image/")
    const isVideo = file.type.startsWith("video/")
    const isAudio = file.type.startsWith("audio/") || file.name.endsWith(".mp3")
    if (!isImage && !isVideo && !isAudio) {
      return NextResponse.json({ error: "Only image, video, and audio files are allowed" }, { status: 400 })
    }

    const maxBytes = isVideo ? 500 * 1024 * 1024 : isAudio ? 50 * 1024 * 1024 : 10 * 1024 * 1024
    if (file.size > maxBytes) {
      const limitLabel = isVideo ? "500 MB" : isAudio ? "50 MB" : "10 MB"
      return NextResponse.json(
        { error: `File must be under ${limitLabel}` },
        { status: 400 },
      )
    }

    const folderRaw = String(formData.get("folder") ?? "media")
    const folder = ["blog", "blog-videos", "media", "ads", "videos", "video-thumbnails", "audio"].includes(folderRaw) ? folderRaw : "media"

    const ext = file.name.split(".").pop() ?? "bin"
    const filename = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`

    const blob = await put(filename, file, { access: "public" })

    return NextResponse.json({
      url: blob.url,
      fileName: file.name,
      fileType: file.type,
      fileSize: file.size,
    })
  } catch (err) {
    console.error("[v0] dashboard upload error", err)
    return NextResponse.json({ error: "Upload failed" }, { status: 500 })
  }
}
