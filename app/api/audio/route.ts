import { list, del } from "@vercel/blob"
import { type NextRequest, NextResponse } from "next/server"
import { validateDashboardAccess } from "@/lib/dashboard-auth"

// GET — list all audio tracks
export async function GET() {
  try {
    const { blobs } = await list({ prefix: "audio/" })
    const tracks = blobs
      .filter((b) => b.pathname.match(/\.(mp3|wav|ogg|m4a)$/i))
      .map((b) => ({
        url: b.url,
        title: b.pathname
          .replace(/^audio\//, "")
          .replace(/\.[^.]+$/, "")
          .replace(/^\d+-[a-z0-9]+-/, "") // strip timestamp prefix
          .replace(/[-_]/g, " ")
          .toUpperCase(),
        pathname: b.pathname,
        size: b.size,
        uploadedAt: b.uploadedAt,
      }))
    return NextResponse.json({ tracks })
  } catch (err) {
    console.error("[v0] audio list error", err)
    return NextResponse.json({ error: "Failed to list audio" }, { status: 500 })
  }
}

// DELETE — remove an audio blob by URL
export async function DELETE(request: NextRequest) {
  const hasAccess = await validateDashboardAccess()
  if (!hasAccess) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const { url } = await request.json()
    if (!url) return NextResponse.json({ error: "No URL provided" }, { status: 400 })
    await del(url)
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error("[v0] audio delete error", err)
    return NextResponse.json({ error: "Delete failed" }, { status: 500 })
  }
}
