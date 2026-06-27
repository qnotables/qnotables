"use client"

import Link from "next/link"
import { Clock, Tag, Video, FileText, ExternalLink, Star, BookMarked, Play } from "lucide-react"
import { ArchiveRecord } from "@/lib/archives-utils"
import { CardImage } from "@/components/card-image"
import { ShareButtons } from "@/components/share-buttons"
import { getSiteUrl } from "@/lib/rss-utils"
import { parseVideoEmbed } from "@/lib/video-embed-utils"
import { parseIframeEmbed } from "@/lib/iframe-embed-utils"
import { extractFirstVideo as extractForumVideo } from "@/lib/forum-utils"
import { extractThumbnailUrl, generateEmbedUrl, detectVideoPlatform } from "@/lib/video-embed-utils"

interface TiptapNode {
  type?: string
  attrs?: Record<string, string>
  content?: TiptapNode[]
}

type RecordMediaEmbed =
  | { kind: "iframe"; src: string; title?: string }
  | { kind: "direct-video"; src: string }
  | { kind: "thumbnail"; src: string; platform: string }

/**
 * Extracts the first embeddable/previewable media from an archive record's content.
 * Returns an iframe embed URL for YouTube/Rumble/Odysee (with a poster thumbnail),
 * a direct video src for uploaded videos, or null if none found.
 */
function extractRecordMedia(record: ArchiveRecord): RecordMediaEmbed | null {
  const content = record.content

  if (content) {
    // 1. Tiptap JSON: videoBlock (direct upload) / embedBlock (iframe)
    let doc: TiptapNode
    try { doc = JSON.parse(content) } catch { doc = { content: [] } }

    function walkTiptap(nodes?: TiptapNode[]): RecordMediaEmbed | null {
      if (!nodes) return null
      for (const node of nodes) {
        if (node.type === "videoBlock" && node.attrs?.src) {
          return { kind: "direct-video", src: node.attrs.src }
        }
        if (node.type === "embedBlock" && node.attrs?.src) {
          return { kind: "iframe", src: node.attrs.src, title: node.attrs.title }
        }
        const found = walkTiptap(node.content)
        if (found) return found
      }
      return null
    }

    const tiptap = walkTiptap(doc.content)
    if (tiptap) return tiptap

    // 2. <!-- VIDEO_EMBED: {...} --> comment
    const videoCommentMatch = content.match(/<!-- VIDEO_EMBED: ({.*?}) -->/)
    if (videoCommentMatch) {
      const embed = parseVideoEmbed(videoCommentMatch[1])
      if (embed?.embedUrl) {
        const thumb = extractThumbnailUrl(embed.originalUrl, embed.platform)
        if (thumb) return { kind: "thumbnail", src: thumb, platform: embed.platform }
        return { kind: "iframe", src: embed.embedUrl, title: embed.title }
      }
    }

    // 3. <!-- IFRAME_EMBED: {...} --> comment
    const iframeCommentMatch = content.match(/<!-- IFRAME_EMBED: ({.*?}) -->/)
    if (iframeCommentMatch) {
      const embed = parseIframeEmbed(iframeCommentMatch[1])
      if (embed?.url) return { kind: "iframe", src: embed.url, title: embed.title }
    }

    // 4. Bare video URL in markdown content
    const forumVideo = extractForumVideo(content)
    if (forumVideo) {
      if (forumVideo.type === "youtube") {
        const thumb = `https://img.youtube.com/vi/${forumVideo.videoId}/mqdefault.jpg`
        return { kind: "thumbnail", src: thumb, platform: "youtube" }
      }
      if (forumVideo.type === "rumble") {
        const embedUrl = `https://rumble.com/embed/${forumVideo.embedId}/`
        return { kind: "iframe", src: embedUrl }
      }
      if (forumVideo.type === "odysee") {
        const embedUrl = `https://odysee.com/embed/${forumVideo.path}`
        return { kind: "iframe", src: embedUrl }
      }
      if (forumVideo.type === "direct") {
        return { kind: "direct-video", src: forumVideo.url }
      }
    }
  }

  // 5. Video record with a direct video_url
  if (record.video_url) {
    const platform = detectVideoPlatform(record.video_url)
    if (platform === "direct") return { kind: "direct-video", src: record.video_url }
    const embedUrl = generateEmbedUrl(record.video_url, platform)
    const thumb = extractThumbnailUrl(record.video_url, platform)
    if (thumb) return { kind: "thumbnail", src: thumb, platform }
    return { kind: "iframe", src: embedUrl }
  }

  return null
}

