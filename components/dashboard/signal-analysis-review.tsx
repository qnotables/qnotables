"use client"

import { useState, useTransition } from "react"
import { Check, ExternalLink, Loader2, Play, X } from "lucide-react"
import { reviewSignalAnalysisItem, runSignalAnalysisAction } from "@/app/dashboard/actions"
import type { SignalAnalysisItem, SignalAnalysisStatus } from "@/lib/signal-analysis"
import { StatusBadge } from "@/components/dashboard/ui"

const FILTERS: Array<{ value: SignalAnalysisStatus | "all"; label: string }> = [
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "dismissed", label: "Dismissed" },
  { value: "all", label: "All" },
]

export function SignalAnalysisReview({ initialItems }: { initialItems: SignalAnalysisItem[] }) {
  const [items, setItems] = useState(initialItems)
  const [filter, setFilter] = useState<SignalAnalysisStatus | "all">("pending")
  const [pending, startTransition] = useTransition()
  const [message, setMessage] = useState<string | null>(null)

  const visibleItems = filter === "all" ? items : items.filter((item) => item.status === filter)

  function updateStatus(id: string, status: Extract<SignalAnalysisStatus, "approved" | "dismissed">) {
    setMessage(null)
    startTransition(async () => {
      const result = await reviewSignalAnalysisItem(id, status)
      if (!result.success) {
        setMessage(result.error ?? "Unable to update this item.")
        return
      }
      setItems((current) => current.map((item) => item.id === id ? { ...item, status, reviewedAt: new Date().toISOString() } : item))
    })
  }

  function runAnalysis() {
    setMessage(null)
    startTransition(async () => {
      const result = await runSignalAnalysisAction()
      setMessage(result.success ? `${result.scannedCount} scanned · ${result.createdCount} new · ${result.updatedCount} refreshed` : result.error ?? "Analysis failed.")
    })
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-3 border border-border bg-card p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="stencil text-lg text-foreground">Review Queue</p>
          <p className="label-mono mt-1 text-xs text-muted-foreground">Approve only the signals ready for the public preview.</p>
        </div>
        <button type="button" onClick={runAnalysis} disabled={pending} className="label-mono inline-flex items-center justify-center gap-2 bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground disabled:opacity-50">
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
          Run analysis
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {FILTERS.map((option) => (
          <button key={option.value} type="button" onClick={() => setFilter(option.value)} className={`label-mono border px-3 py-1.5 text-xs transition-colors ${filter === option.value ? "border-primary bg-primary text-primary-foreground" : "border-border text-muted-foreground hover:border-primary hover:text-foreground"}`}>
            {option.label}
          </button>
        ))}
        <span className="label-mono ml-auto text-xs text-muted-foreground">{visibleItems.length} items</span>
      </div>

      {message ? <p className="label-mono border border-border bg-card px-3 py-2 text-xs text-muted-foreground">{message}</p> : null}

      {visibleItems.length === 0 ? (
        <div className="border border-dashed border-border px-6 py-14 text-center">
          <p className="label-mono text-xs text-muted-foreground">NO ITEMS IN THIS QUEUE</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {visibleItems.map((item) => (
            <article key={item.id} className="border border-border bg-card p-4">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="label-mono text-[10px] font-semibold tracking-[0.14em] text-primary">{item.category}</span>
                    <StatusBadge status={item.status} />
                    <span className="label-mono text-[10px] text-muted-foreground">SCORE {item.score}</span>
                    <span className="label-mono text-[10px] text-muted-foreground">{item.source}</span>
                  </div>
                  <h2 className="mt-2 text-pretty font-mono text-base font-semibold leading-snug text-foreground">{item.title}</h2>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{item.excerpt}</p>
                  <p className="label-mono mt-3 text-xs text-muted-foreground">{item.analysis.rationale}</p>
                  {item.analysis.matchedTerms.length > 0 ? <p className="label-mono mt-2 text-[10px] text-primary">MATCHES: {item.analysis.matchedTerms.join(" · ")}</p> : null}
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <a href={item.url} target="_blank" rel="noopener noreferrer" className="border border-border p-2 text-muted-foreground hover:border-primary hover:text-foreground" aria-label={`Open source for ${item.title}`}>
                    <ExternalLink className="h-4 w-4" />
                  </a>
                  {item.status !== "approved" ? <button type="button" onClick={() => updateStatus(item.id, "approved")} disabled={pending} className="inline-flex items-center gap-1 border border-primary/40 px-3 py-2 text-xs text-primary hover:bg-primary hover:text-primary-foreground disabled:opacity-50"><Check className="h-4 w-4" />Approve</button> : null}
                  {item.status !== "dismissed" ? <button type="button" onClick={() => updateStatus(item.id, "dismissed")} disabled={pending} className="inline-flex items-center gap-1 border border-border px-3 py-2 text-xs text-muted-foreground hover:border-destructive hover:text-destructive disabled:opacity-50"><X className="h-4 w-4" />Dismiss</button> : null}
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  )
}
