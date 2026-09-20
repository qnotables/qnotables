import { NextResponse } from "next/server"
import { validateDashboardAccess } from "@/lib/dashboard-auth"
import { analyzeExistingMedia } from "@/lib/media-analysis"

export const runtime = "nodejs"
export const maxDuration = 60

export async function POST(request: Request) {
  if (!(await validateDashboardAccess())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  try {
    const body = await request.json() as { id?: string; mediaUrl?: string; mimeType?: string; fileSize?: number }
    if (!body.id || !body.mediaUrl || !/^https?:\/\//i.test(body.mediaUrl)) return NextResponse.json({ error: "Invalid media input" }, { status: 400 })
    const analysis = await analyzeExistingMedia({ id: body.id, mediaUrl: body.mediaUrl, mimeType: body.mimeType, fileSize: body.fileSize })
    return NextResponse.json({ analysis })
  } catch (error) {
    console.error("[v0] media analysis failed", error instanceof Error ? error.message : "unknown error")
    return NextResponse.json({ error: "Image analysis failed. The media record was preserved." }, { status: 500 })
  }
}
