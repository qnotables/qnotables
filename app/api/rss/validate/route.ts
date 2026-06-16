import { NextResponse } from "next/server"
import { getFeedItems, validateRssItems } from "@/lib/rss-utils"

export const dynamic = "force-dynamic"

/**
 * Validate the generated feed and report errors/warnings as JSON.
 * Never crashes — all failures are caught and returned as errors.
 */
export async function GET() {
  try {
    const items = await getFeedItems(50)
    const result = validateRssItems(items)
    return NextResponse.json(result)
  } catch (error) {
    console.error("[v0] /api/rss/validate error:", error)
    return NextResponse.json({
      valid: false,
      itemCount: 0,
      errors: [error instanceof Error ? error.message : "Unknown validation error"],
      warnings: [],
      lastChecked: new Date().toISOString(),
    })
  }
}
