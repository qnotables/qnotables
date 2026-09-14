"use client"

import { useState } from "react"
import { Play } from "lucide-react"
import { CardImage } from "@/components/card-image"
import type { PostVideoMedia } from "@/lib/post-media"

export function PulseImagePreview({ src, alt }: { src: string; alt: string }) {
  const [hasError, setHasError] = useState(false)

  if (hasError) return null

  return (
    <CardImage
      src={src}
      alt={alt}
      aspectRatio="auto"
      className="h-full"
      onError={() => setHasError(true)}
    />
  )
}

export function PulseVideoPreview({ video, title }: { video: PostVideoMedia; title: string }) {
  const [isPlaying, setIsPlaying] = useState(false)
  const poster = video.poster

  if (!isPlaying) {
    return (
      <div className="relative aspect-video w-full overflow-hidden border border-border bg-muted/30">
        <button
          type="button"
          onClick={() => setIsPlaying(true)}
          aria-label={`Play video preview: ${title}`}
          className="group relative flex h-full w-full items-center justify-center text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset"
        >
          {poster ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={poster} alt="" loading="lazy" decoding="async" className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]" />
          ) : (
            <div aria-hidden="true" className="absolute inset-0 bg-muted" />
          )}
          <span aria-hidden="true" className="relative inline-flex size-11 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform group-hover:scale-105">
            <Play className="ml-0.5 size-5 fill-current" />
          </span>
          <span className="sr-only">Play video preview</span>
        </button>
      </div>
    )
  }

  return (
    <div className="relative aspect-video w-full overflow-hidden border border-border bg-muted/30">
      {video.kind === "video" ? (
        <video src={video.src} poster={video.poster} controls autoPlay playsInline preload="metadata" className="h-full w-full object-contain" title={video.title || title} />
      ) : (
        <iframe
          src={video.src}
          title={video.title || title}
          loading="lazy"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          referrerPolicy="strict-origin-when-cross-origin"
          sandbox="allow-scripts allow-same-origin allow-presentation"
          allowFullScreen
          className="h-full w-full border-0"
        />
      )}
    </div>
  )
}
