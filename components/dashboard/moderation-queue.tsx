"use client"

import { useState, useTransition } from "react"
import { Loader2, Check, X, Eye } from "lucide-react"
import { resolveFlag } from "@/app/dashboard/actions"
import { EmptyState, StatusBadge } from "@/components/dashboard/ui"

export interface FlagRow {
  id: string
  content_type: string
  content_id: string | null
  reason: string | null
  reporter: string | null
  status: string
  created_at: string
}

function fmt(iso: string) {
  try {
    return new Date(iso).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })
  } catch {
    return "—"
  }
}

export function ModerationQueue({ flags }: { flags: FlagRow[] }) {
  const [rows, setRows] = useState(flags)
  const [pending, startTransition] = useTransition()
  const [busyId, setBusyId] = useState<string | null>(null)

  function resolve(id: string, status: string) {
    setBusyId(id)
    startTransition(async () => {
      const res = await resolveFlag(id, status)
      if (res.success) setRows((prev) => prev.map((f) => (f.id === id ? { ...f, status } : f)))
      setBusyId(null)
    })
  }

  if (rows.length === 0) {
    return <EmptyState title="Queue is clear" description="No content has been flagged for review." />
  }

  return (
    <div className="overflow-x-auto border border-border">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-muted/30 text-left">
            <th className="px-4 py-3 font-semibold">Content</th>
            <th className="px-4 py-3 font-semibold">Reason</th>
            <th className="px-4 py-3 font-semibold">Reported</th>
            <th className="px-4 py-3 font-semibold">Status</th>
            <th className="px-4 py-3 text-right font-semibold">Actions</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((f) => (
            <tr key={f.id} className="border-b border-border hover:bg-muted/20">
              <td className="px-4 py-3">
                <p className="font-semibold capitalize text-foreground">{f.content_type}</p>
                {f.content_id ? <p className="label-mono text-xs text-muted-foreground">{f.content_id}</p> : null}
              </td>
              <td className="max-w-xs px-4 py-3 text-muted-foreground">{f.reason ?? "—"}</td>
              <td className="px-4 py-3 text-muted-foreground">{fmt(f.created_at)}</td>
              <td className="px-4 py-3"><StatusBadge status={f.status} /></td>
              <td className="px-4 py-3">
                <div className="flex items-center justify-end gap-1">
                  {busyId === f.id && pending ? (
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => resolve(f.id, "reviewed")}
                        title="Mark reviewed"
                        className="rounded px-2 py-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => resolve(f.id, "actioned")}
                        title="Mark actioned"
                        className="rounded px-2 py-1 text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary"
                      >
                        <Check className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => resolve(f.id, "dismissed")}
                        title="Dismiss"
                        className="rounded px-2 py-1 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                      >
                        <X className="h-4 w-4" />
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
  )
}
