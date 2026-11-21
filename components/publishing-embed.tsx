"use client"

import { useState } from "react"
import { ExternalLink, Globe } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { PublishingEmbed } from "@/lib/publishing-embed"
import { cn } from "@/lib/utils"

function frameUrl(block: PublishingEmbed) {
  const bytes = new TextEncoder().encode(JSON.stringify(block))
  return `/api/publishing-embed?e=${btoa(String.fromCharCode(...bytes)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "")}`
}

export function PublishingEmbedCard({ block }: { block: PublishingEmbed }) {
  const [active, setActive] = useState(false)
  const [loading, setLoading] = useState(true)
  const { url, title, description, mode, target, kind, width, height } = block.payload
  const domain = url ? new URL(url).hostname : "Administrator-provided content"
  const interactive = (target || kind === "html") && mode !== "card" && mode !== "citation"
  const original = url && (
    <a href={url} target="_blank" rel="noopener noreferrer nofollow ugc" className="inline-flex max-w-full items-center gap-1.5 break-all text-sm text-primary underline-offset-4 hover:underline">
      {mode === "citation" ? title || domain : "Open original source"}
      <ExternalLink className="size-3.5 shrink-0" aria-hidden="true" />
    </a>
  )
  if (mode === "citation" && original) return <aside className="my-3 border-l-2 border-primary pl-3">{original}<span className="ml-2 break-all text-xs text-muted-foreground">{domain}</span></aside>
  return (
    <figure className={cn("my-4 w-full min-w-0 overflow-hidden border border-border bg-card", mode !== "full" && "mx-auto")} style={mode === "full" ? undefined : { maxWidth: width }}>
      <figcaption className="flex flex-col gap-2 p-4">
        <div className="flex min-w-0 items-center gap-2 text-xs text-muted-foreground">
          <Globe className="size-4 shrink-0" aria-hidden="true" />
          <span className="break-all">{domain}</span>
        </div>
        <strong className="break-words text-base text-foreground">{title || domain}</strong>
        {description && <p className="m-0 break-words text-sm text-muted-foreground">{description}</p>}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          {original}
          {interactive && <Button type="button" size="sm" variant="outline" aria-expanded={active} onClick={() => { setLoading(!active); setActive(!active) }}>{active ? "Hide inline content" : "Load inline content"}</Button>}
        </div>
      </figcaption>
      {active && interactive && (
        <div className="relative w-full border-t border-border bg-background" style={{ aspectRatio: `${width} / ${height}`, minHeight: kind === "audio" ? 70 : 135, maxHeight: height }}>
          {loading && <span role="status" className="absolute left-3 top-3 text-sm text-muted-foreground">Loading embed…</span>}
          <iframe src={frameUrl(block)} title={`${title || domain} — inline content`} referrerPolicy="no-referrer" loading="lazy" allowFullScreen onLoad={() => setLoading(false)} className="absolute inset-0 h-full w-full border-0" />
        </div>
      )}
    </figure>
  )
}
