"use client"

import { useState, useMemo } from "react"
import Image from "next/image"
import { Play, Calendar, Tag, ExternalLink, Search, X } from "lucide-react"
import type { Video } from "@/app/actions/video-actions"

// ---------------------------------------------------------------------------
// Embed URL helpers (duplicated on client side for this component)
// ---------------------------------------------------------------------------

function getEmbedUrl(url: string): string | null {
  try {
    const u = new URL(url)

    const ytMatch =
      u.hostname.includes("youtube.com") && u.searchParams.get("v")
        ? u.searchParams.get("v")
        : u.hostname === "youtu.be"
          ? u.pathname.slice(1)
          : null
    if (ytMatch) return `https://www.youtube.com/embed/${ytMatch}?rel=0`

    if (u.hostname.includes("rumble.com")) {
      if (u.pathname.startsWith("/embed/")) return url
      const match = u.pathname.match(/\/v([^/]+)/)
      if (match) return `https://rumble.com/embed/v${match[1]}/`
    }

    if (u.hostname.includes("vimeo.com")) {
      const id = u.pathname.replace(/^\//, "").split("/")[0]
      if (/^\d+$/.test(id)) return `https://player.vimeo.com/video/${id}`
    }

    return null
  } catch {
    return null
  }
}

function formatDate(dateStr: string | null) {
  if (!dateStr) return null
  // Use UTC methods to avoid timezone-driven server/client mismatch
  const d = new Date(dateStr)
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
  return `${months[d.getUTCMonth()]} ${d.getUTCDate()}, ${d.getUTCFullYear()}`
}

// ---------------------------------------------------------------------------
// VideoCard
// ---------------------------------------------------------------------------

function VideoCard({ video }: { video: Video }) {
  const embedUrl = video.external_url ? getEmbedUrl(video.external_url) : null
  const hasDirectFile = !!video.video_url
  const hasExternalLink = !!video.external_url
  const isEmbeddable = !!embedUrl

  return (
    <article className="group flex flex-col border border-border bg-card hover:border-primary transition-colors">
      {/* Media area */}
      {isEmbeddable ? (
        <div className="relative aspect-video w-full overflow-hidden border-b border-border bg-black">
          <iframe
            src={embedUrl!}
            title={video.title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            loading="lazy"
            className="absolute inset-0 h-full w-full"
          />
        </div>
      ) : hasDirectFile ? (
        <div className="relative aspect-video w-full overflow-hidden border-b border-border bg-black">
          <video
            src={video.video_url!}
            controls
            preload="metadata"
            poster={video.thumbnail_url ?? undefined}
            className="absolute inset-0 h-full w-full object-contain"
            aria-label={video.title}
          />
        </div>
      ) : (
        <div className="relative aspect-video overflow-hidden border-b border-border bg-muted">
          {video.thumbnail_url ? (
            <Image
              src={video.thumbnail_url}
              alt={video.title}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 33vw"
            />
          ) : (
            <div className="absolute inset-0 tactical-grid" aria-hidden="true" />
          )}
          {hasExternalLink && (
            <a
              href={video.external_url!}
              target="_blank"
              rel="noopener noreferrer"
              className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 transition-opacity group-hover:opacity-100"
              aria-label={`Watch ${video.title}`}
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-primary bg-card/90 backdrop-blur-sm">
                <Play className="h-6 w-6 fill-primary text-primary" aria-hidden="true" />
              </div>
            </a>
          )}
          {!hasExternalLink && (
            <div className="absolute inset-0 flex items-center justify-center">
              <Play className="h-10 w-10 text-muted-foreground/30" aria-hidden="true" />
            </div>
          )}
        </div>
      )}

      {/* Card body */}
      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="flex items-center gap-3">
          {video.category && (
            <span className="flex items-center gap-1 label-mono text-xs text-primary">
              <Tag className="h-3 w-3" aria-hidden="true" />
              {video.category}
            </span>
          )}
          {video.date && (
            <span className="flex items-center gap-1 label-mono text-xs text-muted-foreground ml-auto">
              <Calendar className="h-3 w-3" aria-hidden="true" />
              {formatDate(video.date)}
            </span>
          )}
        </div>

        <h2 className="stencil text-base text-foreground leading-snug group-hover:text-primary transition-colors">
          {video.title}
        </h2>

        {video.description && (
          <p className="text-xs leading-relaxed text-muted-foreground flex-1">{video.description}</p>
        )}

        {hasExternalLink && !isEmbeddable && !hasDirectFile && (
          <a
            href={video.external_url!}
            target="_blank"
            rel="noopener noreferrer"
            className="label-mono mt-auto flex items-center gap-2 border border-border bg-background px-3 py-2 text-xs text-foreground hover:border-primary hover:text-primary transition-colors"
          >
            <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
            Watch Video
          </a>
        )}

        {hasExternalLink && hasDirectFile && (
          <a
            href={video.external_url!}
            target="_blank"
            rel="noopener noreferrer"
            className="label-mono mt-auto flex items-center gap-2 border border-border bg-background px-3 py-2 text-xs text-foreground hover:border-primary hover:text-primary transition-colors"
          >
            <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
            View Original Source
          </a>
        )}
      </div>
    </article>
  )
}

// ---------------------------------------------------------------------------
// VideosClient — search + grid
// ---------------------------------------------------------------------------

interface VideosClientProps {
  videos: Video[]
}

export function VideosClient({ videos }: VideosClientProps) {
  const [query, setQuery] = useState("")

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return videos
    return videos.filter(
      (v) =>
        v.title.toLowerCase().includes(q) ||
        (v.description ?? "").toLowerCase().includes(q) ||
        (v.category ?? "").toLowerCase().includes(q),
    )
  }, [videos, query])

  return (
    <>
      {/* Search bar */}
      <div className="border-b border-border bg-card">
        <div className="mx-auto max-w-7xl px-4 py-4 md:px-6">
          <div className="relative max-w-md">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search videos..."
              aria-label="Search videos"
              className="label-mono w-full border border-border bg-background py-2 pl-9 pr-9 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none transition-colors"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                aria-label="Clear search"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="mx-auto max-w-7xl px-4 py-10 md:px-6 md:py-12">
        {filtered.length === 0 ? (
          <div className="border border-border bg-card p-12 text-center">
            <Play className="mx-auto mb-4 h-10 w-10 text-muted-foreground/40" aria-hidden="true" />
            {query ? (
              <>
                <p className="stencil text-xl text-foreground">No results for &ldquo;{query}&rdquo;</p>
                <p className="label-mono mt-2 text-sm text-muted-foreground">Try a different search term.</p>
              </>
            ) : (
              <>
                <p className="stencil text-xl text-foreground">No videos published yet.</p>
                <p className="label-mono mt-2 text-sm text-muted-foreground">Check back soon.</p>
              </>
            )}
          </div>
        ) : (
          <>
            {query && (
              <p className="label-mono mb-6 text-xs text-muted-foreground">
                {filtered.length} result{filtered.length !== 1 ? "s" : ""} for &ldquo;{query}&rdquo;
              </p>
            )}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {filtered.map((video) => (
                <VideoCard key={video.id} video={video} />
              ))}
            </div>
          </>
        )}
      </div>
    </>
  )
}
