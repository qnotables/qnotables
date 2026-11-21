import "server-only"
import { createHash } from "node:crypto"
import { load } from "cheerio"
import { createAdminClient } from "@/lib/supabase/admin"
import { sanitizeServerHtml } from "@/lib/server-html-sanitizer"
import { fetchEmbedMetadata, frameHeadersAllow, isFirstPartyEmbedHost, UnsafeEmbedDestination } from "./embed-network"
import { embedInput, externalEmbedUrl, resolvedEmbed, type PublishingEmbed } from "./publishing-embed"
import { getEmbedProvider, isInlineMedia, providerAllows, providerMode } from "./embed-policy"
import { signEmbed, verifyEmbed } from "./embed-trust"
import { z } from "zod"

type Kind = PublishingEmbed["payload"]["kind"]
const statuses = z.enum(["compatible", "restricted", "unavailable", "preview"])
const metadataSchema = resolvedEmbed.pick({ title: true, description: true, favicon: true, image: true, kind: true }).extend({ final: z.string(), frame: z.boolean() })

export function embeddedSource(url: URL): { target: URL; kind: Kind } {
  const { hostname, pathname } = url
  const target = (value: string, kind: Kind) => ({ target: new URL(value), kind })
  const youtube = hostname === "youtu.be" ? pathname.slice(1) :
    ["youtube.com", "www.youtube.com", "m.youtube.com", "www.youtube-nocookie.com"].includes(hostname)
      ? (pathname === "/watch" ? url.searchParams.get("v") : pathname.match(/^\/(?:embed|shorts|live)\/([^/]+)\/?$/)?.[1]) : null
  if (youtube && /^[\w-]{11}$/.test(youtube)) return target(`https://www.youtube-nocookie.com/embed/${youtube}`, "video")
  const vimeo = ["vimeo.com", "www.vimeo.com", "player.vimeo.com"].includes(hostname) && pathname.match(/^\/(?:video\/)?(\d+)\/?$/)?.[1]
  if (vimeo) return target(`https://player.vimeo.com/video/${vimeo}`, "video")
  if (hostname === "rumble.com" && /^\/embed\/v[a-z\d]+\/?$/i.test(pathname)) return { target: url, kind: "video" }
  const reddit = ["reddit.com", "www.reddit.com", "old.reddit.com", "www.redditmedia.com"].includes(hostname) && pathname.match(/^\/r\/([a-z\d_]{1,32})\/comments\/([a-z\d]{3,12})(?:\/|$)/i)
  if (reddit) return target(`https://www.redditmedia.com/r/${reddit[1]}/comments/${reddit[2]}/?ref_source=embed&ref=share&embed=true`, "social")
  return { target: url, kind: "website" }
}

function documentMetadata(html: string, base: URL) {
  const $ = load(html)
  const clean = (value: string | undefined, max: number) => (value ?? "").replace(/[\s\p{C}]+/gu, " ").trim().slice(0, max)
  const asset = (value: string | undefined) => {
    if (!value) return undefined
    try {
      const url = externalEmbedUrl(new URL(value, base).href)
      return url?.protocol === "https:" && !isFirstPartyEmbedHost(url.hostname) ? url.href : undefined
    } catch { return undefined }
  }
  return {
    title: clean($("meta[property='og:title']").attr("content") || $("title").first().text(), 180),
    description: clean($("meta[property='og:description']").attr("content") || $("meta[name='description']").attr("content"), 340),
    favicon: asset($("link[rel~='icon']").first().attr("href")),
    image: asset($("meta[property='og:image']").attr("content")),
  }
}

function mediaKind(type: string): Kind | null {
  if (type === "application/pdf") return "pdf"
  if (/^image\/(?:png|jpeg|gif|webp|avif)$/.test(type)) return "image"
  if (/^audio\/(?:mpeg|mp4|ogg|wav|webm|aac|flac)$/.test(type)) return "audio"
  if (/^video\/(?:mp4|webm|ogg)$/.test(type)) return "file-video"
  return null
}

