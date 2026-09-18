import "server-only"

import { normalizeEmbedVideoUrl } from "@/lib/embed-video-url"
import { createClient } from "@/lib/supabase/server"

export async function getEmbedLearnMoreUrl(): Promise<string | undefined> {
  try {
    const db = await createClient()
    const { data, error } = await db.rpc("get_embed_learn_more_url")
    if (error) {
      console.error("[embed-settings] Unable to load video URL:", error.message)
      return undefined
    }
    return typeof data === "string" ? normalizeEmbedVideoUrl(data) ?? undefined : undefined
  } catch {
    console.error("[embed-settings] Video URL unavailable")
    return undefined
  }
}
