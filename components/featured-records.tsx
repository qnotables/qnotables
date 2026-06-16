"use client"

import Link from "next/link"
import { Clock, Star, Video, FileText, Image as ImageIcon, ExternalLink } from "lucide-react"

interface FeaturedRecord {
  id: string
  slug: string
  title: string
  excerpt: string
  category: string
  post_type: string
  published_at: string
  source_name?: string
  priority: number
  cover_image?: string
  readMinutes?: number
  media_type?: string
  featured: boolean
}

interface FeaturedRecordsProps {
  records: FeaturedRecord[]
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

export function FeaturedRecords({ records }: FeaturedRecordsProps) {
  if (records.length === 0) return null

  return (
    <section id="featured" className="mb-16">
      <div className="flex items-center gap-3 mb-6 pb-4 border-b border-border">
        <Star className="h-4 w-4 text-primary fill-primary" />
        <h2 className="stencil text-2xl md:text-3xl text-foreground">FEATURED RECORDS</h2>
        <span className="ml-auto label-mono text-xs text-muted-foreground">{records.length} ITEMS</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {records.slice(0, 3).map((record) => (
          <article key={record.id} className="group border border-border rounded overflow-hidden hover:border-primary/50 transition-colors">
            {/* Cover image */}
            {record.cover_image && (
              <div className="aspect-video bg-muted overflow-hidden">
                <img
                  src={record.cover_image}
                  alt={record.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>
            )}

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
    </section>
  )
}
