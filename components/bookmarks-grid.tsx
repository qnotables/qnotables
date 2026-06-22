"use client"

import { useState, useMemo } from "react"
import { BookmarkCard } from "@/components/bookmark-card"
import type { Bookmark } from "@/app/actions/bookmark-actions"

interface BookmarksGridProps {
  bookmarks: Bookmark[]
  userBookmarks?: string[] // IDs of user's own bookmarks
  isAdmin?: boolean
  onBookmarkDeleted?: (id: string) => void
}

export function BookmarksGrid({
  bookmarks,
  userBookmarks = [],
  isAdmin = false,
  onBookmarkDeleted,
}: BookmarksGridProps) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)

  // Get unique categories
  const categories = useMemo(() => {
    const cats = new Set(bookmarks.map((b) => b.category).filter(Boolean))
    return Array.from(cats).sort()
  }, [bookmarks])

  // Filter bookmarks by category
  const filteredBookmarks = useMemo(() => {
    if (!selectedCategory) return bookmarks
    return bookmarks.filter((b) => b.category === selectedCategory)
  }, [bookmarks, selectedCategory])

  if (bookmarks.length === 0) {
    return (
      <div className="p-8 md:p-12 text-center">
        <p className="label-mono text-muted-foreground">No bookmarks yet. Be the first to submit one!</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Category filter */}
      {categories.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`label-mono px-3 py-1 text-xs font-semibold border transition-colors ${
              selectedCategory === null
                ? "bg-primary text-primary-foreground border-primary"
                : "border-border bg-background text-foreground hover:border-primary"
            }`}
          >
            All ({bookmarks.length})
          </button>
          {categories.map((cat) => {
            const count = bookmarks.filter((b) => b.category === cat).length
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat ?? null)}
                className={`label-mono px-3 py-1 text-xs font-semibold border transition-colors ${
                  selectedCategory === cat
                    ? "bg-primary text-primary-foreground border-primary"
                    : "border-border bg-background text-foreground hover:border-primary"
                }`}
              >
                {cat} ({count})
              </button>
            )
          })}
        </div>
      )}

      {/* Bookmarks grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredBookmarks.map((bookmark) => (
          <BookmarkCard
            key={bookmark.id}
            bookmark={bookmark}
            isOwner={userBookmarks.includes(bookmark.id)}
            isAdmin={isAdmin}
            onDelete={onBookmarkDeleted}
          />
        ))}
      </div>

      {filteredBookmarks.length === 0 && (
        <div className="p-8 text-center">
          <p className="label-mono text-muted-foreground">No bookmarks in this category.</p>
        </div>
      )}
    </div>
  )
}
