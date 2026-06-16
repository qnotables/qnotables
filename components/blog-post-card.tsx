import Link from "next/link"
import { Calendar, BookOpen } from "lucide-react"

interface BlogPostCardProps {
  title: string
  excerpt: string
  date: string
  readMinutes?: number
  slug: string
}

export function BlogPostCard({ title, excerpt, date, readMinutes, slug }: BlogPostCardProps) {
  const formattedDate = new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })

  return (
    <Link
      href={`/blog/${slug}`}
      className="group border border-border bg-card/30 p-4 rounded hover:border-primary hover:bg-card/50 transition-all"
    >
      <div className="flex items-start gap-3">
        <BookOpen className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <h3 className="stencil font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-2">
            {title}
          </h3>
          <p className="line-clamp-2 mt-1.5 text-sm text-muted-foreground">{excerpt}</p>
          <div className="flex flex-wrap items-center gap-3 mt-3 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              <span>{formattedDate}</span>
            </div>
            {readMinutes && (
              <span className="label-mono">
                {readMinutes} {readMinutes === 1 ? "min" : "mins"} read
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  )
}
