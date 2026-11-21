import "server-only"
import { createAdminClient } from "@/lib/supabase/admin"
import { embedMode, type PublishingEmbed } from "./publishing-embed"

export const providerColumns = "origin,enabled,allow_frame,allow_media,allow_preview,default_mode"

export async function getEmbedProvider(origin: string) {
  const { data, error } = await createAdminClient().from("embed_providers").select(providerColumns).eq("origin", origin).maybeSingle()
  if (error) throw new Error("Provider policy unavailable")
  return data
}

export function isInlineMedia(kind: PublishingEmbed["payload"]["kind"]) {
  return kind === "image" || kind === "audio" || kind === "file-video"
}

export function providerMode(provider: Awaited<ReturnType<typeof getEmbedProvider>>) {
  const result = embedMode.safeParse(provider?.default_mode)
  return result.success ? result.data : "auto"
}

export function providerAllows(provider: Awaited<ReturnType<typeof getEmbedProvider>>, kind: PublishingEmbed["payload"]["kind"]) {
  if (!provider?.enabled) return false
  if (isInlineMedia(kind)) return provider.allow_media === true
  return provider.allow_frame === true && (kind === "website" || provider.allow_media === true)
}
