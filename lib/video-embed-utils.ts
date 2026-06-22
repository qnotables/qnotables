/**
 * Video Embed Utilities
 * Handles platform detection, URL validation, and embed URL generation for multiple video platforms
 */

export type VideoPlatform = "youtube" | "rumble" | "odysee" | "vimeo" | "x" | "direct" | "external"

export interface VideoEmbed {
  type: "video_embed"
  platform: VideoPlatform
  originalUrl: string
  embedUrl: string
  title?: string
  caption?: string
  thumbnailUrl?: string
}

/**
 * Detect video platform from URL
 */
export function detectVideoPlatform(url: string): VideoPlatform {
  if (!url) return "external"

  const urlLower = url.toLowerCase()

  // YouTube
  if (
    urlLower.includes("youtube.com") ||
    urlLower.includes("youtu.be") ||
    urlLower.includes("youtube-nocookie.com")
  ) {
    return "youtube"
  }

  // Rumble
  if (urlLower.includes("rumble.com")) {
    return "rumble"
  }

  // Odysee
  if (urlLower.includes("odysee.com") || urlLower.includes("lbry.tv")) {
    return "odysee"
  }

  // Vimeo
  if (urlLower.includes("vimeo.com")) {
    return "vimeo"
  }

  // X/Twitter
  if (urlLower.includes("twitter.com") || urlLower.includes("x.com")) {
    return "x"
  }

  // Direct video file
  if (
    urlLower.endsWith(".mp4") ||
    urlLower.endsWith(".webm") ||
    urlLower.endsWith(".mov") ||
    urlLower.includes(".mp4?") ||
    urlLower.includes(".webm?")
  ) {
    return "direct"
  }

  return "external"
}

/**
 * Validate that URL is a valid HTTP/HTTPS URL (no javascript: etc)
 */
export function isValidVideoUrl(url: string): boolean {
  if (!url || typeof url !== "string") return false

  // Block javascript: and data: URLs
  if (url.toLowerCase().startsWith("javascript:") || url.toLowerCase().startsWith("data:")) {
    return false
  }

  try {
    const parsed = new URL(url)
    return parsed.protocol === "http:" || parsed.protocol === "https:"
  } catch {
    return false
  }
}

/**
 * Extract video ID from YouTube URL
 */
function extractYouTubeId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/v\/([a-zA-Z0-9_-]{11})/,
    /youtube-nocookie\.com\/embed\/([a-zA-Z0-9_-]{11})/,
    /shorts\/([a-zA-Z0-9_-]{11})/,
  ]

  for (const pattern of patterns) {
    const match = url.match(pattern)
    if (match?.[1]) return match[1]
  }

  return null
}

/**
 * Extract video ID from Rumble URL
 */
function extractRumbleId(url: string): string | null {
  const match = url.match(/rumble\.com\/([a-zA-Z0-9]+)/i)
  return match?.[1] || null
}

/**
 * Extract channel/video from Odysee URL
 */
function extractOdyseeId(url: string): string | null {
  const match = url.match(/odysee\.com\/@([^/]+)\/([a-zA-Z0-9]+)/i)
  if (match?.[1] && match?.[2]) {
    return `${match[1]}/${match[2]}`
  }
  return null
}

/**
 * Extract video ID from Vimeo URL
 */
function extractVimeoId(url: string): string | null {
  const match = url.match(/vimeo\.com\/(\d+)/i)
  return match?.[1] || null
}

/**
 * Extract tweet ID from X/Twitter URL
 */
function extractTweetId(url: string): string | null {
  const match = url.match(/(?:twitter|x)\.com\/\w+\/status\/(\d+)/i)
  return match?.[1] || null
}

/**
 * Generate embed URL for the given video URL
 */
export function generateEmbedUrl(url: string, platform?: VideoPlatform): string {
  const detectedPlatform = platform || detectVideoPlatform(url)

  switch (detectedPlatform) {
    case "youtube": {
      const videoId = extractYouTubeId(url)
      if (videoId) {
        return `https://www.youtube-nocookie.com/embed/${videoId}?rel=0&modestbranding=1`
      }
      break
    }

    case "rumble": {
      const videoId = extractRumbleId(url)
      if (videoId) {
        return `https://rumble.com/embed/${videoId}/`
      }
      break
    }

    case "odysee": {
      const videoId = extractOdyseeId(url)
      if (videoId) {
        return `https://odysee.com/embed/${videoId}`
      }
      break
    }

    case "vimeo": {
      const videoId = extractVimeoId(url)
      if (videoId) {
        return `https://player.vimeo.com/video/${videoId}?h=&color=ffffff&title=0&byline=0&portrait=0`
      }
      break
    }

    case "x": {
      const tweetId = extractTweetId(url)
      if (tweetId) {
        // X embeds require their widget, but we'll use the status page as fallback
        return url
      }
      break
    }

    case "direct":
      return url

    default:
      return url
  }

  return url
}

/**
 * Extract thumbnail URL from video platforms
 */
export function extractThumbnailUrl(url: string, platform?: VideoPlatform): string | null {
  const detectedPlatform = platform || detectVideoPlatform(url)

  switch (detectedPlatform) {
    case "youtube": {
      const videoId = extractYouTubeId(url)
      if (videoId) {
        return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`
      }
      break
    }

    case "vimeo": {
      const videoId = extractVimeoId(url)
      if (videoId) {
        return `https://i.vimeocdn.com/video/${videoId}.jpg`
      }
      break
    }

    default:
      return null
  }

  return null
}

/**
 * Sanitize embed URL to prevent injection attacks
 */
export function sanitizeEmbedUrl(url: string): string {
  // Ensure it's a valid URL
  if (!isValidVideoUrl(url)) {
    return ""
  }

  try {
    const parsed = new URL(url)
    // Only allow safe protocols
    if (!["http:", "https:"].includes(parsed.protocol)) {
      return ""
    }
    return parsed.toString()
  } catch {
    return ""
  }
}

/**
 * Create a VideoEmbed object from a URL
 */
export function createVideoEmbed(
  originalUrl: string,
  options?: { title?: string; caption?: string }
): VideoEmbed | null {
  // Validate URL
  if (!isValidVideoUrl(originalUrl)) {
    return null
  }

  const platform = detectVideoPlatform(originalUrl)
  const embedUrl = generateEmbedUrl(originalUrl, platform)
  const thumbnailUrl = extractThumbnailUrl(originalUrl, platform)

  return {
    type: "video_embed",
    platform,
    originalUrl: sanitizeEmbedUrl(originalUrl) || originalUrl,
    embedUrl: sanitizeEmbedUrl(embedUrl) || embedUrl,
    title: options?.title,
    caption: options?.caption,
    thumbnailUrl: thumbnailUrl ?? undefined,
  }
}

/**
 * Parse video embed from JSON string
 */
export function parseVideoEmbed(json: string): VideoEmbed | null {
  try {
    const parsed = JSON.parse(json)
    if (parsed.type === "video_embed" && parsed.platform && parsed.embedUrl) {
      return parsed as VideoEmbed
    }
  } catch {
    // Invalid JSON
  }
  return null
}

/**
 * Serialize video embed to JSON string
 */
export function stringifyVideoEmbed(embed: VideoEmbed): string {
  return JSON.stringify(embed)
}
