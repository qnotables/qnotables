import Image from "next/image"
import { Play, Calendar, Tag, ExternalLink } from "lucide-react"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { getPublishedVideos, type Video } from "@/app/actions/video-actions"

export const dynamic = "force-dynamic"

export const metadata = {
  title: "Videos | Qnotables",
  description: "Watch Qnotables video reports, updates, and featured media.",
}

// ---------------------------------------------------------------------------
// Embed URL helpers
// ---------------------------------------------------------------------------

function getEmbedUrl(url: string): string | null {
  try {
    const u = new URL(url)

    // YouTube: youtube.com/watch?v=ID or youtu.be/ID
    const ytMatch =
      u.hostname.includes("youtube.com") && u.searchParams.get("v")
        ? u.searchParams.get("v")
        : u.hostname === "youtu.be"
          ? u.pathname.slice(1)
          : null
    if (ytMatch) return `https://www.youtube.com/embed/${ytMatch}?rel=0`

    // Rumble: rumble.com/embed/ID or rumble.com/v...
    if (u.hostname.includes("rumble.com")) {
      // Direct embed URL
      if (u.pathname.startsWith("/embed/")) return url
      // Watch page: extract video slug and convert
      const match = u.pathname.match(/\/v([^/]+)/)
      if (match) return `https://rumble.com/embed/v${match[1]}/`
    }

    // Vimeo: vimeo.com/ID
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
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  })
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default async function VideosPage() {
  const videos = await getPublishedVideos()

  return (
    <div id="top" className="min-h-screen tactical-grid flex flex-col">
      <SiteHeader />

      <main className="flex-1">
        {/* Page header */}
        <div className="border-b border-border bg-card">
          <div className="mx-auto max-w-7xl px-4 py-12 md:px-6 md:py-16">
            <div className="flex items-center gap-3 mb-4">
              <span className="h-2 w-2 bg-primary" aria-hidden="true" />
              <span className="label-mono text-xs text-primary">MEDIA</span>
            </div>
            <h1 className="stencil text-5xl md:text-6xl text-foreground text-balance">Videos</h1>
            <p className="label-mono mt-3 text-sm text-muted-foreground max-w-2xl">
              Watch Qnotables video reports, updates, and featured media.
            </p>
          </div>
        </div>

        {/* Grid */}
        <div className="mx-auto max-w-7xl px-4 py-10 md:px-6 md:py-12">
          {videos.length === 0 ? (
            <div className="border border-border bg-card p-12 text-center">
              <Play className="mx-auto mb-4 h-10 w-10 text-muted-foreground/40" aria-hidden="true" />
              <p className="stencil text-xl text-foreground">No videos published yet.</p>
              <p className="label-mono mt-2 text-sm text-muted-foreground">Check back soon.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {videos.map((video) => (
                <VideoCard key={video.id} video={video} />
              ))}
            </div>
          )}
        </div>
      </main>

      <SiteFooter />
    </div>
  )
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
      {/* ── Media area ── */}
      {isEmbeddable ? (
        /* Native embed (YouTube / Rumble / Vimeo) */
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
        /* Uploaded video file — HTML5 player */
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
        /* Thumbnail / placeholder with optional external link overlay */
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
          {/* Play overlay for external links that can't be embedded */}
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

      {/* ── Card body ── */}
      <div className="flex flex-1 flex-col gap-3 p-4">
        {/* Meta row */}
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

        {/* Title */}
        <h2 className="stencil text-base text-foreground leading-snug group-hover:text-primary transition-colors">
          {video.title}
        </h2>

        {/* Description */}
        {video.description && (
          <p className="text-xs leading-relaxed text-muted-foreground flex-1">{video.description}</p>
        )}

        {/* CTA — only for non-embeddable external links */}
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

        {/* CTA — external link alongside an uploaded file */}
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
