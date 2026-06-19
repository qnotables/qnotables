/**
 * Iframe Embed Utilities
 * Handles URL validation, embed data serialization, and type definitions
 */

// Approved domains (reused from SafeEmbed)
export const APPROVED_IFRAME_DOMAINS = [
  "rumble.com",
  "www.rumble.com",
  "youtube.com",
  "www.youtube.com",
  "youtube-nocookie.com",
  "player.vimeo.com",
  "odysee.com",
  "bitchute.com",
  "archive.org",
  "docs.google.com",
  "drive.google.com",
]

export interface IframeEmbed {
  url: string
  title?: string
  aspectRatio?: "16:9" | "4:3" | "1:1"
  maxWidth?: string
}

/**
 * Validate that a URL belongs to an approved domain for embedding
 */
export function isApprovedIframeDomain(url: string): boolean {
  try {
    const urlObj = new URL(url)
    const hostname = urlObj.hostname.toLowerCase()
    return APPROVED_IFRAME_DOMAINS.some(
      domain =>
        hostname === domain ||
        hostname === domain.replace("www.", "") ||
        hostname.endsWith("." + domain.replace("www.", ""))
    )
  } catch {
    return false
  }
}

/**
 * Validate iframe embed data
 */
export function validateIframeEmbed(embed: Partial<IframeEmbed>): { valid: boolean; error?: string } {
  if (!embed.url) {
    return { valid: false, error: "URL is required" }
  }

  try {
    new URL(embed.url)
  } catch {
    return { valid: false, error: "Invalid URL format" }
  }

  if (!isApprovedIframeDomain(embed.url)) {
    return { valid: false, error: "Domain is not approved for embedding" }
  }

  return { valid: true }
}

/**
 * Serialize iframe embed to JSON string
 */
export function stringifyIframeEmbed(embed: IframeEmbed): string {
  return JSON.stringify({
    url: embed.url,
    title: embed.title || "",
    aspectRatio: embed.aspectRatio || "16:9",
    maxWidth: embed.maxWidth || "100%",
  })
}

/**
 * Parse iframe embed from JSON string
 */
export function parseIframeEmbed(jsonString: string): IframeEmbed | null {
  try {
    const parsed = JSON.parse(jsonString)
    if (!parsed.url || typeof parsed.url !== "string") {
      return null
    }
    return {
      url: parsed.url,
      title: parsed.title || undefined,
      aspectRatio: parsed.aspectRatio || "16:9",
      maxWidth: parsed.maxWidth || "100%",
    }
  } catch {
    return null
  }
}
