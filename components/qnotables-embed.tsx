"use client"
// eslint-disable-next-line react-compiler/react-compiler
"use no memo"

import { useState } from "react"
import { ExternalLink } from "lucide-react"

export interface EmbedItem {
  id: string
  title: string
  source: string
  description: string
  embedUrl: string
  externalUrl?: string
}

interface EmbedSwitcherProps {
  items: EmbedItem[]
}

const ALLOWED_HOSTS = [
  "youtube.com",
  "youtube-nocookie.com",
  "youtu.be",
  "rumble.com",
  "odysee.com",
  "x.com",
  "twitter.com",
  "truthsocial.com",
  "vimeo.com",
  "player.vimeo.com",
  "dailymotion.com",
  "8kun.top",
  "bitchute.com",
  "minds.com",
  "gettr.com",
  "parler.com",
]

const VIDEO_EXTENSIONS = [".mp4", ".webm", ".mov"]

function checkIsDirectVideo(url: string): boolean {
  const lower = url.toLowerCase()
  return (
    VIDEO_EXTENSIONS.some((ext) => lower.endsWith(ext)) ||
    lower.includes(".mp4?") ||
    lower.includes(".webm?")
  )
}

function checkIsValidEmbed(url: string): boolean {
  if (!url) return false
  if (checkIsDirectVideo(url)) return true
  try {
    const { hostname } = new URL(url)
    return ALLOWED_HOSTS.some((host) => hostname.includes(host))
  } catch {
    return false
  }
}

function checkIsXEmbed(url: string): boolean {
  return url.includes("x.com") || url.includes("twitter.com")
}

/**
 * Reusable EmbedSwitcher component for displaying iframe/video embeds with a sidebar list.
 */
export function EmbedSwitcher({ items }: EmbedSwitcherProps) {
  const [activeId, setActiveId] = useState(items[0]?.id ?? "")
  const activeItem = items.find((item) => item.id === activeId)

  if (!items.length) {
    return (
      <div className="flex items-center justify-center border border-border bg-card p-8">
        <p className="text-muted-foreground">No embeds available</p>
      </div>
    )
  }

  const embedUrl = activeItem?.embedUrl ?? ""
  const validEmbed = checkIsValidEmbed(embedUrl)
  const xEmbed = checkIsXEmbed(embedUrl)
  const directVideo = checkIsDirectVideo(embedUrl)

  return (
    <div className="flex flex-col gap-0 border border-border bg-card overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border bg-muted/60 px-4 py-2.5">
        <div className="flex items-center gap-2">
          <span className="label-mono text-sm font-semibold text-primary">EMBED SWITCHER</span>
          <span className="label-mono hidden text-xs text-muted-foreground sm:inline">
            {"// "}{items.length} SOURCE{items.length !== 1 ? "S" : ""}
          </span>
        </div>
        {activeItem?.externalUrl && (
          <a
            href={activeItem.externalUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 label-mono text-xs text-muted-foreground transition-colors hover:text-primary"
            aria-label="Open in new tab"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">OPEN ORIGINAL</span>
          </a>
        )}
      </div>

      {/* Content area */}
      <div className="flex flex-col lg:flex-row flex-1">
        {/* Left sidebar */}
        <div className="flex flex-col w-full lg:w-64 border-b lg:border-b-0 lg:border-r border-border bg-muted/20">
          {items.map((item) => {
            const isActive = activeId === item.id
            return (
              <button
                key={item.id}
                onClick={() => setActiveId(item.id)}
                className={[
                  "flex flex-col gap-1 px-4 py-3 text-left border-b border-border transition-colors last:border-b-0",
                  isActive
                    ? "bg-primary/10 border-l-2 lg:border-l-0 lg:border-t-2 border-primary"
                    : "hover:bg-muted/50",
                ].join(" ")}
                aria-current={isActive ? "true" : "false"}
              >
                <span className="label-mono text-xs text-primary font-semibold">{item.source}</span>
                <span className="text-sm font-medium text-foreground line-clamp-2">{item.title}</span>
                <span className="label-mono text-xs text-muted-foreground line-clamp-1">{item.description}</span>
              </button>
            )
          })}
        </div>

        {/* Right side — player */}
        <div className="flex-1 flex flex-col">
          <div
            className="relative w-full flex-1 bg-background"
            style={{ minHeight: "480px" }}
          >
            {xEmbed && (
              <div className="flex flex-col items-center justify-center h-full gap-4 p-8">
                <p className="label-mono text-sm text-muted-foreground text-center">
                  X / Twitter content cannot be embedded directly.
                </p>
                <a
                  href={activeItem?.externalUrl ?? embedUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 label-mono text-sm text-primary border border-primary px-4 py-2 hover:bg-primary/10 transition-colors"
                >
                  <ExternalLink className="h-4 w-4" />
                  OPEN ON X
                </a>
              </div>
            )}

            {!xEmbed && validEmbed && directVideo && (
              <video
                key={activeItem?.id}
                src={embedUrl}
                className="absolute inset-0 h-full w-full object-contain"
                controls
                preload="metadata"
              />
            )}

            {!xEmbed && validEmbed && !directVideo && (
              <iframe
                key={activeItem?.id}
                src={embedUrl}
                title={activeItem?.title ?? "Embed"}
                className="absolute inset-0 h-full w-full border-0"
                loading="lazy"
                allowFullScreen
                referrerPolicy="strict-origin-when-cross-origin"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              />
            )}

            {!xEmbed && !validEmbed && (
              <div className="flex items-center justify-center h-full p-4">
                <p className="text-muted-foreground text-center">
                  {!embedUrl ? "No embed URL available" : "Invalid embed source"}
                </p>
              </div>
            )}
          </div>

          {activeItem?.embedUrl && (
            <div className="border-t border-border bg-muted/40 px-4 py-2">
              <p className="label-mono text-xs text-muted-foreground truncate">{activeItem.embedUrl}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
