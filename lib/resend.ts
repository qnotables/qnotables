import "server-only"
import { Resend } from "resend"

let client: Resend | null = null

/**
 * Returns a lazily-instantiated Resend client. Throws when the API key is not
 * configured so callers can surface a clean error without leaking the key.
 */
export function getResendClient(): Resend {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    throw new Error("RESEND_API_KEY is not configured")
  }
  if (!client) {
    client = new Resend(apiKey)
  }
  return client
}

export function isResendConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY)
}

/**
 * The verified QNotables sender. Overridable via RESEND_FROM_EMAIL so the
 * sender address is never hard-coded when the project stores it in the env.
 */
export function getDefaultSender(): string {
  return process.env.RESEND_FROM_EMAIL?.trim() || "QNotables <noreply@qnotables.ai>"
}

/** Extract the bare address from a "Name <email>" formatted sender string. */
export function getSenderEmail(): string {
  const from = getDefaultSender()
  const match = from.match(/<([^>]+)>/)
  return (match ? match[1] : from).trim()
}

/**
 * Build a "Name <email>" from string. When a display name is supplied it is
 * paired with the verified sender address; otherwise the default is used.
 */
export function buildSender(fromName?: string | null): string {
  const name = fromName?.trim()
  if (!name) return getDefaultSender()
  return `${name} <${getSenderEmail()}>`
}
