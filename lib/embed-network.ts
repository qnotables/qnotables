import { Resolver } from "node:dns/promises"
import { request as httpRequest } from "node:http"
import { request as httpsRequest } from "node:https"
import { BlockList, isIPv4 } from "node:net"
import type { IncomingHttpHeaders } from "node:http"
import { externalEmbedUrl } from "./publishing-embed"

const denied = new BlockList()
for (const [ip, bits] of [
  ["0.0.0.0", 8], ["10.0.0.0", 8], ["100.64.0.0", 10], ["127.0.0.0", 8], ["169.254.0.0", 16],
  ["172.16.0.0", 12], ["192.0.0.0", 24], ["192.0.2.0", 24], ["192.88.99.0", 24], ["192.168.0.0", 16],
  ["198.18.0.0", 15], ["198.51.100.0", 24], ["203.0.113.0", 24], ["224.0.0.0", 3],
] as const) denied.addSubnet(ip, bits)

export class UnsafeEmbedDestination extends Error {}

export const isPublicEmbedAddress = (ip: string) => isIPv4(ip) && !denied.check(ip)

export function isFirstPartyEmbedHost(host: string): boolean {
  const configured = [process.env.NEXT_PUBLIC_SITE_URL, process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL]
    .flatMap((value) => { try { return value ? [new URL(value).hostname] : [] } catch { return [] } })
  return ["qnotables.ai", "qnotables.com", "v0.build", "vercel.app", "supabase.co", ...configured]
    .some((domain) => host === domain || host.endsWith(`.${domain}`))
}

interface EmbedResponse { status: number; headers: IncomingHttpHeaders; body: string }
const redirects = new Set([301, 302, 303, 307, 308])

async function getPinned(url: URL, address: string, signal: AbortSignal): Promise<EmbedResponse> {
  return new Promise((resolve, reject) => {
    const request = (url.protocol === "https:" ? httpsRequest : httpRequest)(url, {
      agent: false, family: 4, signal,
      lookup: (_host, _options, callback) => callback(null, address, 4),
      headers: { accept: "text/html, application/pdf, image/*, audio/*, video/*;q=0.8", "accept-encoding": "identity", "user-agent": "QNotables-LinkPreview/1.0" },
      maxHeaderSize: 16 * 1024,
    }, (response) => {
      const status = response.statusCode ?? 0
      const headers = response.headers
      const result = { status, headers, body: "" }
      response.on("error", reject)
      if (status < 200 || status >= 300 || !/^(?:text\/html|application\/xhtml\+xml)(?:;|$)/i.test(headers["content-type"] ?? "") ||
          (headers["content-encoding"] && headers["content-encoding"] !== "identity")) {
        resolve(result)
        response.destroy()
        return
      }
      const chunks: Buffer[] = []
      let length = 0
      response.on("data", (chunk: Buffer) => {
        const remaining = 96 * 1024 - length
        chunks.push(chunk.subarray(0, remaining))
        length += chunk.length
        if (length >= 96 * 1024 || Buffer.concat(chunks).includes("</head>")) {
          resolve({ ...result, body: Buffer.concat(chunks).toString("utf8") })
          response.destroy()
        }
      })
      response.on("end", () => resolve({ ...result, body: Buffer.concat(chunks).toString("utf8") }))
    })
    request.on("error", reject)
    request.end()
  })
}

export async function fetchEmbedMetadata(source: URL, dependencies = { getPinned, resolve4: (host: string) => new Resolver({ timeout: 1000, tries: 1 }).resolve4(host) }) {
  const signal = AbortSignal.timeout(4500)
  let url = source
  let redirected = false
  for (let hop = 0; hop < 4; hop++) {
    if (signal.aborted) throw new Error("Metadata lookup timed out")
    if (!externalEmbedUrl(url.href) || isFirstPartyEmbedHost(url.hostname)) throw new UnsafeEmbedDestination("Destination not allowed")
    const addresses = await dependencies.resolve4(url.hostname)
    const address = addresses[0]
    if (addresses.some((ip) => !isPublicEmbedAddress(ip))) throw new UnsafeEmbedDestination("Destination not public")
    if (!address) throw new Error("No public IPv4 record")
    const response = await dependencies.getPinned(url, address, signal)
    if (!redirects.has(response.status)) return { ...response, url, redirected }
    if (typeof response.headers.location !== "string") throw new Error("Invalid redirect")
    const next = new URL(response.headers.location, url)
    if (url.protocol === "https:" && next.protocol !== "https:") throw new Error("Insecure redirect")
    url = next
    redirected = true
  }
  throw new Error("Too many redirects")
}

export function frameHeadersAllow(headers: IncomingHttpHeaders): boolean {
  return !headers["x-frame-options"] && !/(?:^|[;,])\s*frame-ancestors(?:\s|$)/i.test(String(headers["content-security-policy"] ?? ""))
}
