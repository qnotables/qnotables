"use server"

import { isAdminEmail } from "@/lib/admin"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { embedInput } from "@/lib/publishing-embed"
import { resolvePublishingEmbed } from "@/lib/embed-resolver"
import { UnsafeEmbedDestination } from "@/lib/embed-network"

export async function previewPublishingEmbed(value: unknown) {
  const input = embedInput.safeParse(value)
  if (!input.success) return { error: "Check your URL, embed code, and dimensions." } as const
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "Sign in to preview embeds." } as const
  try {
    const { data, error } = await createAdminClient().rpc("consume_embed_preview", { p_actor: user.id })
    if (error) return { error: "Embed previews are temporarily unavailable." } as const
    if (!data) return { error: "Too many preview requests. Wait a minute and try again." } as const
    const resolved = await resolvePublishingEmbed(input.data, isAdminEmail(user.email))
    return { ...resolved, error: null } as const
  } catch (error) {
    if (error instanceof UnsafeEmbedDestination) return { error: "That source resolves to a restricted destination." } as const
    const message = error instanceof Error ? error.message : ""
    return { error: /^(?:Enter |Paste |The iframe |Custom |Add a nonempty)/.test(message) ? message : "Embed previews are temporarily unavailable." } as const
  }
}
