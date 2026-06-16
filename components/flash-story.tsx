import Link from "next/link"
import { Clock, Archive } from "lucide-react"
import { CardImage } from "@/components/card-image"

interface FlashStoryProps {
  title: string
  excerpt: string
  category?: string
  date: string
  readMinutes?: number
  image?: string
  slug?: string
  source?: string
  type: "archive" | "feed"
}

export function FlashStory({ 
  title, 
  excerpt, 
  category, 
  date,
  readMinutes,
  image,
  slug,
  source,
  type
}: FlashStoryProps) {
  const href = type === "archive" && slug ? `/archives/${slug}` : "#"
  
  return (
    <div className="border border-border bg-card overflow-hidden hover:border-primary/60 transition-colors">
      {/* Image section */}
      {image && (
        <div className="relative aspect-video w-full overflow-hidden bg-muted">
          <CardImage
            src={image}
            alt={title}
            variant="cover"
            aspectRatio="video"
            className="opacity-90 transition duration-300 hover:scale-[1.02]"
          />
          <div className="absolute left-0 top-0 flex items-center gap-2 p-3">
            <div className="flex items-center gap-2 bg-background/80 px-2 py-1 rounded backdrop-blur label-mono text-xs font-semibold text-primary">
              <Archive className="h-3 w-3" />
              FLASH
            </div>
            {category && (
              <span className="label-mono bg-background/80 px-2 py-1 text-foreground backdrop-blur text-xs rounded">
                {category}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Content section */}
      <div className="p-4 md:p-6">
        {/* Metadata */}
        <div className="label-mono flex items-center gap-3 text-xs text-muted-foreground mb-3">
          <span>{new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
          {readMinutes && (
            <>
              <span className="text-border">•</span>
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {readMinutes} MIN
              </div>
            </>
          )}
          {source && (
            <>
              <span className="text-border">•</span>
              <span>{source}</span>
            </>
          )}
        </div>

        {/* Title */}
        <Link href={href} className="block group mb-3">
          <h3 className="stencil text-2xl md:text-3xl leading-tight text-foreground group-hover:text-primary transition-colors">
            {title}
          </h3>
        </Link>

        {/* Excerpt */}
        <p className="text-sm md:text-base text-muted-foreground line-clamp-2 mb-4">
          {excerpt}
        </p>

        {/* Read button */}
        <Link
          href={href}
          className="label-mono text-sm font-semibold text-primary hover:underline inline-flex items-center gap-2"
        >
          READ MORE → 
        </Link>
      </div>
    </div>
  )
}
