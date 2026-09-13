"use client"

import { useState, useTransition } from "react"
import { Archive, ExternalLink, FolderKanban, LoaderCircle, Trash2 } from "lucide-react"
import { deleteSavedSignal, type SavedSignal } from "@/app/actions/signal-actions"

export function SavedSignalsList({ initialSignals }: { initialSignals: SavedSignal[] }) {
  const [signals, setSignals] = useState(initialSignals)
  const [pendingId, setPendingId] = useState<string | null>(null)
  const [, startTransition] = useTransition()

  function removeSignal(id: string) {
    setPendingId(id)
    startTransition(async () => {
      try {
        await deleteSavedSignal(id)
        setSignals((current) => current.filter((signal) => signal.id !== id))
      } finally {
        setPendingId(null)
      }
    })
  }

  if (signals.length === 0) {
    return <p className="border border-dashed border-border px-4 py-10 text-center text-sm text-muted-foreground">No archived signals yet. Use the action menu on a feed card to save one.</p>
  }

  return (
    <div className="grid gap-4">
      {signals.map((signal) => {
        const Icon = signal.actionType === "dossier" ? FolderKanban : Archive
        return (
          <article key={signal.id} className="border border-border bg-card p-4">
            <div className="flex items-start gap-3">
              <Icon className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
              <div className="min-w-0 flex-1">
                <h2 className="stencil text-lg text-foreground">{signal.title}</h2>
                <p className="label-mono mt-1 text-[10px] text-muted-foreground">{signal.actionType === "dossier" ? "DOSSIER" : "ARCHIVE"} · {signal.source}</p>
                {signal.excerpt && <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-muted-foreground">{signal.excerpt}</p>}
                <a href={signal.url} target="_blank" rel="noopener noreferrer" className="label-mono mt-3 inline-flex items-center gap-1 text-xs text-primary hover:underline">
                  Open source <ExternalLink className="h-3 w-3" aria-hidden="true" />
                </a>
              </div>
              <button type="button" onClick={() => removeSignal(signal.id)} disabled={pendingId === signal.id} aria-label={`Remove ${signal.title}`} className="flex h-8 w-8 shrink-0 items-center justify-center border border-border text-muted-foreground transition-colors hover:border-destructive hover:text-destructive disabled:opacity-50">
                {pendingId === signal.id ? <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Trash2 className="h-4 w-4" aria-hidden="true" />}
              </button>
            </div>
          </article>
        )
      })}
    </div>
  )
}
