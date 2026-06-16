"use client"

import { ReactNode } from "react"

// Approved iframe domains
const APPROVED_IFRAME_DOMAINS = [
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

export interface SafeEmbedProps {
  provider?: "youtube" | "rumble" | "vimeo" | "odysee" | "bitchute" | "archive" | "google_docs" | "direct"
  url?: string
  iframeCode?: string
  title?: string
  type?: "video" | "iframe" | "document" | "social" | "external"
  aspectRatio?: "16:9" | "4:3" | "1:1"
  maxWidth?: string
}

function extractYouTubeId(url: string): string | null {
  const regex = /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube-nocookie\.com\/embed\/)([^&\n?#]+)/
  const match = url.match(regex)
  return match ? match[1] : null
}

function extractRumbleId(url: string): string | null {
  const regex = /(?:rumble\.com\/embed\/|rumble\.com\/videos?\/)([^?&#\n]+)/
  const match = url.match(regex)
  return match ? match[1] : null
}

function extractVimeoId(url: string): string | null {
  const regex = /vimeo\.com\/(\d+)/
  const match = url.match(regex)
  return match ? match[1] : null
}

function isApprovedDomain(url: string): boolean {
  try {
    const urlObj = new URL(url)
    const hostname = urlObj.hostname.toLowerCase()
    return APPROVED_IFRAME_DOMAINS.some(domain =>
      hostname === domain || hostname === domain.replace("www.", "") || hostname.endsWith("." + domain)
    )
  } catch {
    return false
  }
}

function sanitizeIframeCode(code: string): string {
  // Ensure it's actually an iframe tag
  if (!code.includes("<iframe")) {
    return ""
  }

  // Extract iframe attributes safely
  const iframeRegex = /<iframe([^>]*)>/i
  const match = code.match(iframeRegex)
  if (!match) return ""

  const attrsString = match[1]
  
  // Extract src attribute
  const srcRegex = /src=["']([^"']+)["']/i
  const srcMatch = attrsString.match(srcRegex)
  const src = srcMatch ? srcMatch[1] : ""

  // Verify src domain is approved
  if (!src || !isApprovedDomain(src)) {
    return ""
  }

  // Rebuild iframe with safe attributes
  return `<iframe src="${src}" loading="lazy" referrerPolicy="no-referrer-when-downgrade" sandbox="allow-presentation allow-same-origin allow-scripts" allowFullScreen style="width: 100%; max-width: 100%; aspect-ratio: 16/9; border: none; border-radius: 4px;"></iframe>`
}

export function SafeEmbed({
  provider,
  url,
  iframeCode,
  title,
  type = "video",
  aspectRatio = "16:9",
  maxWidth = "100%",
}: SafeEmbedProps): ReactNode {
  const aspectRatioValue = aspectRatio === "16:9" ? "56.25%" : aspectRatio === "4:3" ? "75%" : "100%"

  // Handle direct iframe code
  if (iframeCode && type === "iframe") {
    const sanitized = sanitizeIframeCode(iframeCode)
    if (sanitized) {
      return (
        <div style={{ maxWidth, margin: "1rem 0" }}>
          <div dangerouslySetInnerHTML={{ __html: sanitized }} />
        </div>
      )
    }
    return (
      <div style={{ maxWidth, margin: "1rem 0", padding: "1rem", background: "#2a2a2a", borderRadius: "4px", color: "#ff9900" }}>
        <p style={{ fontSize: "0.875rem", margin: 0 }}>
          Warning: This iframe domain is not approved for embedding.
        </p>
      </div>
    )
  }

  if (!url) {
    return (
      <div style={{ maxWidth, margin: "1rem 0", padding: "1rem", background: "#2a2a2a", borderRadius: "4px", color: "#ccc" }}>
        <p style={{ fontSize: "0.875rem", margin: 0 }}>No media URL provided</p>
      </div>
    )
  }

  // YouTube
  if (provider === "youtube" || url.includes("youtube.com") || url.includes("youtu.be")) {
    const videoId = extractYouTubeId(url)
    if (videoId) {
      return (
        <div style={{ maxWidth, margin: "1rem 0" }}>
          <div style={{ position: "relative", paddingBottom: aspectRatioValue }}>
            <iframe
              src={`https://www.youtube-nocookie.com/embed/${videoId}`}
              title={title || "YouTube video"}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              sandbox="allow-presentation allow-same-origin allow-scripts"
              allowFullScreen
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
                border: "none",
                borderRadius: "4px",
              }}
            />
          </div>
        </div>
      )
    }
  }

  // Rumble
  if (provider === "rumble" || url.includes("rumble.com")) {
    const rumbleId = extractRumbleId(url)
    if (rumbleId) {
      return (
        <div style={{ maxWidth, margin: "1rem 0" }}>
          <div style={{ position: "relative", paddingBottom: aspectRatioValue }}>
            <iframe
              src={`https://rumble.com/embed/${rumbleId}/`}
              title={title || "Rumble video"}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              sandbox="allow-presentation allow-same-origin allow-scripts allow-forms"
              allowFullScreen
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
                border: "none",
                borderRadius: "4px",
              }}
            />
          </div>
        </div>
      )
    }
  }

  // Vimeo
  if (provider === "vimeo" || url.includes("vimeo.com")) {
    const vimeoId = extractVimeoId(url)
    if (vimeoId) {
      return (
        <div style={{ maxWidth, margin: "1rem 0" }}>
          <div style={{ position: "relative", paddingBottom: aspectRatioValue }}>
            <iframe
              src={`https://player.vimeo.com/video/${vimeoId}`}
              title={title || "Vimeo video"}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              sandbox="allow-presentation allow-same-origin allow-scripts"
              allowFullScreen
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
                border: "none",
                borderRadius: "4px",
              }}
            />
          </div>
        </div>
      )
    }
  }

  // Odysee
  if (provider === "odysee" || url.includes("odysee.com")) {
    if (isApprovedDomain(url)) {
      return (
        <div style={{ maxWidth, margin: "1rem 0" }}>
          <div style={{ position: "relative", paddingBottom: aspectRatioValue }}>
            <iframe
              src={url}
              title={title || "Odysee video"}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              sandbox="allow-presentation allow-same-origin allow-scripts"
              allowFullScreen
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
                border: "none",
                borderRadius: "4px",
              }}
            />
          </div>
        </div>
      )
    }
  }

  // Fallback: external link
  if (type === "external" || type === "document") {
    return (
      <div style={{ maxWidth, margin: "1rem 0", padding: "1rem", background: "#2a2a2a", borderRadius: "4px" }}>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer nofollow"
          style={{ color: "#ff9900", textDecoration: "underline" }}
        >
          {title || "Open media"}
        </a>
      </div>
    )
  }

  // Unsupported provider
  return (
    <div style={{ maxWidth, margin: "1rem 0", padding: "1rem", background: "#2a2a2a", borderRadius: "4px", color: "#ff9900" }}>
      <p style={{ fontSize: "0.875rem", margin: 0 }}>Unsupported media provider or no valid URL</p>
    </div>
  )
}
