"use client"

import { useState } from "react"
import { Check, Loader2, RotateCcw, Sparkles, X } from "lucide-react"

export type ReviewStatus = "pending" | "approved" | "needs_edit" | "rejected"

export type AnalysisPanelData = {
  id?: string
  status: "pending" | "processing" | "complete" | "failed"
  summary?: string | null
  description?: string | null
  visible_text?: string[]
  topics?: string[]
  tags?: string[]
  media_type?: string[]
  locations?: string[]
  organizations?: string[]
  objects?: string[]
  people_mentioned?: string[]
  visual_style?: string[]
  error_message?: string | null
  reviewed?: boolean
  reviewed_by?: string | null
  reviewed_at?: string | null
  review_status?: ReviewStatus
  review_notes?: string | null
}

export type SourceMetadata = {
  fileName: string
  fileType: string | null
  fileSize: number | null
  createdAt: string
  mediaUrl: string
}

function List({ label, values }: { label: string; values?: string[] }) {
  if (!values?.length) return null
  return <div className="flex flex-col gap-1"><dt className="label-mono text-[10px] uppercase tracking-wider text-muted-foreground">{label}</dt><dd className="text-sm text-foreground">{values.join(" · ")}</dd></div>
}

function SourceField({ label, value }: { label: string; value: string }) {
  return <div className="flex min-w-0 flex-col gap-1"><dt className="label-mono text-[10px] uppercase tracking-wider text-muted-foreground">{label}</dt><dd className="truncate text-xs text-foreground" title={value}>{value}</dd></div>
}

