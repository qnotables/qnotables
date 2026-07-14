import { createVideoEmbed, detectVideoPlatform, extractThumbnailUrl, generateEmbedUrl, isValidVideoUrl } from "@/lib/video-embed-utils"

export type PostMedia =
  | { kind: "image"; src: string; alt?: string; identity: string }
  | { kind: "video"; src: string; poster?: string; title?: string; identity: string }
  | { kind: "embed"; src: string; poster?: string; title?: string; identity: string }

type JsonNode = {
  type?: string
  attrs?: Record<string, unknown>
  content?: JsonNode[]
}

const IMAGE_RE = /\.(?:avif|gif|jpe?g|png|webp)(?:[?#].*)?$/i
const VIDEO_RE = /\.(?:m4v|mov|mp4|ogg|webm)(?:[?#].*)?$/i

function safeUrl(value: unknown): string | null {
  if (typeof value !== "string" || !isValidVideoUrl(value)) return null
  return value.trim()
}

function mediaFromUrl(url: string, identity: string, title?: string, poster?: string): PostMedia | null {
  if (IMAGE_RE.test(url)) return { kind: "image", src: url, alt: title, identity }
  const platform = detectVideoPlatform(url)
  if (VIDEO_RE.test(url) || platform === "direct") {
    return { kind: "video", src: url, poster: safeUrl(poster) ?? undefined, title, identity }
  }
  if (platform !== "external" && platform !== "x") {
    return {
      kind: "embed",
      src: generateEmbedUrl(url, platform),
      poster: safeUrl(poster) ?? extractThumbnailUrl(url, platform) ?? undefined,
      title,
      identity,
    }
  }
  return null
}

function mediaFromNode(node: JsonNode, path: string): PostMedia | null {
  const attrs = node.attrs ?? {}
  const title = typeof attrs.title === "string" ? attrs.title : undefined
  const poster = typeof attrs.poster === "string" ? attrs.poster : typeof attrs.thumbnailUrl === "string" ? attrs.thumbnailUrl : undefined

  if (node.type === "image") {
    const src = safeUrl(attrs.src)
    if (src) return { kind: "image", src, alt: typeof attrs.alt === "string" ? attrs.alt : title, identity: `json:${path}` }
  }
  if (node.type === "videoBlock" || node.type === "video") {
    const src = safeUrl(attrs.src)
    if (src) return { kind: "video", src, poster: safeUrl(poster) ?? undefined, title, identity: `json:${path}` }
  }
  if (node.type === "embedBlock") {
    const original = safeUrl(attrs.originalUrl)
    const embed = safeUrl(attrs.embedUrl)
    const url = original ?? embed
    if (url) {
      const resolved = mediaFromUrl(url, `json:${path}`, title, poster)
      if (resolved) return resolved
      if (embed) return { kind: "embed", src: embed, poster: safeUrl(poster) ?? undefined, title, identity: `json:${path}` }
    }
  }
  if (node.type === "htmlEmbedBlock" && typeof attrs.html === "string") {
    const iframe = attrs.html.match(/<iframe[^>]+src=["']([^"']+)["']/i)?.[1]
    const src = safeUrl(iframe)
    if (src) return mediaFromUrl(src, `json:${path}`, title, poster) ?? { kind: "embed", src, title, identity: `json:${path}` }
  }

  for (let index = 0; index < (node.content?.length ?? 0); index += 1) {
    const media = mediaFromNode(node.content![index], `${path}.${index}`)
    if (media) return media
  }
  return null
}

function firstLegacyMedia(content: string): PostMedia | null {
  const candidates: Array<{ index: number; media: PostMedia }> = []
  const add = (index: number, media: PostMedia | null) => media && candidates.push({ index, media })
  let match: RegExpExecArray | null

  const comments = /<!--\s*(?:VIDEO|IFRAME)_EMBED:\s*({.*?})\s*-->/gi
  while ((match = comments.exec(content))) {
    try {
      const value = JSON.parse(match[1]) as Record<string, unknown>
      const url = safeUrl(value.originalUrl) ?? safeUrl(value.embedUrl) ?? safeUrl(value.url)
      if (url) add(match.index, mediaFromUrl(url, `text:${match.index}`, typeof value.title === "string" ? value.title : undefined, typeof value.thumbnailUrl === "string" ? value.thumbnailUrl : undefined) ?? { kind: "embed", src: url, identity: `text:${match.index}` })
    } catch {}
  }

  const tags = /<(img|video|iframe)\b[^>]*(?:src|data-src)=["']([^"']+)["'][^>]*>/gi
  while ((match = tags.exec(content))) {
    const url = safeUrl(match[2])
    if (!url) continue
    const poster = match[0].match(/poster=["']([^"']+)["']/i)?.[1]
    add(match.index, match[1].toLowerCase() === "img"
      ? { kind: "image", src: url, identity: `text:${match.index}` }
      : mediaFromUrl(url, `text:${match.index}`, undefined, poster) ?? { kind: "embed", src: url, identity: `text:${match.index}` })
  }

  const markdown = /!\[([^\]]*)\]\((https?:\/\/[^\s)]+)(?:\s+["'][^"']*["'])?\)/gi
  while ((match = markdown.exec(content))) {
    const url = safeUrl(match[2])
    if (url) add(match.index, mediaFromUrl(url, `text:${match.index}`, match[1]))
  }

  const urls = /https?:\/\/[^\s<>"')\]]+/gi
  while ((match = urls.exec(content))) {
    const url = safeUrl(match[0])
    if (url) add(match.index, mediaFromUrl(url, `text:${match.index}`))
  }

  candidates.sort((a, b) => a.index - b.index)
  return candidates[0]?.media ?? null
}

export function resolveFirstPostMedia(content?: string | null): PostMedia | null {
  if (!content) return null
  try {
    const parsed = JSON.parse(content) as JsonNode
    if (parsed?.type === "doc") return mediaFromNode(parsed, "0")
  } catch {}
  return firstLegacyMedia(content)
}

export function omitPostMedia(content: string, media: PostMedia | null): string {
  if (!media) return content
  if (media.identity.startsWith("json:")) {
    try {
      const doc = JSON.parse(content) as JsonNode
      const parts = media.identity.slice(5).split(".").map(Number).slice(1)
      let parent = doc
      for (const part of parts.slice(0, -1)) parent = parent.content?.[part] ?? parent
      const index = parts.at(-1)
      if (index !== undefined && parent.content) parent.content.splice(index, 1)
      return JSON.stringify(doc)
    } catch { return content }
  }

  const index = Number(media.identity.slice(5))
  if (!Number.isFinite(index)) return content
  const tail = content.slice(index)
  const patterns = [
    /^<!--[\s\S]*?(?:VIDEO|IFRAME)_EMBED:\s*{[\s\S]*?}\s*-->/i,
    /^<(?:img|video|iframe)\b[\s\S]*?(?:\/>|<\/(?:video|iframe)>)/i,
    /^!\[[^\]]*\]\(https?:\/\/[^\s)]+(?:\s+["'][^"']*["'])?\)/i,
    /^https?:\/\/[^\s<>"')\]]+/i,
  ]
  for (const pattern of patterns) {
    const match = tail.match(pattern)
    if (match) return content.slice(0, index) + tail.slice(match[0].length)
  }
  return content
}

export function toAbsoluteMediaUrl(url: string | null | undefined, siteUrl: string): string | null {
  if (!url) return null
  try { return new URL(url, siteUrl).toString() } catch { return null }
}

export function resolveSocialImage(options: { content?: string | null; customImage?: string | null; coverImage?: string | null; siteUrl: string }): string {
  const media = resolveFirstPostMedia(options.content)
  const automatic = media?.kind === "image" ? media.src : media?.poster
  return toAbsoluteMediaUrl(options.customImage || automatic || options.coverImage || "/images/og-default.png", options.siteUrl)!
}
