/**
 * Shared media utilities for the MarkdownEditor and TiptapEditor.
 *
 * Single source of truth for:
 *   - Upload limits / allowed types
 *   - File validation
 *   - The /api/upload fetch helper
 *   - Iframe HTML sanitization
 *   - Embed comment serialization used by the Markdown renderer
 */

// ─── Constants ────────────────────────────────────────────────────────────────

export const MAX_IMAGES = 5
export const MAX_VIDEOS = 3
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024 // 5 MB
export const MAX_VIDEO_BYTES = 500 * 1024 * 1024 // 500 MB

export const ALLOWED_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/gif",
])
export const ALLOWED_VIDEO_TYPES = new Set([
  "video/mp4",
  "video/webm",
  "video/quicktime",
  "video/mov",
])

export const ALLOWED_IMAGE_EXTS = /\.(jpg|jpeg|png|webp|gif)$/i
export const ALLOWED_VIDEO_EXTS = /\.(mp4|webm|mov)$/i

// Approved iframe src domains (mirrors SafeEmbed + iframe-embed-utils)
export const APPROVED_IFRAME_DOMAINS: readonly string[] = [
  "rumble.com",
  "www.rumble.com",
  "youtube.com",
  "www.youtube.com",
  "youtube-nocookie.com",
  "www.youtube-nocookie.com",
  "player.vimeo.com",
  "odysee.com",
  "bitchute.com",
  "www.bitchute.com",
  "archive.org",
  "docs.google.com",
  "drive.google.com",
  "twitter.com",
  "www.twitter.com",
  "www.tiktok.com",
  "tiktok.com",
  "spotify.com",
  "open.spotify.com",
  "truthsocial.com",
  "www.truthsocial.com",
]

// ─── Types ────────────────────────────────────────────────────────────────────

export interface UploadedMedia {
  id: string
  url: string
  filename: string
  size: number
  kind: "image" | "video"
  status: "uploading" | "done" | "error"
  error?: string
}

// ─── Validation ───────────────────────────────────────────────────────────────

export function validateMediaFile(
  file: File,
  kind: "image" | "video",
): string | null {
  if (kind === "image") {
    if (!ALLOWED_IMAGE_TYPES.has(file.type))
      return "Only JPG, PNG, WEBP, and GIF images are allowed."
    if (file.size > MAX_IMAGE_BYTES) return "Image must be 5 MB or smaller."
    const ext = "." + (file.name.split(".").pop() ?? "")
    if (!ALLOWED_IMAGE_EXTS.test(ext))
      return "Only JPG, PNG, WEBP, and GIF images are allowed."
  } else {
    if (!ALLOWED_VIDEO_TYPES.has(file.type))
      return "Only MP4, WEBM, and MOV videos are allowed."
    if (file.size > MAX_VIDEO_BYTES) return "Video must be 500 MB or smaller."
    const ext = "." + (file.name.split(".").pop() ?? "")
    if (!ALLOWED_VIDEO_EXTS.test(ext))
      return "Only MP4, WEBM, and MOV videos are allowed."
  }
  return null
}

// ─── Upload helper ────────────────────────────────────────────────────────────

export interface UploadResult {
  url: string
  filename: string
}

/**
 * Upload a single file to /api/upload.
 * Throws on network or server error.
 */
export async function uploadMediaFile(
  file: File,
  folder: "forum" | "blog",
): Promise<UploadResult> {
  const fd = new FormData()
  fd.append("file", file)
  fd.append("folder", folder)
  const res = await fetch("/api/upload", { method: "POST", body: fd })
  const json = await res.json()
  if (!res.ok || !json.success)
    throw new Error(json.error ?? "Upload failed.")
  return { url: json.url as string, filename: json.filename as string }
}

// ─── Iframe sanitizer ─────────────────────────────────────────────────────────

/** Attributes we allow to pass through on a sanitized <iframe>. */
const SAFE_IFRAME_ATTRS = new Set([
  "src",
  "title",
  "width",
  "height",
  "allow",
  "allowfullscreen",
  "loading",
  "referrerpolicy",
  "sandbox",
  "frameborder",
])

