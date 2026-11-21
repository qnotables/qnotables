import { decodeEmbed } from "@/lib/embed-trust"
import { externalEmbedUrl } from "@/lib/publishing-embed"
import { isFirstPartyEmbedHost } from "@/lib/embed-network"
import { getEmbedProvider, providerAllows } from "@/lib/embed-policy"

export const runtime = "nodejs"

const escape = (value: string) => value.replace(/[&<>"']/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[ch]!)

function frameDocument(markup: string, { frame = "'none'", image = "'none'", media = "'none'" } = {}, status = 200) {
  return new Response(`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>External embed</title><style>html{color-scheme:light dark;font:16px system-ui}body{margin:0}iframe,video,img{width:100%;height:100dvh;display:block;border:0;object-fit:contain}audio{width:100%}p,article{padding:.75rem;overflow-wrap:anywhere}</style></head><body>${markup}</body></html>`, {
    status,
    headers: {
      "Content-Type": "text/html; charset=utf-8", "Cache-Control": "private, no-store", "Referrer-Policy": "no-referrer", "X-Robots-Tag": "noindex, nofollow",
      "X-Content-Type-Options": "nosniff", "X-Frame-Options": "SAMEORIGIN",
      "Content-Security-Policy": `default-src 'none'; frame-ancestors 'self'; base-uri 'none'; form-action 'none'; object-src 'none'; style-src 'unsafe-inline'; frame-src ${frame}; img-src ${image}; media-src ${media}`,
    },
  })
}

const unavailable = () => frameDocument("<p>Inline content is unavailable. Use the original source link in the post.</p>", {}, 404)

export async function GET(request: Request) {
  const block = decodeEmbed(new URL(request.url).searchParams.get("e") ?? "")
  if (!block || ["card", "citation"].includes(block.payload.mode)) return unavailable()
  const { kind, target, title, html, url } = block.payload
  if (kind === "html") return html ? frameDocument(`<article>${html}</article>`) : unavailable()
  const destination = target && externalEmbedUrl(target)
  if (!destination || destination.protocol !== "https:" || isFirstPartyEmbedHost(destination.hostname)) return unavailable()
  try {
    const policy = await getEmbedProvider(destination.origin)
    if (!providerAllows(policy, kind)) return unavailable()
    const source = url && externalEmbedUrl(url)
    if (source && source.origin !== destination.origin) {
      const sourcePolicy = await getEmbedProvider(source.origin)
      if (sourcePolicy?.enabled === false) return unavailable()
    }
  } catch { return unavailable() }
  const src = escape(destination.href)
  const label = escape(title || destination.hostname)
  if (kind === "image") return frameDocument(`<img src="${src}" alt="${label}">`, { image: destination.origin })
  if (kind === "audio" || kind === "file-video") {
    const tag = kind === "audio" ? "audio" : "video"
    return frameDocument(`<${tag} src="${src}" controls playsinline preload="none" aria-label="${label}"></${tag}>`, { media: destination.origin })
  }
  const player = kind === "video" && ["https://www.youtube-nocookie.com", "https://player.vimeo.com"].includes(destination.origin)
  return frameDocument(`<iframe src="${src}" title="${label}" referrerpolicy="${player ? "strict-origin" : "no-referrer"}" sandbox="allow-scripts allow-presentation${player ? " allow-same-origin" : ""}" allowfullscreen></iframe>`, { frame: destination.origin })
}
