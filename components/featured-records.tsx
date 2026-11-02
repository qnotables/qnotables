"use client"

import Link from "next/link"
import { useId, useRef } from "react"
import { Clock, Star, Video, FileText, Image as ImageIcon, ExternalLink, Play, ChevronLeft, ChevronRight } from "lucide-react"
import { ArchiveRecord } from "@/lib/archives-utils"
import { CardImage } from "@/components/card-image"
import { ShareButtons } from "@/components/share-buttons"
import { getSiteUrl } from "@/lib/rss-utils"
import { cn } from "@/lib/utils"

interface FeaturedRecordsProps {
  records: ArchiveRecord[]
  carousel?: boolean
}

function getMediaIcon(mediaType?: string) {
  switch (mediaType) {
    case "video":
      return <Video className="h-4 w-4" />
    case "document":
      return <FileText className="h-4 w-4" />
    case "image":
      return <ImageIcon className="h-4 w-4" />
    case "external_link":
      return <ExternalLink className="h-4 w-4" />
    default:
      return null
  }
}

function VideoPreview({ record }: { record: ArchiveRecord }) {
  const preview = record.video_preview
  if (!preview) return null

  const label = preview.title || `Watch the video in ${record.title}`

  return (
    <Link
      href={`/archives/${record.slug}`}
      aria-label={label}
      className="group/preview block"
    >
      <div className="relative aspect-video overflow-hidden bg-muted">
        {preview.kind === "video" ? (
          <video
            src={preview.src}
            poster={preview.poster}
            muted
            playsInline
            preload="metadata"
            tabIndex={-1}
            aria-hidden="true"
            className="h-full w-full object-cover"
            title={label}
          />
        ) : preview.poster ? (
          <img
            src={preview.poster}
            alt={`Video preview for ${record.title}`}
            loading="lazy"
            className="h-full w-full object-cover"
          />
        ) : null}

        <span className="absolute inset-0 flex items-center justify-center bg-background/20 transition-colors group-hover/preview:bg-background/35">
          <span className="flex h-11 w-11 items-center justify-center rounded-full border border-primary/70 bg-background/85 text-primary shadow-lg transition-transform group-hover/preview:scale-105">
            <Play className="ml-0.5 h-5 w-5 fill-current" aria-hidden="true" />
          </span>
        </span>
      </div>
    </Link>
  )
}

export function FeaturedRecords({ records, carousel = false }: FeaturedRecordsProps) {
  const trackRef = useRef<HTMLDivElement>(null)
  const trackId = useId()

  function scrollStories(direction: number) {
    const track = trackRef.current
    const card = track?.firstElementChild
    if (!track || !card) return
    const step = card.getBoundingClientRect().width + Number.parseFloat(getComputedStyle(track).columnGap || "0")
    track.scrollBy({ left: direction * step, behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth" })
  }

  if (records.length === 0) return null

  return (
    <section id="featured" className="mb-16">
      <div className="flex flex-wrap items-center gap-3 mb-6 pb-4 border-b border-border">
        <Star className="h-4 w-4 text-primary fill-primary" />
        <h2 className="stencil text-2xl md:text-3xl text-foreground">FEATURED RECORDS</h2>
        <span className="ml-auto label-mono text-xs text-muted-foreground">{records.length} ITEMS</span>
      </div>

      <div className={cn(carousel && "flex items-center gap-2 md:gap-3")}>
        {carousel && records.length > 1 && (
          <button type="button" aria-label="Previous featured story" aria-controls={trackId} onClick={() => scrollStories(-1)} className="flex size-10 shrink-0 items-center justify-center border border-border bg-background text-muted-foreground transition-colors hover:border-primary hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
            <ChevronLeft className="size-4" aria-hidden="true" />
          </button>
        )}
      <div
        ref={trackRef}
        id={trackId}
        role={carousel ? "region" : undefined}
        aria-label={carousel ? "Featured stories, scroll horizontally for more" : undefined}
        tabIndex={carousel ? 0 : undefined}
        className={carousel ? "flex min-w-0 flex-1 snap-x snap-mandatory gap-6 overflow-x-auto overscroll-x-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary" : "grid grid-cols-1 md:grid-cols-3 gap-6"}
      >
        {(carousel ? records : records.slice(0, 3)).map((record) => (
          <article key={record.id} className={cn("group border border-border rounded overflow-hidden hover:border-primary/50 transition-colors", carousel && "min-w-0 shrink-0 basis-[85%] snap-start sm:basis-[calc((100%_-_1.5rem)/2)] md:basis-[calc((100%_-_3rem)/3)]")}>
            {/* Video preview or cover image */}
            {record.video_preview ? (
              <VideoPreview record={record} />
            ) : record.cover_image ? (
              <div className="aspect-video overflow-hidden bg-muted transition-transform duration-300 group-hover:scale-105">
                <CardImage
                  src={record.cover_image}
                  alt={record.title}
                  variant="cover"
                  mediaType={record.media_type}
                  aspectRatio="video"
                />
              </div>
            ) : null}

            {/* Content */}
            <div className="p-4 space-y-3">
              {/* Metadata row */}
              <div className="label-mono flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                {record.category && (
                  <>
                    <span className="text-primary font-semibold">{record.category}</span>
                    <span>•</span>
                  </>
                )}
                {record.post_type && (
                  <>
                    <span>{record.post_type}</span>
                    <span>•</span>
                  </>
                )}
                {record.published_at && (
                  <span>{new Date(record.published_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
                )}
              </div>

              {/* Title */}
              <Link href={`/archives/${record.slug}`} className="block">
                <h3 className="stencil text-lg leading-snug text-foreground group-hover:text-primary transition-colors line-clamp-2">
                  {record.title}
                </h3>
              </Link>

              {/* Excerpt */}
              {record.excerpt && (
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {record.excerpt}
                </p>
              )}

              {/* Footer */}
              <div className="flex items-center gap-2 pt-2 border-t border-border/50">
                <div className="flex flex-1 items-center gap-2 text-xs text-muted-foreground">
                  {record.readMinutes && (
                    <>
                      <Clock className="h-3 w-3" />
                      <span>{record.readMinutes} MIN</span>
                    </>
                  )}
                  {record.media_type && (
                    <span className="text-primary">{getMediaIcon(record.media_type)}</span>
                  )}
                </div>
                <ShareButtons
                  title={record.title}
                  url={`${getSiteUrl()}/archives/${record.slug}`}
                  excerpt={record.excerpt}
                />
                <Link
                  href={`/archives/${record.slug}`}
                  className="label-mono text-xs font-semibold text-primary hover:underline"
                >
                  READ →
                </Link>
              </div>
            </div>
          </article>
        ))}
      </div>
        {carousel && records.length > 1 && (
          <button type="button" aria-label="Next featured story" aria-controls={trackId} onClick={() => scrollStories(1)} className="flex size-10 shrink-0 items-center justify-center border border-border bg-background text-muted-foreground transition-colors hover:border-primary hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
            <ChevronRight className="size-4" aria-hidden="true" />
          </button>
        )}
      </div>
    </section>
  )
}
