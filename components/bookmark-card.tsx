"use client"

import { ExternalLink, Trash2 } from "lucide-react"
import { getCategoryColor, formatBookmarkTime, getDomainFromUrl } from "@/lib/bookmarks"
import { deleteBookmark } from "@/app/actions/bookmark-actions"
import { useState } from "react"
import type { Bookmark } from "@/app/actions/bookmark-actions"

interface BookmarkCardProps {
  bookmark: Bookmark
  isOwner?: boolean
  isAdmin?: boolean
  onDelete?: (id: string) => void
}

export function BookmarkCard({ bookmark, isOwner = false, isAdmin = false, onDelete }: BookmarkCardProps) {
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this bookmark?")) return

    setIsDeleting(true)
    const result = await deleteBookmark(bookmark.id)

    if (result.success) {
      onDelete?.(bookmark.id)
    } else {
      alert(result.error || "Failed to delete bookmark")
    }
    setIsDeleting(false)
  }

  return (
    <div className="group relative border border-border bg-background/50 p-4 hover:bg-background hover:border-primary/50 transition-all">
      {/* Header */}
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <a
            href={bookmark.url}
            target="_blank"
            rel="noopener noreferrer"
            className="group/link flex items-start gap-2 hover:text-primary transition-colors"
          >
            <h3 className="stencil text-sm font-semibold text-foreground line-clamp-2 flex-1 group-hover/link:text-primary">
              {bookmark.title}
            </h3>
            <ExternalLink className="h-4 w-4 flex-shrink-0 mt-0.5 opacity-0 group-hover/link:opacity-100 transition-opacity" />
          </a>
          <p className="label-mono text-xs text-muted-foreground mt-1">
            {getDomainFromUrl(bookmark.url)}
          </p>
        </div>

        {/* Delete button */}
        {(isOwner || isAdmin) && (
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            title="Delete bookmark"
            className="flex-shrink-0 p-1 text-muted-foreground hover:text-destructive transition-colors disabled:opacity-50"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Description */}
      {bookmark.description && (
        <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
          {bookmark.description}
        </p>
      )}

      {/* Footer */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-border/50">
        <div className="flex items-center gap-2">
          {/* Category badge */}
          {bookmark.category && (
            <span className={`label-mono inline-flex items-center px-2 py-1 text-xs font-semibold border rounded ${getCategoryColor(bookmark.category)}`}>
              {bookmark.category}
            </span>
          )}

          {/* Submitted by */}
          {bookmark.submitted_by_name && (
            <span className="label-mono text-xs text-muted-foreground">
              by {bookmark.submitted_by_name}
            </span>
          )}
        </div>

        {/* Timestamp */}
        <span className="label-mono text-xs text-muted-foreground">
          {formatBookmarkTime(bookmark.created_at)}
        </span>
      </div>
    </div>
  )
}