interface LatestDispatchesProps {
  records: ArchiveRecord[]
  isLoading?: boolean
}

/**
 * Format date string using UTC parsing to avoid hydration mismatch from timezone differences
 */
function formatDateForDisplay(dateString: string): string {
  try {
    // Parse the ISO date string and extract components to avoid timezone conversion
    const [year, month, day] = dateString.split("T")[0].split("-")
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
    return `${months[parseInt(month) - 1]} ${parseInt(day)}, ${year}`
  } catch {
    return "Unknown Date"
  }
}


function getMediaIcon(mediaType?: string, hasEmbed?: boolean) {
  if (hasEmbed) {
    return { icon: Video, label: "VIDEO" }
  }
  
  if (!mediaType) return null
  const type = mediaType.toLowerCase()
  
  switch (type) {
    case "video":
      return { icon: Video, label: "VIDEO" }
    case "document":
      return { icon: FileText, label: "DOCUMENT" }
    case "external_link":
      return { icon: ExternalLink, label: "SOURCE" }
    default:
      if (type.includes("video")) {
        return { icon: Video, label: "VIDEO" }
      }
      if (type.includes("document")) {
        return { icon: FileText, label: "DOCUMENT" }
      }
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
          <h2 className="stencil text-2xl md:text-3xl text-foreground">LATEST NOTABLES</h2>
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
          <h2 className="stencil text-2xl md:text-3xl text-foreground">LATEST NOTABLES</h2>
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
        <h2 className="stencil text-2xl md:text-3xl text-foreground">LATEST NOTABLES</h2>
        <span className="ml-auto label-mono text-xs text-muted-foreground">{records.length} RECORDS</span>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {records.map((record) => {
          const recordMedia = extractRecordMedia(record)
          const hasEmbed = Boolean(recordMedia)
          const mediaInfo = getMediaIcon(record.media_type, hasEmbed)
          const hasThumbnail = Boolean(record.cover_image) || Boolean(recordMedia)

          return (
            <article
              key={record.id}
              className={`group border border-border rounded hover:border-primary/50 hover:bg-card/50 transition-all ${
                hasThumbnail ? "flex gap-4 p-4" : "p-4"
              }`}
            >
              {/* Thumbnail / video preview */}
              {hasThumbnail && (
                <div className="shrink-0 hidden sm:block">
                  <div className="w-24 h-24 rounded border border-border/50 overflow-hidden bg-muted relative">
                    {recordMedia?.kind === "direct-video" ? (
                      <>
                        <video
                          src={recordMedia.src}
                          playsInline
                          preload="metadata"
                          muted
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                          <Play className="h-5 w-5 text-white fill-white" />
                        </div>
                      </>
                    ) : recordMedia?.kind === "thumbnail" ? (
                      <>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={recordMedia.src}
                          alt={record.title}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                          <Play className="h-5 w-5 text-white fill-white" />
                        </div>
                      </>
                    ) : record.cover_image ? (
                      <CardImage
                        src={record.cover_image}
                        alt={record.title}
                        variant="contain"
                        mediaType={record.media_type}
                        aspectRatio="square"
                      />
                    ) : null}
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
                      <span>{formatDateForDisplay(record.published_at)}</span>
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

                  <div className="flex items-center gap-3">
                    <ShareButtons
                      title={record.title}
                      url={`${getSiteUrl()}/archives/${record.slug}`}
                      excerpt={record.excerpt || record.subtitle}
                      hashtags={record.tags}
                    />
                    <Link
                      href={`/archives/${record.slug}`}
                      className="label-mono text-xs font-semibold text-primary hover:underline whitespace-nowrap"
                    >
                      {record.type === "video" ? "WATCH" : "READ"} →
                    </Link>
                  </div>
                </div>
              </div>
            </article>
          )
        })}
      </div>
    </section>
  )
}
