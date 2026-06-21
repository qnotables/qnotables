import { NextRequest, NextResponse } from "next/server"
import { runScrape } from "@/lib/scraper/ingest"

/**
 * /api/scrape
 *
 * Protected by CRON_SECRET. Accepts both GET (Vercel cron) and POST (manual
 * trigger from dashboard).
 *
 * Authorization: Bearer <CRON_SECRET>
 */
function verifyCronSecret(request: NextRequest): boolean {
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret) {
    console.warn("[scraper] CRON_SECRET is not set — rejecting all requests")
    return false
  }
  const authHeader = request.headers.get("authorization")
  return authHeader === `Bearer ${cronSecret}`
}

async function handle(request: NextRequest) {
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // Determine trigger source: Vercel cron sets the x-vercel-cron header
  const isVercelCron = request.headers.get("x-vercel-cron") === "1"
  const triggeredBy = isVercelCron ? "cron" : "manual"

  try {
    const result = await runScrape(triggeredBy)

    return NextResponse.json({
      success: true,
      triggeredBy: result.triggeredBy,
      totalSources: result.totalSources,
      succeeded: result.succeeded,
      failed: result.failed,
      newPosts: result.newPosts,
      skippedDupes: result.skippedDupes,
      startedAt: result.startedAt,
      finishedAt: result.finishedAt,
      details: result.details,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error"
    console.error("[scraper] Fatal error:", message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  return handle(request)
}

export async function POST(request: NextRequest) {
  return handle(request)
}
