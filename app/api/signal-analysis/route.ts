import { NextRequest, NextResponse } from "next/server"
import { runSignalAnalysis } from "@/lib/signal-analysis"

export const dynamic = "force-dynamic"

function isAuthorized(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET
  return Boolean(secret && request.headers.get("authorization") === `Bearer ${secret}`)
}

async function handle(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const triggeredBy = request.headers.get("x-vercel-cron") === "1" ? "cron" : "manual"
  try {
    const result = await runSignalAnalysis(triggeredBy)
    return NextResponse.json(result, { status: result.status === "failed" ? 502 : result.status === "partial" ? 207 : 200 })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to run signal analysis."
    console.error("[signal-analysis] Fatal error", message)
    return NextResponse.json({ success: false, status: "failed", error: message }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  return handle(request)
}

export async function POST(request: NextRequest) {
  return handle(request)
}
