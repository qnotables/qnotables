import { z } from "zod"

export const embedModes = ["auto", "website", "card", "media", "full", "citation"] as const
export const embedMode = z.enum(embedModes)
export const embedModeLabels: Record<z.infer<typeof embedMode>, string> = {
  auto: "Automatic", website: "Responsive website", card: "Rich link preview", media: "Inline media", full: "Full width", citation: "Compact citation",
}

export function externalEmbedUrl(value: string, addScheme = false): URL | null {
  if (!value || value.length > 2048 || /[\u0000-\u0020\u007f\\]/.test(value)) return null
  try {
    const url = new URL(addScheme && !/^[a-z][a-z\d+.-]*:/i.test(value) ? `https://${value}` : value)
    if (!["http:", "https:"].includes(url.protocol) || url.username || url.password || url.port ||
        !/^(?:[a-z\d](?:[a-z\d-]{0,61}[a-z\d])?\.)+[a-z](?:[a-z\d-]{0,61}[a-z\d])?$/i.test(url.hostname) ||
        /\.(?:localhost|local|internal|lan|home|corp|invalid|test|onion|alt)$/i.test(url.hostname) || url.hostname.endsWith(".home.arpa")) return null
    return url
  } catch { return null }
}

const urlString = z.string().refine((value) => externalEmbedUrl(value) !== null)
export const resolvedEmbed = z.object({
  url: urlString.nullable(), target: urlString.nullable(),
  kind: z.enum(["website", "video", "social", "pdf", "image", "audio", "file-video", "html"]),
  title: z.string().max(180), description: z.string().max(340),
  favicon: urlString.optional(), image: urlString.optional(),
  mode: embedMode, width: z.number().int().min(240).max(1600), height: z.number().int().min(135).max(1200),
  html: z.string().max(3000).optional(),
})

export const embedBlock = z.object({
  payload: resolvedEmbed,
  proof: z.string().regex(/^[a-f0-9]{64}$/),
})
export type PublishingEmbed = z.infer<typeof embedBlock>
export const embedInput = z.object({
  url: z.string().trim().max(2048), code: z.string().trim().max(4000),
  mode: embedMode, width: z.number().int().min(240).max(1600), height: z.number().int().min(135).max(1200),
  existing: embedBlock.optional(),
})

export function getEmbedBlock(attrs: unknown): PublishingEmbed | null {
  const parsed = embedBlock.safeParse(attrs)
  return parsed.success ? parsed.data : null
}
