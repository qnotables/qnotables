"use server"

import { publishFooterConfig, saveFooterDraft } from "@/lib/footer-config"

export async function saveFooter(config: unknown) {
  return saveFooterDraft(config)
}

export async function publishFooter() {
  return publishFooterConfig()
}
