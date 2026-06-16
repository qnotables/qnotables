import Link from "next/link"
import { MessageSquare, MessageCircle, Clock, Image as ImageIcon } from "lucide-react"
import { timeAgo } from "@/lib/time"

interface ForumThreadCardProps {
  id: string
  title: string
  body: string
  authorName: string
  createdAt: string
  replyCount: number
}

// Strip markdown syntax cleanly — no (image) placeholder
function stripMarkdown(markdown: string): string {
  return (
    markdown
      .replace(/!\[[^\]]*\]\([^\)]*\)/g, "") // remove images entirely
      .replace(/\[([^\]]+)\]\([^\)]*\)/g, "$1")
      .replace(/[*_`~]/g, "")
      .replace(/^#+\s/gm, "")
      .replace(/^[\s-*+]\s/gm, "")
      .replace(/^>\s/gm, "")
      .replace(/\s+/g, " ")
      .trim()
  )
}

// Count embedded markdown images
function countImages(body: string): number {
  return (body.match(/!\[[^\]]*\]\(https?:\/\/[^\)]+\)/g) ?? []).length
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
  const timeAgoText = timeAgo(createdAt)
  const imageCount = countImages(body)

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
            {imageCount > 0 && (
              <div className="flex items-center gap-1 label-mono border border-border px-1.5 py-0.5">
                <ImageIcon className="h-3 w-3" />
                <span>{imageCount} {imageCount === 1 ? "image" : "images"}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </Link>
  )
}