function isApprovedIframeSrc(src: string): boolean {
  try {
    const u = new URL(src)
    if (!["http:", "https:"].includes(u.protocol)) return false
    const host = u.hostname.toLowerCase()
    return APPROVED_IFRAME_DOMAINS.some(
      (d) =>
        host === d ||
        host === d.replace(/^www\./, "") ||
        host.endsWith("." + d.replace(/^www\./, "")),
    )
  } catch {
    return false
  }
}

/**
 * Sanitize an <iframe> HTML string:
 *   - Rejects non-iframe tags
 *   - Checks src domain against allowlist
 *   - Strips script/event-handler/javascript: content
 *   - Returns only safe attribute pairs
 *
 * Returns null when the input is rejected.
 */
export function sanitizeIframeHtml(raw: string): string | null {
  const trimmed = raw.trim()

  // Must be a single iframe tag (allow optional </iframe> closing)
  if (!/<iframe[\s>]/i.test(trimmed)) return null

  // Block any script injection
  if (/<script/i.test(trimmed)) return null
  if (/\bon\w+\s*=/i.test(trimmed)) return null // on* event handlers
  if (/javascript\s*:/i.test(trimmed)) return null

  // Extract src attribute
  const srcMatch = trimmed.match(/\bsrc\s*=\s*["']([^"']+)["']/i)
  const src = srcMatch?.[1]?.trim() ?? ""
  if (!src || !isApprovedIframeSrc(src)) return null

  // Parse all attributes
  const attrRegex = /\b([\w-]+)\s*=\s*(?:"([^"]*)"|'([^']*)')/gi
  const safeAttrs: string[] = []
  let m: RegExpExecArray | null

  while ((m = attrRegex.exec(trimmed)) !== null) {
    const name = m[1].toLowerCase()
    const value = m[2] ?? m[3] ?? ""
    if (!SAFE_IFRAME_ATTRS.has(name)) continue
    if (name === "src" && !isApprovedIframeSrc(value)) continue
    if (name === "sandbox") {
      // Only allow specific sandbox values
      const sanitizedSandbox = value
        .split(/\s+/)
        .filter((v) =>
          [
            "allow-presentation",
            "allow-same-origin",
            "allow-scripts",
            "allow-forms",
            "allow-popups",
            "allow-popups-to-escape-sandbox",
          ].includes(v),
        )
        .join(" ")
      safeAttrs.push(`sandbox="${sanitizedSandbox}"`)
      continue
    }
    // Prevent any value containing javascript:
    if (/javascript\s*:/i.test(value)) continue
    safeAttrs.push(`${name}="${value}"`)
  }

  // Always add safety defaults if not already present
  const attrStr = safeAttrs.join(" ")
  const hasLoading = /\bloading=/i.test(attrStr)
  const hasReferrer = /\breferrerpolicy=/i.test(attrStr)
  const hasSandbox = /\bsandbox=/i.test(attrStr)

  const defaults: string[] = []
  if (!hasLoading) defaults.push('loading="lazy"')
  if (!hasReferrer) defaults.push('referrerpolicy="no-referrer-when-downgrade"')
  if (!hasSandbox)
    defaults.push(
      'sandbox="allow-presentation allow-same-origin allow-scripts allow-forms"',
    )

  return `<iframe ${safeAttrs.join(" ")} ${defaults.join(" ")} allowfullscreen></iframe>`
}

// ─── Embed comment helpers ────────────────────────────────────────────────────

/**
 * Serialize an embed (from detectEmbedUrl) into the HTML-comment format
 * that the Markdown renderer recognises.
 */
export function embedToMarkdownComment(embed: {
  provider: string
  embedUrl: string
  title?: string
}): string {
  const payload = JSON.stringify({
    provider: embed.provider,
    url: embed.embedUrl,
    title: embed.title ?? "Embedded video",
    aspectRatio: "16/9",
  })
  return `\n<!-- IFRAME_EMBED: ${payload} -->\n`
}

/**
 * Serialize a raw sanitized iframe src into an IFRAME_EMBED comment
 * so the Markdown renderer can handle it uniformly.
 */
export function iframeToMarkdownComment(
  src: string,
  title = "Embedded content",
): string {
  const payload = JSON.stringify({
    provider: "iframe",
    url: src,
    title,
    aspectRatio: "16/9",
  })
  return `\n<!-- IFRAME_EMBED: ${payload} -->\n`
}
