import { NextResponse } from "next/server"
import { getAdminUser } from "@/lib/admin"
import { buildSender, getResendClient, isResendConfigured } from "@/lib/resend"
import { normalizePlainText, plainTextToHtml } from "@/lib/email-format"
import { logActivity } from "@/lib/dashboard-data"

export const runtime = "nodejs"

const SUBJECT_MAX = 200
const MESSAGE_MAX = 10000
const FROM_NAME_MAX = 100

// Basic best-effort, per-admin rate limiting. Not a marketing-scale system.
const RATE_WINDOW_MS = 60_000
const RATE_MAX = 5
const sendHistory = new Map<string, number[]>()

function withinRateLimit(key: string): boolean {
  const now = Date.now()
  const recent = (sendHistory.get(key) ?? []).filter((t) => now - t < RATE_WINDOW_MS)
  if (recent.length >= RATE_MAX) {
    sendHistory.set(key, recent)
    return false
  }
  recent.push(now)
  sendHistory.set(key, recent)
  return true
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function isValidEmail(value: unknown): value is string {
  return typeof value === "string" && value.length <= 254 && EMAIL_RE.test(value.trim())
}

export async function POST(request: Request) {
  const admin = await getAdminUser()
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  if (!isResendConfigured()) {
    console.error("[v0] admin email: RESEND_API_KEY missing")
    return NextResponse.json(
      { error: "Email sending is not configured yet. Add RESEND_API_KEY and try again." },
      { status: 503 },
    )
  }

  if (!withinRateLimit(admin.id)) {
    return NextResponse.json(
      { error: "Too many emails sent. Please wait a moment and try again." },
      { status: 429 },
    )
  }

  let payload: Record<string, unknown>
  try {
    payload = (await request.json()) as Record<string, unknown>
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 })
  }

  const to = typeof payload.to === "string" ? payload.to.trim() : ""
  const subjectRaw = typeof payload.subject === "string" ? payload.subject.trim() : ""
  const messageRaw = typeof payload.message === "string" ? payload.message : ""
  const fromName = typeof payload.fromName === "string" ? payload.fromName.trim() : ""
  const replyTo = typeof payload.replyTo === "string" ? payload.replyTo.trim() : ""

  if (!isValidEmail(to)) {
    return NextResponse.json({ error: "Enter a valid recipient email address." }, { status: 400 })
  }
  if (!subjectRaw) {
    return NextResponse.json({ error: "Subject is required." }, { status: 400 })
  }
  if (subjectRaw.length > SUBJECT_MAX) {
    return NextResponse.json({ error: `Subject must be ${SUBJECT_MAX} characters or fewer.` }, { status: 400 })
  }
  if (!messageRaw.trim()) {
    return NextResponse.json({ error: "Message is required." }, { status: 400 })
  }
  if (messageRaw.length > MESSAGE_MAX) {
    return NextResponse.json({ error: `Message must be ${MESSAGE_MAX} characters or fewer.` }, { status: 400 })
  }
  if (fromName.length > FROM_NAME_MAX) {
    return NextResponse.json({ error: `From name must be ${FROM_NAME_MAX} characters or fewer.` }, { status: 400 })
  }
  if (replyTo && !isValidEmail(replyTo)) {
    return NextResponse.json({ error: "Enter a valid reply-to email address." }, { status: 400 })
  }

  const from = buildSender(fromName)
  const html = plainTextToHtml(messageRaw)
  const text = normalizePlainText(messageRaw)
  const sentAt = new Date().toISOString()

  try {
    const resend = getResendClient()
    const { data, error } = await resend.emails.send({
      from,
      to,
      subject: subjectRaw,
      html,
      text,
      ...(replyTo ? { replyTo } : {}),
    })

    if (error || !data) {
      console.error("[v0] admin email send failed", error)
      await logActivity({
        actorLabel: admin.email ?? "Admin",
        action: "email.send.failed",
        targetType: "email",
        targetId: to,
        details: `Subject: ${subjectRaw} | Status: failed`,
      })
      return NextResponse.json({ error: "Unable to send email. Please try again." }, { status: 502 })
    }

    await logActivity({
      actorLabel: admin.email ?? "Admin",
      action: "email.send",
      targetType: "email",
      targetId: to,
      details: `Subject: ${subjectRaw} | Message ID: ${data.id} | Status: sent`,
    })

    return NextResponse.json({
      ok: true,
      messageId: data.id,
      recipient: to,
      subject: subjectRaw,
      sentAt,
    })
  } catch (err) {
    console.error("[v0] admin email exception", err)
    return NextResponse.json({ error: "Unable to send email. Please try again." }, { status: 500 })
  }
}