function formatSize(bytes: number | null) {
  if (!bytes) return "Unknown size"
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

const reviewLabels: Record<ReviewStatus, string> = { pending: "Pending review", approved: "Approved", needs_edit: "Needs edit", rejected: "Rejected" }

export function MediaAnalysisPanel({ id, mediaUrl, mimeType, fileSize, source, initial }: { id: string; mediaUrl: string; mimeType: string | null; fileSize: number | null; source: SourceMetadata; initial: AnalysisPanelData | null }) {
  const [analysis, setAnalysis] = useState(initial)
  const [loading, setLoading] = useState(false)
  const [reviewing, setReviewing] = useState(false)
  const [notes, setNotes] = useState(initial?.review_notes ?? "")
  const [error, setError] = useState<string | null>(null)
  const canAnalyze = mimeType?.startsWith("image/") && mimeType !== "image/svg+xml"

  async function analyze() {
    setLoading(true); setError(null)
    try {
      const response = await fetch("/api/media/analyze", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, mediaUrl, mimeType, fileSize }) })
      const json = await response.json()
      if (!response.ok) throw new Error(json.error ?? "Analysis failed")
      setAnalysis(json.analysis)
      setNotes(json.analysis.review_notes ?? "")
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Analysis failed") } finally { setLoading(false) }
  }

  async function review(reviewStatus: ReviewStatus) {
    setReviewing(true); setError(null)
    try {
      const response = await fetch("/api/media/analyze", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, action: "review", reviewStatus, reviewNotes: notes }) })
      const json = await response.json()
      if (!response.ok) throw new Error(json.error ?? "Review update failed")
      setAnalysis(json.analysis)
      setNotes(json.analysis.review_notes ?? "")
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Review update failed") } finally { setReviewing(false) }
  }

  if (!canAnalyze) return null
  return <div className="mt-3 flex flex-col gap-4 border-t border-border pt-3">
    <section className="flex flex-col gap-3" aria-labelledby={`source-metadata-${id}`}>
      <div className="flex items-center gap-2"><span className="size-1.5 bg-muted-foreground" /><h3 id={`source-metadata-${id}`} className="label-mono text-[10px] uppercase tracking-wider text-muted-foreground">Original source metadata</h3></div>
      <dl className="grid grid-cols-2 gap-x-3 gap-y-2 border-l-2 border-muted pl-3"><SourceField label="Filename" value={source.fileName} /><SourceField label="Format" value={source.fileType || "Unknown"} /><SourceField label="Size" value={formatSize(source.fileSize)} /><SourceField label="Stored" value={new Date(source.createdAt).toLocaleDateString()} /></dl>
      <p className="text-[11px] leading-relaxed text-muted-foreground">Authoritative file metadata. AI analysis below is separate and may require editorial review.</p>
    </section>
    {!analysis || analysis.status === "failed" ? <section className="flex flex-col gap-2 border-t border-border pt-3"><button type="button" onClick={analyze} disabled={loading} className="label-mono inline-flex w-fit items-center gap-2 border border-border px-2 py-1 text-xs text-muted-foreground hover:border-primary hover:text-foreground disabled:opacity-50">{loading ? <Loader2 className="size-3 animate-spin" /> : <Sparkles className="size-3" />} {analysis?.status === "failed" ? "Retry analysis" : "Analyze image"}</button>{error || analysis?.error_message ? <p className="text-xs text-destructive">{error || analysis?.error_message}</p> : null}</section> : analysis.status !== "complete" ? <p className="border-t border-border pt-3 text-xs text-muted-foreground">AI-generated metadata is processing.</p> : <section className="flex flex-col gap-3 border-t border-border pt-3" aria-labelledby={`ai-metadata-${id}`}>
      <div className="flex items-center justify-between gap-2"><div className="flex items-center gap-2"><Sparkles className="size-3 text-primary" /><h3 id={`ai-metadata-${id}`} className="label-mono text-[10px] uppercase tracking-wider text-primary">AI metadata · editorial review</h3></div><span className="label-mono border border-border px-2 py-1 text-[10px] uppercase tracking-wider text-muted-foreground">{reviewLabels[analysis.review_status ?? "pending"]}</span></div>
      <dl className="flex flex-col gap-3"><div className="flex flex-col gap-1"><dt className="label-mono text-[10px] uppercase tracking-wider text-muted-foreground">Description</dt><dd className="text-xs leading-relaxed text-foreground">{analysis.summary || analysis.description}</dd></div><List label="Detected text" values={analysis.visible_text} /><List label="Objects" values={analysis.objects} /><List label="Topics" values={analysis.topics} /><List label="Tags" values={analysis.tags} /><List label="Media type" values={analysis.media_type} /><List label="Visual style" values={analysis.visual_style} /><List label="Locations" values={analysis.locations} /><List label="Organizations" values={analysis.organizations} /><List label="People mentioned" values={analysis.people_mentioned} /></dl>
      <div className="flex flex-col gap-2"><label htmlFor={`review-notes-${id}`} className="label-mono text-[10px] uppercase tracking-wider text-muted-foreground">Review notes</label><textarea id={`review-notes-${id}`} value={notes} onChange={(event) => setNotes(event.target.value)} maxLength={2000} rows={2} placeholder="Optional context for the next editor" className="resize-y border border-border bg-background px-2 py-2 text-xs text-foreground outline-none placeholder:text-muted-foreground focus:border-primary" /></div>
      <div className="grid grid-cols-3 gap-1"><button type="button" onClick={() => review("approved")} disabled={reviewing} className="label-mono inline-flex items-center justify-center gap-1 border border-emerald-500/40 px-2 py-2 text-[10px] uppercase tracking-wider text-emerald-400 hover:bg-emerald-500/10 disabled:opacity-50"><Check className="size-3" />Approve</button><button type="button" onClick={() => review("needs_edit")} disabled={reviewing} className="label-mono inline-flex items-center justify-center gap-1 border border-amber-500/40 px-2 py-2 text-[10px] uppercase tracking-wider text-amber-400 hover:bg-amber-500/10 disabled:opacity-50"><RotateCcw className="size-3" />Needs edit</button><button type="button" onClick={() => review("rejected")} disabled={reviewing} className="label-mono inline-flex items-center justify-center gap-1 border border-destructive/40 px-2 py-2 text-[10px] uppercase tracking-wider text-destructive hover:bg-destructive/10 disabled:opacity-50"><X className="size-3" />Reject</button></div>
      {analysis.review_notes ? <p className="text-[11px] leading-relaxed text-muted-foreground">Last note: {analysis.review_notes}</p> : null}{error ? <p className="text-xs text-destructive">{error}</p> : null}
    </section>}
  </div>
}

