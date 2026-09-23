"use client"

import { useState } from "react"
import { ExternalLink, Play } from "lucide-react"
import { VideoEmbed } from "@/lib/video-embed-utils"

const DEFAULT_VIDEO_POSTER = "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/forgodandcountry-TG0SrqwsHdBFJaZPEfCcnJbwsZRCTP.png"

interface VideoEmbedBlockProps {
  embed: VideoEmbed
  showBadge?: boolean
}

export function VideoEmbedBlock({ embed, showBadge = true }: VideoEmbedBlockProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [poster, setPoster] = useState(embed.thumbnailUrl || DEFAULT_VIDEO_POSTER)
  const isDirectVideo = embed.platform === "direct"
  const isRumble = embed.platform === "rumble"
  const isX = embed.platform === "x"
  const isExternal = embed.platform === "external"

  return (
    <div className="my-6 space-y-3">
      {/* Video Container */}
      <div className="relative w-full overflow-hidden border border-border bg-muted/20">
        <div className="relative aspect-video w-full bg-black">
          {isDirectVideo ? (
            // Direct video player
            <video
              src={embed.embedUrl}
              poster={embed.thumbnailUrl}
              controls
              playsInline
              preload="metadata"
              className="h-full w-full object-cover"
            />
          ) : isRumble && !isPlaying ? (
            <button
              type="button"
              onClick={() => setIsPlaying(true)}
              aria-label={`Play video preview: ${embed.title || "Rumble video"}`}
              className="group relative flex h-full w-full items-center justify-center overflow-hidden bg-muted/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={poster}
                alt=""
                loading="lazy"
                decoding="async"
                onError={() => setPoster((currentPoster) => currentPoster === DEFAULT_VIDEO_POSTER ? currentPoster : DEFAULT_VIDEO_POSTER)}
                className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
              />
              <span aria-hidden="true" className="relative inline-flex size-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform group-hover:scale-105">
                <Play className="ml-0.5 size-6 fill-current" />
              </span>
              <span className="sr-only">Play Rumble video preview</span>
            </button>
          ) : isX ? (
            // X/Twitter embed - show thumbnail with link
            <a
              href={embed.originalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-full w-full items-center justify-center bg-black/80 transition-colors hover:bg-black"
            >
              {embed.thumbnailUrl && (
                <img
                  src={embed.thumbnailUrl}
                  alt={embed.title || "Video"}
                  className="absolute inset-0 h-full w-full object-cover opacity-40"
                />
              )}
              <div className="relative flex flex-col items-center gap-2 text-white">
                <Play className="h-12 w-12 fill-white" />
                <span className="text-xs text-white/80">View on X</span>
              </div>
            </a>
          ) : isExternal ? (
            // External link - show as card
            <a
              href={embed.originalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-full w-full items-center justify-center bg-gradient-to-br from-muted to-muted/50 transition-colors hover:from-muted/80 hover:to-muted/40"
            >
              <div className="flex flex-col items-center gap-3">
                <ExternalLink className="h-8 w-8 text-muted-foreground" />
                <span className="text-sm font-semibold text-foreground">Open External Link</span>
              </div>
            </a>
          ) : (
            // Platform iframe embed
            <iframe
              src={embed.embedUrl}
              title={embed.title || "Video"}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              referrerPolicy="strict-origin-when-cross-origin"
              sandbox="allow-scripts allow-same-origin allow-presentation"
              allowFullScreen
              className="h-full w-full border-0"
            />
          )}

          {/* Video Badge */}
          {showBadge && (
            <div className="absolute right-3 top-3 z-10 inline-flex items-center gap-1 border border-primary bg-primary/10 px-2 py-1 text-xs font-semibold text-primary backdrop-blur-sm">
              <Play className="h-3 w-3 fill-primary" />
              VIDEO
            </div>
          )}
        </div>
      </div>

      {/* Title and Caption */}
      {(embed.title || embed.caption) && (
        <div className="space-y-1">
          {embed.title && (
            <h3 className="font-semibold text-foreground line-clamp-2">{embed.title}</h3>
          )}
          {embed.caption && (
            <p className="text-sm text-muted-foreground line-clamp-3">{embed.caption}</p>
          )}
        </div>
      )}
    </div>
  )
}
