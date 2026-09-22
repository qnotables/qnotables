import { NextResponse } from "next/server"
import { getAdminUser } from "@/lib/admin"
import { createAdminClient } from "@/lib/supabase/admin"

export const runtime = "nodejs"

export async function GET() {
  if (!(await getAdminUser())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { data, error } = await createAdminClient()
    .from("received_emails")
    .select("id, resend_email_id, from_address, to_addresses, cc_addresses, subject, text_body, html_body, has_attachments, attachment_count, is_read, received_at")
    .order("received_at", { ascending: false })
    .limit(100)
  if (error) {
    console.error("[v0] inbox query failed", error)
    return NextResponse.json({ error: "Unable to load inbox" }, { status: 500 })
  }
  return NextResponse.json({ emails: data ?? [] })
}

export async function PATCH(request: Request) {
  if (!(await getAdminUser())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const body = await request.json().catch(() => null)
  const id = typeof body?.id === "string" ? body.id : ""
  if (!id) return NextResponse.json({ error: "Email id is required" }, { status: 400 })
  const { error } = await createAdminClient().from("received_emails").update({ is_read: true }).eq("id", id)
  if (error) return NextResponse.json({ error: "Unable to mark email read" }, { status: 500 })
  return NextResponse.json({ ok: true })
}
