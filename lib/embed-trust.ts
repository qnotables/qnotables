import "server-only"
import { createHmac, timingSafeEqual } from "node:crypto"
import { getEmbedBlock, type PublishingEmbed } from "./publishing-embed"

function sign(payload: PublishingEmbed["payload"]) {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!key) throw new Error("Embed signing is not configured")
  return createHmac("sha256", key).update("publishing-embed:v1\0").update(JSON.stringify(payload)).digest("hex")
}

export function signEmbed(payload: PublishingEmbed["payload"]): PublishingEmbed {
  const normalized = getEmbedBlock({ payload, proof: "0".repeat(64) })
  if (!normalized) throw new Error("Invalid embed")
  return { payload: normalized.payload, proof: sign(normalized.payload) }
}

export function verifyEmbed(value: unknown): PublishingEmbed | null {
  const block = getEmbedBlock(value)
  if (!block || !process.env.SUPABASE_SERVICE_ROLE_KEY) return null
  return timingSafeEqual(Buffer.from(block.proof, "hex"), Buffer.from(sign(block.payload), "hex")) ? block : null
}

export function encodeEmbed(block: PublishingEmbed): string {
  return Buffer.from(JSON.stringify(block)).toString("base64url")
}

export function decodeEmbed(token: string): PublishingEmbed | null {
  if (token.length > 12000 || !/^[a-zA-Z0-9_-]+$/.test(token)) return null
  try { return verifyEmbed(JSON.parse(Buffer.from(token, "base64url").toString())) } catch { return null }
}

export function checkPublishingDocument(body: string, allowHtml: boolean) {
  let parsed: unknown
  try { parsed = JSON.parse(body) } catch { return { error: null, text: body, hasEmbeds: false, hasHtml: false } }
  if (!parsed || typeof parsed !== "object" || !("type" in parsed) || parsed.type !== "doc") return { error: null, text: body, hasEmbeds: false, hasHtml: false }
  let embeds = 0
  let hasHtml = false
  const text: string[] = []
  const walk = (value: unknown, depth: number): boolean => {
    if (depth > 48 || !value || typeof value !== "object") return false
    const node = value as { type?: string; attrs?: unknown; text?: unknown; content?: unknown }
    if (node.type === "publishingEmbed") {
      if (++embeds > 20 || node.content !== undefined) return false
      const block = verifyEmbed(node.attrs)
      if (!block || (!allowHtml && block.payload.kind === "html")) return false
      if (block.payload.kind === "html") hasHtml = true
    }
    if (node.type === "text" && typeof node.text === "string") text.push(node.text)
    return node.content === undefined || (Array.isArray(node.content) && node.content.every((child) => walk(child, depth + 1)))
  }
  const valid = walk(parsed, 0)
  return { error: valid ? null : "An embed is invalid or not permitted. Reinsert it and try again.", text: text.join(" "), hasEmbeds: embeds > 0, hasHtml }
}
