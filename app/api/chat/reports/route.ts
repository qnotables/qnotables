import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"

export async function POST(request: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Sign in to report a message." }, { status: 401 })

  let payload: unknown
  try {
    payload = await request.json()
  } catch {
    return NextResponse.json({ error: "Choose a reason for the report." }, { status: 400 })
  }

  const messageId = typeof payload === "object" && payload !== null && "messageId" in payload && typeof payload.messageId === "string" ? payload.messageId : ""
  const reason = typeof payload === "object" && payload !== null && "reason" in payload && typeof payload.reason === "string" ? payload.reason.trim().slice(0, 500) : ""
  if (!messageId || reason.length < 4) return NextResponse.json({ error: "Choose a message and provide a brief reason." }, { status: 400 })

  const admin = createAdminClient()
  const { data: existing } = await admin
    .from("moderation_flags")
    .select("id")
    .eq("content_type", "chat_message")
    .eq("content_id", messageId)
    .eq("reported_by", user.id)
    .eq("status", "open")
    .maybeSingle()

  if (existing) return NextResponse.json({ alreadyReported: true })

  const { error } = await admin.from("moderation_flags").insert({
    content_type: "chat_message",
    content_id: messageId,
    reason: `User report: ${reason}`,
    status: "open",
    auto_flagged: false,
    reported_by: user.id,
  })

  if (error) {
    console.error("[v0] Chat report failed:", error)
    return NextResponse.json({ error: "Unable to submit that report." }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
