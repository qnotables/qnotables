"use server"

import { revalidatePath } from "next/cache"
import { isAdminEmail } from "@/lib/admin"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { externalEmbedUrl, embedMode } from "@/lib/publishing-embed"
import { isFirstPartyEmbedHost } from "@/lib/embed-network"

export async function saveEmbedProvider(_previous: string, form: FormData): Promise<string> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || !isAdminEmail(user.email)) return "Not authorized."
  const url = externalEmbedUrl(String(form.get("origin") ?? "").trim(), true)
  if (!url || url.protocol !== "https:" || url.pathname !== "/" || url.search || url.hash || isFirstPartyEmbedHost(url.hostname)) return "Enter one public HTTPS origin with no path, query, or fragment."
  const db = createAdminClient()
  if (form.get("operation") === "remove") {
    const { error } = await db.from("embed_providers").delete().eq("origin", url.origin)
    if (error) return "Could not remove the provider."
    revalidatePath("/admin/embeds")
    return "Provider removed."
  }
  const mode = embedMode.safeParse(form.get("default_mode"))
  if (!mode.success) return "Choose a valid default display mode."
  const { error } = await db.from("embed_providers").upsert({
    origin: url.origin, enabled: form.has("enabled"), allow_frame: form.has("allow_frame"),
    allow_media: form.has("allow_media"), allow_preview: form.has("allow_preview"), default_mode: mode.data,
  })
  if (error) return "Could not save the provider."
  revalidatePath("/admin/embeds")
  return "Provider saved."
}
