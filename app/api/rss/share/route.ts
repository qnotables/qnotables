import { NextResponse } from "next/server"
import {
  getSiteUrl,
  createShareUrl,
  isValidUrl,
  type SharePlatform,
} from "@/lib/rss-utils"

export const dynamic = "force-dynamic"

const PLATFORMS: SharePlatform[] = [
  "twitter",
  "facebook",
  "truthsocial",
  "telegram",
  "linkedin",
  "reddit",
  "email",
]

/**
 * Build canonical share URLs for a public archive/blog record.
 *
 * Query params:
 *   slug     - record slug (resolved against the public archives route)
 *   url      - explicit canonical URL (overrides slug)
 *   title    - post title
 *   excerpt  - short excerpt
 *   hashtags - comma-separated hashtags
 *
 * Never exposes private dashboard URLs. Never crashes.
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const site = getSiteUrl()

    const slug = (searchParams.get("slug") || "").trim()
    const explicitUrl = (searchParams.get("url") || "").trim()
    const title = (searchParams.get("title") || "").trim() || undefined
    const excerpt = (searchParams.get("excerpt") || "").trim() || undefined
    const hashtags = (searchParams.get("hashtags") || "")
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean)

    // Resolve canonical URL. Reject anything that isn't a public site URL.
    let canonical = `${site}/archives`
    if (explicitUrl && isValidUrl(explicitUrl) && explicitUrl.startsWith(site)) {
      // Block private dashboard/admin URLs from being shared.
      if (!/\/(dashboard|admin)(\/|$)/.test(explicitUrl)) {
        canonical = explicitUrl
      }
    } else if (slug) {
      canonical = `${site}/archives/${encodeURIComponent(slug)}`
    }

    const links: Record<string, string> = {}
    for (const platform of PLATFORMS) {
      links[platform] = createShareUrl(platform, {
        url: canonical,
        title,
        excerpt,
        hashtags,
      })
    }

    return NextResponse.json({
      canonicalUrl: canonical,
      title: title ?? null,
      excerpt: excerpt ?? null,
      hashtags,
      links,
    })
  } catch (error) {
    console.error("[v0] /api/rss/share error:", error)
    return NextResponse.json(
      {
        canonicalUrl: getSiteUrl(),
        links: {},
        error: error instanceof Error ? error.message : "Unknown share error",
      },
      { status: 200 },
    )
  }
}
