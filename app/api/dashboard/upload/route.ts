import { put } from "@vercel/blob"
import { type NextRequest, NextResponse } from "next/server"
import { validateDashboardAccess } from "@/lib/dashboard-auth"

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
    if (!isImage && !isVideo) {
      return NextResponse.json({ error: "Only image and video files are allowed" }, { status: 400 })
    }

    const maxBytes = isVideo ? 50 * 1024 * 1024 : 8 * 1024 * 1024
    if (file.size > maxBytes) {
      const limitLabel = isVideo ? "50 MB" : "8 MB"
      return NextResponse.json(
        { error: `${isVideo ? "Video" : "Image"} must be under ${limitLabel}` },
        { status: 400 },
      )
    }

    const folderRaw = String(formData.get("folder") ?? "media")
    const folder = ["blog", "media", "ads"].includes(folderRaw) ? folderRaw : "media"

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
