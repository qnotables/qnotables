import Link from "next/link"
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

function formatDate(dateStr: string | null) {
  if (!dateStr) return null
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  })
}

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
              <span className="h-2 w-2 bg-primary" />
              <span className="label-mono text-xs text-primary">MEDIA</span>
            </div>
            <h1 className="stencil text-5xl md:text-6xl text-foreground text-balance">Videos</h1>
            <p className="label-mono mt-3 text-sm text-muted-foreground max-w-2xl">
              Watch Qnotables video reports, updates, and featured media.
            </p>
          </div>
        </div>

        {/* Video grid */}
        <div className="mx-auto max-w-7xl px-4 py-10 md:px-6 md:py-12">
          {videos.length === 0 ? (
            <div className="border border-border bg-card p-12 text-center">
              <Play className="mx-auto mb-4 h-10 w-10 text-muted-foreground" aria-hidden="true" />
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
  const hasLink = !!(video.external_url || video.video_url)
  const isExternal = !!video.external_url && !video.video_url
  const isUploaded = !!video.video_url

  return (
    <article className="group flex flex-col border border-border bg-card hover:border-primary transition-colors">
      {/* Thumbnail / video area */}
      <div className="relative aspect-video bg-muted overflow-hidden border-b border-border">
        {video.thumbnail_url ? (
          <Image
            src={video.thumbnail_url}
            alt={video.title}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 33vw"
          />
        ) : (
          <div className="absolute inset-0 bg-muted/60 tactical-grid" aria-hidden="true" />
        )}
        {/* Play overlay */}
        {hasLink && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-primary bg-card/90 backdrop-blur-sm">
              <Play className="h-6 w-6 text-primary fill-primary" aria-hidden="true" />
            </div>
          </div>
        )}
        {/* No-video placeholder icon when no thumbnail and no link */}
        {!video.thumbnail_url && !hasLink && (
          <div className="absolute inset-0 flex items-center justify-center">
            <Play className="h-10 w-10 text-muted-foreground/40" aria-hidden="true" />
          </div>
        )}
      </div>

      {/* Card body */}
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
          <p className="text-xs leading-relaxed text-muted-foreground flex-1">
            {video.description}
          </p>
        )}

        {/* Watch button — only rendered when there is a real URL */}
        {isUploaded && (
          <a
            href={video.video_url!}
            target="_blank"
            rel="noopener noreferrer"
            className="label-mono mt-auto flex items-center gap-2 border border-border bg-background px-3 py-2 text-xs text-foreground hover:border-primary hover:text-primary transition-colors"
          >
            <Play className="h-3.5 w-3.5" aria-hidden="true" />
            Watch Video
          </a>
        )}

        {isExternal && (
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
      </div>
    </article>
  )
}