async function inspectSource(source: URL, target: URL, kind: Kind, inspectTarget: boolean) {
  const key = createHash("sha256").update(JSON.stringify([source.href, target.href, inspectTarget])).digest("hex")
  const db = createAdminClient()
  const { data } = await db.from("embed_resolutions").select("metadata,status").eq("cache_key", key).gt("expires_at", new Date().toISOString()).maybeSingle()
  const cached = metadataSchema.safeParse(data?.metadata)
  const status = statuses.safeParse(data?.status)
  if (cached.success && status.success) return { metadata: cached.data, status: status.data }
  let metadata: z.infer<typeof metadataSchema> = { title: "", description: "", final: "", kind, frame: false }
  let result: z.infer<typeof statuses> = "unavailable"
  try {
    const sourceResult = await fetchEmbedMetadata(source)
    if (sourceResult.status >= 200 && sourceResult.status < 300) {
      metadata = { ...metadata, ...documentMetadata(sourceResult.body, sourceResult.url) }
      result = "preview"
    }
    if (inspectTarget) {
      const response = source.href === target.href ? sourceResult : await fetchEmbedMetadata(target)
      const type = (response.headers["content-type"] ?? "").split(";", 1)[0].trim().toLowerCase()
      const detected = mediaKind(type)
      if (response.status >= 200 && response.status < 300 && !response.redirected && target.protocol === "https:") {
        metadata = { ...metadata, final: response.url.href, kind: detected ?? kind, frame: frameHeadersAllow(response.headers) }
        result = (isInlineMedia(metadata.kind) || (metadata.frame && (detected === "pdf" || type === "text/html" || type === "application/xhtml+xml"))) ? "compatible" : "restricted"
      } else result = "restricted"
    }
  } catch (error) {
    if (error instanceof UnsafeEmbedDestination) throw error
  }
  await db.from("embed_resolutions").upsert({ cache_key: key, origin: source.origin, metadata, status: result, expires_at: new Date(Date.now() + (result === "unavailable" ? 5 : 60) * 60_000).toISOString() })
  return { metadata, status: result }
}

export async function resolvePublishingEmbed(input: z.infer<typeof embedInput>, allowHtml: boolean) {
  const { width, height } = input
  const existing = verifyEmbed(input.existing)
  let sourceText = input.url
  if (input.code) {
    const $ = load(input.code, {}, false)
    const iframe = $("iframe")
    if (iframe.length) {
      if (iframe.length !== 1 || $("*").length !== 1 || iframe.attr("srcdoc") !== undefined) throw new Error("Paste one iframe with a source URL and no surrounding HTML.")
      sourceText = iframe.attr("src") ?? ""
      if (!sourceText) throw new Error("The iframe needs an external source URL.")
    } else {
      if (!allowHtml) throw new Error("Custom HTML is restricted to administrators.")
      if ($("script,style,form,object,embed,svg,math,link,meta,base").length || $("*").toArray().some((element) => "attribs" in element && Object.keys(element.attribs).some((attr) => attr.startsWith("on")))) {
        throw new Error("Custom embeds cannot contain scripts, interactive elements, or event handlers.")
      }
      const html = sanitizeServerHtml(input.code, { allowedTags: ["p", "figure", "figcaption", "blockquote", "strong", "em", "ul", "ol", "li", "pre", "code", "h2", "h3", "hr", "br", "span"], allowedAttrs: [] })
      if (!html.trim() || html.length > 3000) throw new Error("Add a nonempty static HTML snippet under 3,000 characters.")
      const attribution = sourceText ? externalEmbedUrl(sourceText, true) : null
      if (sourceText && !attribution) throw new Error("Enter a valid attribution URL.")
      return { block: signEmbed({ url: attribution?.href ?? null, target: null, kind: "html", title: "Custom HTML", description: "Static HTML snippet", mode: input.mode, width, height, html }), status: "compatible" }
    }
  }
  if (!sourceText && existing?.payload.kind === "html" && allowHtml) {
    return { block: signEmbed({ ...existing.payload, mode: input.mode, width, height }), status: "compatible" }
  }
  const source = externalEmbedUrl(sourceText, true)
  if (!source || isFirstPartyEmbedHost(source.hostname)) throw new Error("Enter a public HTTP or HTTPS URL.")
  const candidate = embeddedSource(source)
  const sourcePolicy = await getEmbedProvider(source.origin)
  const policy = candidate.target.origin === source.origin ? sourcePolicy : await getEmbedProvider(candidate.target.origin)
  const mode = input.mode === "auto" ? providerMode(policy) : input.mode
  const inspectTarget = candidate.target.protocol === "https:" && Boolean(policy?.enabled && (policy.allow_frame || policy.allow_media)) && !["card", "citation"].includes(mode)
  const result = sourcePolicy && (!sourcePolicy.enabled || !sourcePolicy.allow_preview) && !inspectTarget
    ? null : await inspectSource(source, candidate.target, candidate.kind, inspectTarget)
  const metadata = result?.metadata
  const kind = metadata?.kind ?? candidate.kind
  const inline = result?.status === "compatible" && Boolean(metadata?.final) && providerAllows(policy, kind)
    && (mode !== "media" || kind !== "website") && (mode !== "website" || !isInlineMedia(kind))
  const previewAllowed = !sourcePolicy || (sourcePolicy.enabled && sourcePolicy.allow_preview)
  return { block: signEmbed({
    url: source.href, target: inline ? metadata!.final : null, kind,
    title: (previewAllowed && metadata?.title) || source.hostname, description: (previewAllowed && metadata?.description) || "",
    favicon: previewAllowed ? metadata?.favicon : undefined, image: previewAllowed ? metadata?.image : undefined,
    mode, width, height,
  }), status: inline ? "compatible" : result?.status === "unavailable" ? "unavailable" : inspectTarget ? "restricted" : "preview" }
}
