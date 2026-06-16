import Link from "next/link"
import { MessageSquare, MessageCircle, Clock } from "lucide-react"
import { timeAgo } from "@/lib/time"

interface ForumThreadCardProps {
  id: string
  title: string
  body: string
  authorName: string
  createdAt: string
  replyCount: number
}

// Strip markdown from text
function stripMarkdown(markdown: string): string {
  return (
    markdown
      .replace(/\[([^\]]+)\]\([^\)]*\)/g, "$1")
      .replace(/!\[([^\]]*)\]\([^\)]*\)/g, "(image)")
      .replace(/[*_`~]/g, "")
      .replace(/^#+\s/gm, "")
      .replace(/^[\s-*+]\s/gm, "")
      .replace(/^>\s/gm, "")
      .replace(/\s+/g, " ")
      .trim()
  )
}

export function ForumThreadCard({
  id,
  title,
  body,
  authorName,
  createdAt,
  replyCount,
}: ForumThreadCardProps) {
  const bodyPreview = stripMarkdown(body).slice(0, 100)
  const timeAgoText = timeAgo(new Date(createdAt))

  return (
    <Link
      href={`/forum/${id}`}
      className="group border border-border bg-card/30 p-4 rounded hover:border-primary hover:bg-card/50 transition-all"
    >
      <div className="flex items-start gap-3">
        <MessageSquare className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <h3 className="stencil font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-2">
            {title}
          </h3>
          <p className="line-clamp-1 mt-1.5 text-sm text-muted-foreground">{bodyPreview}</p>
          <div className="flex flex-wrap items-center gap-3 mt-3 text-xs text-muted-foreground">
            <span className="label-mono">{authorName}</span>
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              <span>{timeAgoText}</span>
            </div>
            <div className="flex items-center gap-1">
              <MessageCircle className="h-3 w-3" />
              <span>{replyCount} {replyCount === 1 ? "reply" : "replies"}</span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  )
}
