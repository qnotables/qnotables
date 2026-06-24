"use client"

import { useState, useTransition } from "react"
import { Check, X, ExternalLink, Loader2, Clock, Bookmark } from "lucide-react"
import { approveBookmarkAdmin, rejectBookmarkAdmin } from "@/app/actions/bookmark-admin-actions"
import { timeAgo } from "@/lib/time"
import { getDomainFromUrl } from "@/lib/bookmarks"

function fmt(iso: string) {
  try {
    return timeAgo(iso)
  } catch {
    return "—"
  }
}

export interface PendingBookmark {
  id: string
  title: string
  url: string
  description?: string | null
  category?: string | null
  submitted_by_name?: string | null
  created_at: string
}

interface RowProps {
  bookmark: PendingBookmark
  onAction: (id: string) => void
}

function PendingBookmarkRow({ bookmark, onAction }: RowProps) {
  const [pending, startTransition] = useTransition()

  function act(action: "approve" | "reject") {
    startTransition(async () => {
      if (action === "approve") {
        await approveBookmarkAdmin(bookmark.id)
      } else {
        await rejectBookmarkAdmin(bookmark.id)
      }
      onAction(bookmark.id)
    })
  }

  return (
    <div className="border border-border bg-card p-4">
      <div className="mb-2 flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <Bookmark className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            <p className="font-semibold text-foreground">{bookmark.title}</p>
            {bookmark.category && (
              <span className="label-mono rounded border border-border px-1.5 py-0.5 text-xs text-muted-foreground">
                {bookmark.category}
              </span>
            )}
          </div>
          <div className="label-mono flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
            <span>{bookmark.submitted_by_name ?? "Anonymous"}</span>
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" /> {fmt(bookmark.created_at)}
            </span>
            <span className="truncate max-w-[200px]">{getDomainFromUrl(bookmark.url)}</span>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {pending ? (
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          ) : (
            <>
              <a
                href={bookmark.url}
                target="_blank"
                rel="noopener noreferrer"
                title="Preview URL"
                className="flex items-center gap-1 border border-border px-2 py-1 text-xs text-muted-foreground transition-colors hover:border-primary hover:text-primary"
              >
                <ExternalLink className="h-3 w-3" /> View
              </a>
              <button
                type="button"
                onClick={() => act("approve")}
                disabled={pending}
                title="Approve bookmark"
                className="flex items-center gap-1 border border-border px-2 py-1 text-xs text-muted-foreground transition-colors hover:border-primary hover:text-primary disabled:opacity-50"
              >
                <Check className="h-3.5 w-3.5" /> Approve
              </button>
              <button
                type="button"
                onClick={() => act("reject")}
                disabled={pending}
                title="Reject bookmark"
                className="flex items-center gap-1 border border-border px-2 py-1 text-xs text-muted-foreground transition-colors hover:border-destructive hover:text-destructive disabled:opacity-50"
              >
                <X className="h-3.5 w-3.5" /> Reject
              </button>
            </>
          )}
        </div>
      </div>
      {bookmark.description && (
        <p className="label-mono text-xs text-muted-foreground line-clamp-2">{bookmark.description}</p>
      )}
    </div>
  )
}

export function PendingBookmarksQueue({ bookmarks: initialBookmarks }: { bookmarks: PendingBookmark[] }) {
  const [bookmarks, setBookmarks] = useState(initialBookmarks)

  if (bookmarks.length === 0) {
    return (
      <div className="border border-border bg-muted/20 p-6 text-center">
        <p className="label-mono text-sm text-muted-foreground">No bookmarks pending review.</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2">
      {bookmarks.map((b) => (
        <PendingBookmarkRow
          key={b.id}
          bookmark={b}
          onAction={(id) => setBookmarks((prev) => prev.filter((x) => x.id !== id))}
        />
      ))}
    </div>
  )
}
