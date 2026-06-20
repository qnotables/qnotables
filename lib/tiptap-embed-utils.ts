/**
 * Tiptap Embed Utilities
 * Detects embeddable URLs pasted into the editor and resolves them to embed data.
 * Supports: YouTube, Rumble, Odysee, Vimeo, X/Twitter, Instagram, TikTok, and generic approved iframes.
 */

export type EmbedProvider =
  | "youtube"
  | "rumble"
  | "odysee"
  | "vimeo"
  | "x"
  | "instagram"
  | "tiktok"

export interface EmbedData {
  provider: EmbedProvider
  originalUrl: string
  embedUrl: string
  title: string
}

// ─── Extractors ───────────────────────────────────────────────────────────────

function extractYouTubeId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/v\/([a-zA-Z0-9_-]{11})/,
    /youtube-nocookie\.com\/embed\/([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/,
  ]
  for (const p of patterns) {
    const m = url.match(p)
    if (m?.[1]) return m[1]
  }
  return null
}

function extractRumbleId(url: string): string | null {
  // embed page: rumble.com/embed/v1abc23/
  const embedMatch = url.match(/rumble\.com\/embed\/([a-zA-Z0-9]+)/i)
  if (embedMatch?.[1]) return embedMatch[1]
  // video page: rumble.com/v1abc23-some-title.html
  const videoMatch = url.match(/rumble\.com\/(v[a-zA-Z0-9]+)/i)
  if (videoMatch?.[1]) return videoMatch[1]
  return null
}

function extractOdyseeId(url: string): string | null {
  // odysee.com/@Channel:hash/video-slug:hash
  const m = url.match(/odysee\.com\/@([^/]+)\/([^?&#]+)/i)
  if (m?.[1] && m?.[2]) return `${m[1]}/${m[2]}`
  // odysee.com/$/download/@Channel/video-slug
  const alt = url.match(/odysee\.com\/[^/]+\/@([^/]+)\/([^?&#]+)/i)
  if (alt?.[1] && alt?.[2]) return `${alt[1]}/${alt[2]}`
  return null
}

function extractVimeoId(url: string): string | null {
  const m = url.match(/vimeo\.com\/(\d+)/i)
  return m?.[1] ?? null
}

function extractTweetId(url: string): string | null {
  const m = url.match(/(?:twitter|x)\.com\/\w+\/status\/(\d+)/i)
  return m?.[1] ?? null
}

function extractInstagramId(url: string): string | null {
  const m = url.match(/instagram\.com\/(?:p|reel|tv)\/([a-zA-Z0-9_-]+)/i)
  return m?.[1] ?? null
}

function extractTikTokId(url: string): string | null {
  const m = url.match(/tiktok\.com\/@[^/]+\/video\/(\d+)/i)
  return m?.[1] ?? null
}

// ─── URL detector ─────────────────────────────────────────────────────────────

export function detectEmbedUrl(url: string): EmbedData | null {
  if (!url || typeof url !== "string") return null

  // Must be http/https
  try {
    const parsed = new URL(url)
    if (!["http:", "https:"].includes(parsed.protocol)) return null
  } catch {
    return null
  }

  const lower = url.toLowerCase()

  // YouTube
  if (lower.includes("youtube.com") || lower.includes("youtu.be")) {
    const id = extractYouTubeId(url)
    if (id) {
      return {
        provider: "youtube",
        originalUrl: url,
        embedUrl: `https://www.youtube-nocookie.com/embed/${id}?rel=0&modestbranding=1`,
        title: "YouTube Video",
      }
    }
  }

  // Rumble
  if (lower.includes("rumble.com")) {
    const id = extractRumbleId(url)
    if (id) {
      return {
        provider: "rumble",
        originalUrl: url,
        embedUrl: `https://rumble.com/embed/${id}/`,
        title: "Rumble Video",
      }
    }
  }

  // Odysee
  if (lower.includes("odysee.com")) {
    const id = extractOdyseeId(url)
    if (id) {
      return {
        provider: "odysee",
        originalUrl: url,
        embedUrl: `https://odysee.com/$/embed/${id}`,
        title: "Odysee Video",
      }
    }
  }

  // Vimeo
  if (lower.includes("vimeo.com")) {
    const id = extractVimeoId(url)
    if (id) {
      return {
        provider: "vimeo",
        originalUrl: url,
        embedUrl: `https://player.vimeo.com/video/${id}?color=ffffff&title=0&byline=0`,
        title: "Vimeo Video",
      }
    }
  }

  // X / Twitter
  if (lower.includes("twitter.com") || lower.includes("x.com")) {
    const id = extractTweetId(url)
    if (id) {
      return {
        provider: "x",
        originalUrl: url,
        embedUrl: url, // X embeds need their widget JS; stored as original URL
        title: "X / Twitter Post",
      }
    }
  }

  // Instagram
  if (lower.includes("instagram.com")) {
    const id = extractInstagramId(url)
    if (id) {
      return {
        provider: "instagram",
        originalUrl: url,
        embedUrl: `https://www.instagram.com/p/${id}/embed/`,
        title: "Instagram Post",
      }
    }
  }

  // TikTok
  if (lower.includes("tiktok.com")) {
    const id = extractTikTokId(url)
    if (id) {
      return {
        provider: "tiktok",
        originalUrl: url,
        embedUrl: `https://www.tiktok.com/embed/v2/${id}`,
        title: "TikTok Video",
      }
    }
  }

  return null
}

/** Returns true if a plain-text paste looks like an embeddable URL */
export function isEmbeddableUrl(text: string): boolean {
  return detectEmbedUrl(text.trim()) !== null
}
