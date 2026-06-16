import { NextResponse } from "next/server"
import { getFeedItems } from "@/lib/rss-utils"

export const dynamic = "force-dynamic"

/**
 * JSON preview of the feed items before XML conversion.
 * Useful for troubleshooting bad records from the dashboard.
 */
export async function GET() {
  try {
    const items = await getFeedItems(50)
    const preview = items.map((item) => ({
      title: item.title,
      slug: item.slug,
      link: item.link,
      guid: item.guid,
      pubDate: item.pubDate,
      pubDateIso: item.pubDateIso,
      category: item.category,
      tags: item.tags,
      source_name: item.sourceName,
      source_url: item.sourceUrl ?? null,
      image_url: item.imageUrl ?? null,
      image_source: item.imageSource ?? null,
      description: item.description,
      warnings: item.warnings,
    }))

    return NextResponse.json({
      itemCount: preview.length,
      generatedAt: new Date().toISOString(),
      items: preview,
    })
  } catch (error) {
    console.error("[v0] /api/rss/preview error:", error)
    return NextResponse.json({
      itemCount: 0,
      generatedAt: new Date().toISOString(),
      items: [],
      error: error instanceof Error ? error.message : "Unknown preview error",
    })
  }
}
