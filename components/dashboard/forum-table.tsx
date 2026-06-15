"use client"

import { useMemo, useState, useTransition } from "react"
import { Pin, Lock, Star, Trash2, Search, Loader2, MessageSquare } from "lucide-react"
import { moderateThread, deleteThreadAdmin } from "@/app/dashboard/actions"
import { EmptyState } from "@/components/dashboard/ui"

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
}

function fmt(iso: string) {
  try {
    return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
  } catch {
    return "—"
  }
}

export function ForumTable({ threads }: { threads: ForumThreadRow[] }) {
  const [query, setQuery] = useState("")
  const [rows, setRows] = useState(threads)
  const [pending, startTransition] = useTransition()
  const [busyId, setBusyId] = useState<string | null>(null)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return rows
    return rows.filter(
      (t) => t.title.toLowerCase().includes(q) || t.author.toLowerCase().includes(q) || (t.category ?? "").toLowerCase().includes(q),
    )
  }, [rows, query])

  function flag(id: string, field: "is_pinned" | "is_locked" | "is_featured", value: boolean) {
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
    return <EmptyState title="No forum threads" description="Threads created by users will appear here for moderation." />
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search threads…"
          className="label-mono w-full border border-border bg-background py-2 pl-9 pr-3 text-sm text-foreground outline-none focus:border-primary"
        />
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
              <tr key={t.id} className="border-b border-border hover:bg-muted/20">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    {t.isPinned ? <Pin className="h-3 w-3 text-primary" aria-label="Pinned" /> : null}
                    {t.isLocked ? <Lock className="h-3 w-3 text-muted-foreground" aria-label="Locked" /> : null}
                    {t.isFeatured ? <Star className="h-3 w-3 text-primary" aria-label="Featured" /> : null}
                    <span className="font-semibold text-foreground">{t.title}</span>
                  </div>
                  {t.category ? <span className="label-mono text-xs text-muted-foreground">{t.category}</span> : null}
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
                          className={`rounded px-2 py-1 transition-colors hover:bg-muted ${t.isFeatured ? "text-primary" : "text-muted-foreground"}`}
                        >
                          <Star className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => remove(t.id)}
                          title="Delete"
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
