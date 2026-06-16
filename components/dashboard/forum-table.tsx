"use client"

import { useMemo, useState, useTransition } from "react"
import { Pin, Lock, Star, Trash2, Search, Loader2, MessageSquare, EyeOff, Eye } from "lucide-react"
import { moderateThread, deleteThreadAdmin } from "@/app/dashboard/actions"
import { EmptyState } from "@/components/dashboard/ui"
import Link from "next/link"
import { normalizeCategoryName } from "@/lib/forum-utils"

export interface ForumThreadRow {
  id: string
  title: string
  author: string
  category: string | null
  replies: number
  createdAt: string
  isPinned: boolean
  isLocked: boolean
  isFeatured: boolean
  isHidden: boolean
}

function fmt(iso: string) {
  try {
    return new Date(iso).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  } catch {
    return "—"
  }
}

type Filter = "all" | "pinned" | "locked" | "featured" | "hidden"

export function ForumTable({ threads }: { threads: ForumThreadRow[] }) {
  const [query, setQuery] = useState("")
  const [filter, setFilter] = useState<Filter>("all")
  const [rows, setRows] = useState(threads)
  const [pending, startTransition] = useTransition()
  const [busyId, setBusyId] = useState<string | null>(null)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return rows.filter((t) => {
      const matchSearch =
        !q ||
        t.title.toLowerCase().includes(q) ||
        t.author.toLowerCase().includes(q) ||
        (t.category ?? "").toLowerCase().includes(q)

      const matchFilter =
        filter === "all" ||
        (filter === "pinned" && t.isPinned) ||
        (filter === "locked" && t.isLocked) ||
        (filter === "featured" && t.isFeatured) ||
        (filter === "hidden" && t.isHidden)

      return matchSearch && matchFilter
    })
  }, [rows, query, filter])

  function flag(
    id: string,
    field: "is_pinned" | "is_locked" | "is_featured" | "is_soft_deleted",
    value: boolean,
  ) {
    setBusyId(id)
    startTransition(async () => {
      const res = await moderateThread(id, field, value)
      if (res.success) {
        setRows((prev) =>
          prev.map((t) =>
            t.id === id
              ? {
                  ...t,
                  isPinned: field === "is_pinned" ? value : t.isPinned,
                  isLocked: field === "is_locked" ? value : t.isLocked,
                  isFeatured: field === "is_featured" ? value : t.isFeatured,
                  isHidden: field === "is_soft_deleted" ? value : t.isHidden,
                }
              : t,
          ),
        )
      }
      setBusyId(null)
    })
  }

  function remove(id: string) {
    if (!confirm("Delete this thread permanently? This cannot be undone.")) return
    setBusyId(id)
    startTransition(async () => {
      const res = await deleteThreadAdmin(id)
      if (res.success) setRows((prev) => prev.filter((t) => t.id !== id))
      setBusyId(null)
    })
  }

  if (rows.length === 0) {
    return (
      <EmptyState
        title="No forum threads"
        description="Threads created by users will appear here for moderation."
      />
    )
  }

  const filterOptions: { value: Filter; label: string }[] = [
    { value: "all", label: "All" },
    { value: "pinned", label: "Pinned" },
    { value: "locked", label: "Locked" },
    { value: "featured", label: "Featured" },
    { value: "hidden", label: "Hidden" },
  ]

  return (
    <div className="flex flex-col gap-4">
      {/* Search + filter bar */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search threads…"
            className="label-mono w-full border border-border bg-background py-2 pl-9 pr-3 text-sm text-foreground outline-none focus:border-primary"
          />
        </div>
        <div className="flex items-center gap-1">
          {filterOptions.map((o) => (
            <button
              key={o.value}
              type="button"
              onClick={() => setFilter(o.value)}
              className={`label-mono px-3 py-1.5 text-xs transition-colors ${
                filter === o.value
                  ? "bg-primary text-primary-foreground"
                  : "border border-border text-muted-foreground hover:border-primary hover:text-primary"
              }`}
            >
              {o.label}
            </button>
          ))}
        </div>
        <span className="label-mono ml-auto text-xs text-muted-foreground">
          {filtered.length} / {rows.length}
        </span>
      </div>

      <div className="overflow-x-auto border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/30 text-left">
              <th className="px-4 py-3 font-semibold">Thread</th>
              <th className="px-4 py-3 font-semibold">Author</th>
              <th className="px-4 py-3 font-semibold">Replies</th>
              <th className="px-4 py-3 font-semibold">Created</th>
              <th className="px-4 py-3 text-right font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((t) => (
              <tr
                key={t.id}
                className={`border-b border-border hover:bg-muted/20 ${t.isHidden ? "opacity-50" : ""}`}
              >
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1.5">
                    {t.isPinned && (
                      <Pin className="h-3 w-3 flex-shrink-0 text-primary" aria-label="Pinned" />
                    )}
                    {t.isLocked && (
                      <Lock
                        className="h-3 w-3 flex-shrink-0 text-muted-foreground"
                        aria-label="Locked"
                      />
                    )}
                    {t.isFeatured && (
                      <Star className="h-3 w-3 flex-shrink-0 text-amber-400" aria-label="Featured" />
                    )}
                    {t.isHidden && (
                      <EyeOff
                        className="h-3 w-3 flex-shrink-0 text-destructive"
                        aria-label="Hidden"
                      />
                    )}
                    <Link
                      href={`/forum/${t.id}`}
                      target="_blank"
                      className="font-semibold text-foreground underline-offset-4 hover:text-primary hover:underline"
                    >
                      {t.title}
                    </Link>
                  </div>
                  {t.category && (
                    <span className="label-mono block text-[10px] text-muted-foreground">
                      {normalizeCategoryName(t.category) ?? t.category}
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-muted-foreground">{t.author}</td>
                <td className="px-4 py-3 text-muted-foreground">
                  <span className="inline-flex items-center gap-1">
                    <MessageSquare className="h-3 w-3" /> {t.replies}
                  </span>
                </td>
                <td className="px-4 py-3 text-muted-foreground">{fmt(t.createdAt)}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-1">
                    {busyId === t.id && pending ? (
                      <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={() => flag(t.id, "is_pinned", !t.isPinned)}
                          title={t.isPinned ? "Unpin" : "Pin"}
                          className={`rounded px-2 py-1 transition-colors hover:bg-muted ${t.isPinned ? "text-primary" : "text-muted-foreground"}`}
                        >
                          <Pin className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => flag(t.id, "is_locked", !t.isLocked)}
                          title={t.isLocked ? "Unlock" : "Lock"}
                          className={`rounded px-2 py-1 transition-colors hover:bg-muted ${t.isLocked ? "text-primary" : "text-muted-foreground"}`}
                        >
                          <Lock className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => flag(t.id, "is_featured", !t.isFeatured)}
                          title={t.isFeatured ? "Unfeature" : "Feature"}
                          className={`rounded px-2 py-1 transition-colors hover:bg-muted ${t.isFeatured ? "text-amber-400" : "text-muted-foreground"}`}
                        >
                          <Star className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            flag(t.id, "is_soft_deleted", !t.isHidden)
                          }
                          title={t.isHidden ? "Restore" : "Hide"}
                          className={`rounded px-2 py-1 transition-colors hover:bg-muted ${t.isHidden ? "text-destructive" : "text-muted-foreground"}`}
                        >
                          {t.isHidden ? (
                            <Eye className="h-4 w-4" />
                          ) : (
                            <EyeOff className="h-4 w-4" />
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => remove(t.id)}
                          title="Delete permanently"
                          className="rounded px-2 py-1 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
