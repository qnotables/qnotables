import { NextResponse } from "next/server"
import { validateDashboardAccess } from "@/lib/dashboard-auth"
import { analyzeExistingMedia } from "@/lib/media-analysis"
import { createAdminClient } from "@/lib/supabase/admin"
import { createClient } from "@/lib/supabase/server"

export const runtime = "nodejs"
export const maxDuration = 60

export async function POST(request: Request) {
  if (!(await validateDashboardAccess())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  try {
    const body = await request.json() as { id?: string; mediaUrl?: string; mimeType?: string; fileSize?: number; action?: "review"; reviewStatus?: "pending" | "approved" | "needs_edit" | "rejected"; reviewNotes?: string }
    if (!body.id) return NextResponse.json({ error: "Invalid media input" }, { status: 400 })
    if (body.action === "review") {
      if (!body.reviewStatus) return NextResponse.json({ error: "A review status is required" }, { status: 400 })
      const notes = body.reviewNotes?.trim().slice(0, 2000) || null
      const reviewed = body.reviewStatus !== "pending"
      const supabase = await createClient()
      const { data: { user } } = await supabase.auth.getUser()
      const { data, error } = await createAdminClient().from("media_ai_analysis").update({ review_status: body.reviewStatus, review_notes: notes, reviewed, reviewed_by: reviewed ? user?.id ?? null : null, reviewed_at: reviewed ? new Date().toISOString() : null, updated_at: new Date().toISOString() }).eq("id", body.id).select("id, status, summary, description, visible_text, topics, tags, media_type, locations, organizations, objects, people_mentioned, visual_style, error_message, reviewed, reviewed_by, reviewed_at, review_status, review_notes").single()
      if (error) throw error
      return NextResponse.json({ analysis: data })
    }
    if (!body.mediaUrl || !/^https?:\/\//i.test(body.mediaUrl)) return NextResponse.json({ error: "Invalid media input" }, { status: 400 })
    const analysis = await analyzeExistingMedia({ id: body.id, mediaUrl: body.mediaUrl, mimeType: body.mimeType, fileSize: body.fileSize })
    return NextResponse.json({ analysis })
  } catch (error) {
    console.error("[v0] media analysis failed", error instanceof Error ? error.message : "unknown error")
    return NextResponse.json({ error: "Image analysis failed. The media record was preserved." }, { status: 500 })
  }
}
