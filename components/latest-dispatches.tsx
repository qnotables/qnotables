"use client"

import Link from "next/link"
import { Clock, Tag, Video, FileText, ExternalLink, Star, BookMarked } from "lucide-react"
import { ArchiveRecord } from "@/lib/archives-utils"
import { CardImage } from "@/components/card-image"

interface LatestDispatchesProps {
  records: ArchiveRecord[]
  isLoading?: boolean
}

function getMediaIcon(mediaType?: string) {
  switch (mediaType) {
    case "video":
      return { icon: Video, label: "VIDEO" }
    case "document":
      return { icon: FileText, label: "DOCUMENT" }
    case "external_link":
      return { icon: ExternalLink, label: "SOURCE" }
    default:
      return null
  }
}

// Determine if a media type is a graph/chart
function isGraphImage(mediaType?: string): boolean {
  if (!mediaType) return false
  return mediaType.toLowerCase().includes("graph") ||
         mediaType.toLowerCase().includes("chart") ||
         mediaType.toLowerCase().includes("infographic") ||
         mediaType.toLowerCase().includes("diagram")
}

export function LatestDispatches({ records, isLoading }: LatestDispatchesProps) {
  if (isLoading) {
    return (
      <section className="mb-16">
        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-border">
          <BookMarked className="h-4 w-4 text-primary" />
          <h2 className="stencil text-2xl md:text-3xl text-foreground">LATEST DISPATCHES</h2>
        </div>
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="border border-border rounded p-4 animate-pulse">
              <div className="h-4 bg-muted rounded w-32 mb-3" />
              <div className="h-6 bg-muted rounded w-3/4 mb-2" />
              <div className="h-4 bg-muted rounded w-full" />
            </div>
          ))}
        </div>
      </section>
    )
  }

  if (records.length === 0) {
    return (
      <section className="mb-16">
        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-border">
          <BookMarked className="h-4 w-4 text-primary" />
          <h2 className="stencil text-2xl md:text-3xl text-foreground">LATEST DISPATCHES</h2>
        </div>
        <div className="border border-dashed border-border rounded p-12 text-center">
          <p className="label-mono text-muted-foreground">No records found for this search. Clear filters or check another archive category.</p>
        </div>
      </section>
    )
  }

  return (
    <section className="mb-16">
      <div className="flex items-center gap-3 mb-6 pb-4 border-b border-border">
        <BookMarked className="h-4 w-4 text-primary" />
        <h2 className="stencil text-2xl md:text-3xl text-foreground">LATEST DISPATCHES</h2>
        <span className="ml-auto label-mono text-xs text-muted-foreground">{records.length} RECORDS</span>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {records.map((record) => {
          const mediaInfo = getMediaIcon(record.media_type)
          const hasGraphImage = record.cover_image && isGraphImage(record.media_type)

          return (
            <article
              key={record.id}
              className={`group border border-border rounded hover:border-primary/50 hover:bg-card/50 transition-all ${
                hasGraphImage ? "flex gap-4 p-4" : "p-4"
              }`}
            >
              {/* Graph image preview (if applicable) */}
              {hasGraphImage && record.cover_image && (
                <div className="shrink-0 hidden sm:block">
                  <div className="w-32 h-32 rounded border border-border/50 overflow-hidden bg-muted">
                    <CardImage
                      src={record.cover_image}
                      alt={record.title}
                      variant="contain"
                      mediaType={record.media_type}
                      aspectRatio="square"
                    />
                  </div>
                </div>
              )}

              {/* Content */}
              <div className="flex-1 min-w-0">
                {/* Top metadata row */}
                <div className="label-mono flex flex-wrap items-center gap-2 mb-2 text-xs text-muted-foreground">
                  {record.category && (
                    <>
                      <span className="text-primary font-semibold uppercase">{record.category}</span>
                      <span className="text-border">•</span>
                    </>
                  )}
                  {record.post_type && (
                    <>
                      <span className="uppercase">{record.post_type}</span>
                      <span className="text-border">•</span>
                    </>
                  )}
                  {record.published_at && (
                    <>
                      <span>{new Date(record.published_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
                      <span className="text-border">•</span>
                    </>
                  )}
                  {record.readMinutes && (
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" /> {record.readMinutes} MIN
                    </span>
                  )}
                </div>

                {/* Title and subtitle */}
                <Link href={`/archives/${record.slug}`} className="block mb-2">
                  <h3 className="stencil text-lg md:text-xl leading-snug text-foreground group-hover:text-primary transition-colors">
                    {record.title}
                  </h3>
                  {record.subtitle && (
                    <p className="text-sm text-muted-foreground mt-0.5">{record.subtitle}</p>
                  )}
                </Link>

                {/* Excerpt */}
                {record.excerpt && (
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                    {record.excerpt}
                  </p>
                )}

                {/* Bottom row: tags, badges, and read button */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-border/50">
                  <div className="flex flex-wrap gap-1.5 items-center">
                    {record.featured && (
                      <span className="label-mono text-xs px-1.5 py-0.5 border border-primary/40 bg-primary/10 text-primary rounded">
                        FEATURED
                      </span>
                    )}
                    {mediaInfo && (
                      <span className="label-mono text-xs px-1.5 py-0.5 border border-border bg-muted/50 text-muted-foreground rounded flex items-center gap-1">
                        <mediaInfo.icon className="h-3 w-3" />
                        {mediaInfo.label}
                      </span>
                    )}
                    {record.source_name && (
                      <span className="label-mono text-xs text-muted-foreground">{record.source_name}</span>
                    )}
                    {record.tags && record.tags.length > 0 && (
                      <div className="flex gap-1 flex-wrap">
                        {record.tags.slice(0, 2).map((tag) => (
                          <Link
                            key={tag}
                            href={`/archives/tag/${encodeURIComponent(tag)}`}
                            className="label-mono text-xs px-1.5 py-0.5 border border-border text-muted-foreground hover:text-foreground hover:border-foreground rounded transition-colors"
                          >
                            #{tag}
                          </Link>
                        ))}
                        {record.tags.length > 2 && (
                          <span className="label-mono text-xs text-muted-foreground">+{record.tags.length - 2}</span>
                        )}
                      </div>
                    )}
                  </div>

                  <Link
                    href={`/archives/${record.slug}`}
                    className="label-mono text-xs font-semibold text-primary hover:underline whitespace-nowrap"
                  >
                    READ →
                  </Link>
                </div>
              </div>
            </article>
          )
        })}
      </div>
    </section>
  )
}
