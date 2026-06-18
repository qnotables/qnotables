import Link from "next/link"
import { Clock, Tag, Video, FileText, ExternalLink, Zap } from "lucide-react"
import { ArchiveRecord } from "@/lib/archives-utils"
import { CardImage } from "@/components/card-image"

interface TimelineCardProps {
  record: ArchiveRecord
  variant?: "default" | "compact"
}

export function TimelineCard({ record, variant = "default" }: TimelineCardProps) {
  const date = new Date(record.published_at)
  const dateStr = date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })

  if (variant === "compact") {
    return (
      <Link href={`/archives/${record.slug}`}>
        <article className="group border-l-2 border-primary/40 px-4 py-3 hover:border-primary hover:bg-card/50 transition-all">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <h4 className="stencil text-sm md:text-base text-foreground group-hover:text-primary transition-colors line-clamp-2">
                {record.title}
              </h4>
              <p className="label-mono mt-1 text-xs text-muted-foreground">{dateStr}</p>
            </div>
            {record.featured && <Zap className="h-4 w-4 shrink-0 text-primary fill-primary" />}
          </div>
        </article>
      </Link>
    )
  }

  return (
    <Link href={`/archives/${record.slug}`}>
      <article className="group border border-border rounded hover:border-primary/60 hover:bg-card/50 transition-all overflow-hidden">
        <div className="flex flex-col sm:flex-row gap-4 p-4">
          {/* Optional cover image */}
          {record.cover_image && (
            <div className="sm:w-32 sm:h-32 rounded overflow-hidden bg-muted shrink-0">
              <CardImage
                src={record.cover_image}
                alt={record.title}
                variant="cover"
                mediaType={record.media_type}
                aspectRatio="square"
                objectPosition="top"
              />
            </div>
          )}

          {/* Content */}
          <div className="flex-1 flex flex-col justify-between">
            {/* Top section */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                {record.featured && (
                  <span className="label-mono text-xs px-1.5 py-0.5 bg-primary/10 border border-primary/40 text-primary rounded">
                    FEATURED
                  </span>
                )}
                <span className="label-mono text-xs text-muted-foreground">{record.category}</span>
              </div>

              <h3 className="stencil text-lg md:text-xl text-foreground group-hover:text-primary transition-colors mb-2 line-clamp-2">
                {record.title}
              </h3>

              {record.excerpt && (
                <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{record.excerpt}</p>
              )}
            </div>

            {/* Bottom metadata */}
            <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-border/50">
              <span className="label-mono text-xs text-muted-foreground">{dateStr}</span>
              
              {record.readMinutes > 0 && (
                <span className="label-mono flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  {record.readMinutes} MIN
                </span>
              )}

              {record.media_type && (
                <span className="label-mono text-xs px-1.5 py-0.5 border border-border text-muted-foreground rounded">
                  {record.media_type.toUpperCase()}
                </span>
              )}

              {record.tags && record.tags.length > 0 && (
                <div className="flex gap-1 ml-auto">
                  {record.tags.slice(0, 1).map((tag) => (
                    <span key={tag} className="label-mono text-xs text-primary">
                      #{tag}
                    </span>
                  ))}
                  {record.tags.length > 1 && (
                    <span className="label-mono text-xs text-muted-foreground">+{record.tags.length - 1}</span>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </article>
    </Link>
  )
}
