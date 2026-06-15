"use client"

import { useState, useTransition } from "react"
import { Plus, Pencil, Trash2, Loader2, X, ExternalLink } from "lucide-react"
import { saveRssItem, deleteRssItem } from "@/app/dashboard/actions"
import { EmptyState, PrimaryButton, StatusBadge } from "@/components/dashboard/ui"

export interface RssItemRow {
  id: string
  title: string
  link: string | null
  description: string | null
  category: string | null
  source_name: string | null
  source_url: string | null
  image_url: string | null
  priority: string
  research_status: string | null
  status: string
  published_at: string | null
}

const PRIORITIES = ["low", "medium", "high", "critical"]
const STATUSES = ["draft", "published", "hidden"]

function RssForm({ item, onClose }: { item?: RssItemRow; onClose: () => void }) {
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const inputClass = "border border-border bg-background px-3 py-2 text-foreground outline-none focus:border-primary w-full"

  function onSubmit(formData: FormData) {
    setError(null)
    startTransition(async () => {
      const res = await saveRssItem(formData)
      if (res.success) onClose()
      else setError(res.error ?? "Failed to save")
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto border border-border bg-card p-6">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="stencil text-lg text-foreground">{item ? "Edit RSS Item" : "New RSS Item"}</h3>
          <button type="button" onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="h-5 w-5" />
          </button>
        </div>
        <form action={onSubmit} className="flex flex-col gap-4">
          {item ? <input type="hidden" name="id" value={item.id} /> : null}
          <div className="flex flex-col gap-1">
            <label className="label-mono text-muted-foreground">Title</label>
            <input name="title" required defaultValue={item?.title} className={inputClass} />
          </div>
          <div className="flex flex-col gap-1">
            <label className="label-mono text-muted-foreground">Description</label>
            <textarea name="description" rows={3} defaultValue={item?.description ?? ""} className={`${inputClass} resize-y`} />
          </div>
          <div className="flex flex-col gap-1">
            <label className="label-mono text-muted-foreground">Link</label>
            <input name="link" defaultValue={item?.link ?? ""} placeholder="https://…" className={inputClass} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="label-mono text-muted-foreground">Source Name</label>
              <input name="source_name" defaultValue={item?.source_name ?? ""} className={inputClass} />
            </div>
            <div className="flex flex-col gap-1">
              <label className="label-mono text-muted-foreground">Category</label>
              <input name="category" defaultValue={item?.category ?? ""} className={inputClass} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="label-mono text-muted-foreground">Priority</label>
              <select name="priority" defaultValue={item?.priority ?? "medium"} className={inputClass}>
                {PRIORITIES.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="label-mono text-muted-foreground">Status</label>
              <select name="status" defaultValue={item?.status ?? "draft"} className={inputClass}>
                {STATUSES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>
          {error ? <p className="label-mono text-destructive">{error}</p> : null}
          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={pending}
              className="label-mono inline-flex items-center gap-2 bg-primary px-4 py-2 font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {item ? "Update" : "Create"}
            </button>
            <button type="button" onClick={onClose} className="label-mono px-4 py-2 text-muted-foreground hover:text-foreground">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export function RssManager({ items }: { items: RssItemRow[] }) {
  const [rows, setRows] = useState(items)
  const [editing, setEditing] = useState<RssItemRow | null>(null)
  const [creating, setCreating] = useState(false)
  const [pending, startTransition] = useTransition()
  const [busyId, setBusyId] = useState<string | null>(null)

  function remove(id: string) {
    if (!confirm("Delete this RSS item permanently?")) return
    setBusyId(id)
    startTransition(async () => {
      const res = await deleteRssItem(id)
      if (res.success) setRows((prev) => prev.filter((r) => r.id !== id))
      setBusyId(null)
    })
  }

  function refresh() {
    setEditing(null)
    setCreating(false)
    window.location.reload()
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <PrimaryButton onClick={() => setCreating(true)}>
          <Plus className="h-4 w-4" /> New Item
        </PrimaryButton>
      </div>

      {rows.length === 0 ? (
        <EmptyState title="No RSS items yet" description="Curate feed items here. Published items appear in /feed.xml." />
      ) : (
        <div className="overflow-x-auto border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30 text-left">
                <th className="px-4 py-3 font-semibold">Title</th>
                <th className="px-4 py-3 font-semibold">Source</th>
                <th className="px-4 py-3 font-semibold">Priority</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((item) => (
                <tr key={item.id} className="border-b border-border hover:bg-muted/20">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-foreground">{item.title}</span>
                      {item.link ? (
                        <a href={item.link} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary">
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      ) : null}
                    </div>
                    {item.category ? <span className="label-mono text-xs text-muted-foreground">{item.category}</span> : null}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{item.source_name ?? "—"}</td>
                  <td className="px-4 py-3"><StatusBadge status={item.priority} /></td>
                  <td className="px-4 py-3"><StatusBadge status={item.status} /></td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      {busyId === item.id && pending ? (
                        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                      ) : (
                        <>
                          <button
                            type="button"
                            onClick={() => setEditing(item)}
                            title="Edit"
                            className="rounded px-2 py-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => remove(item.id)}
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
      )}

      {(editing || creating) && <RssForm item={editing ?? undefined} onClose={refresh} />}
    </div>
  )
}
