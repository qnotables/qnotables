import { NextResponse } from "next/server"
import { getResendClient } from "@/lib/resend"
import { createAdminClient } from "@/lib/supabase/admin"

export const runtime = "nodejs"

export async function POST(request: Request) {
  const secret = process.env.RESEND_WEBHOOK_SECRET
  if (!secret) return NextResponse.json({ error: "Webhook is not configured" }, { status: 503 })

  const payload = await request.text()
  let event: { type?: string; data?: { email_id?: string } }
  try {
    event = getResendClient().webhooks.verify({
      payload,
      headers: {
        "svix-id": request.headers.get("svix-id") ?? "",
        "svix-timestamp": request.headers.get("svix-timestamp") ?? "",
        "svix-signature": request.headers.get("svix-signature") ?? "",
      },
      secret,
    }) as typeof event
  } catch (error) {
    console.error("[v0] resend webhook verification failed", error)
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 })
  }

  if (event.type !== "email.received" || !event.data?.email_id) {
    return NextResponse.json({ ok: true })
  }

  const { data: email, error } = await getResendClient().emails.receiving.get(event.data.email_id)
  if (error || !email) {
    console.error("[v0] resend received email lookup failed", error)
    return NextResponse.json({ error: "Unable to retrieve email" }, { status: 502 })
  }

  const toAddresses = Array.isArray(email.to) ? email.to : email.to ? [email.to] : []
  const ccAddresses = Array.isArray(email.cc) ? email.cc : email.cc ? [email.cc] : []
  const attachments = Array.isArray(email.attachments) ? email.attachments : []
  const admin = createAdminClient()
  const { error: insertError } = await admin.from("received_emails").upsert(
    {
      resend_email_id: event.data.email_id,
      from_address: email.from ?? "unknown",
      to_addresses: toAddresses,
      cc_addresses: ccAddresses,
      subject: email.subject ?? null,
      text_body: email.text ?? null,
      html_body: email.html ?? null,
      has_attachments: attachments.length > 0,
      attachment_count: attachments.length,
      received_at: email.created_at ?? new Date().toISOString(),
    },
    { onConflict: "resend_email_id" },
  )

  if (insertError) {
    console.error("[v0] received email insert failed", insertError)
    return NextResponse.json({ error: "Unable to store email" }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
