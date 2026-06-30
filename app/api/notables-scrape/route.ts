import { NextRequest, NextResponse } from "next/server"
import { runNotablesScrape } from "@/lib/notables/ingest"

/**
 * /api/notables-scrape
 *
 * Protected by CRON_SECRET. Accepts both:
 *   GET  — triggered by Vercel Cron (x-vercel-cron: 1)
 *   POST — triggered manually from the dashboard
 *
 * Authorization: Bearer <CRON_SECRET>
 */

function verifyCronSecret(request: NextRequest): boolean {
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret) {
    console.warn("[notables-scraper] CRON_SECRET is not set — rejecting all requests")
    return false
  }
  const authHeader = request.headers.get("authorization")
  return authHeader === `Bearer ${cronSecret}`
}

async function handle(request: NextRequest) {
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const isVercelCron = request.headers.get("x-vercel-cron") === "1"
  const triggeredBy = isVercelCron ? "cron" : "manual"

  try {
    const result = await runNotablesScrape(triggeredBy)

    return NextResponse.json({
      success: true,
      triggeredBy: result.triggeredBy,
      newItems: result.newItems,
      skippedDupes: result.skippedDupes,
      startedAt: result.startedAt,
      finishedAt: result.finishedAt,
      errors: result.errors,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error"
    console.error("[notables-scraper] Fatal error:", message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  return handle(request)
}

export async function POST(request: NextRequest) {
  return handle(request)
}
