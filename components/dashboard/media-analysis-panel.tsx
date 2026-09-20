"use client"

import { useState } from "react"
import { Loader2, Sparkles } from "lucide-react"

export type AnalysisPanelData = {
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
}

type SourceMetadata = {
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

export function MediaAnalysisPanel({ id, mediaUrl, mimeType, fileSize, source, initial }: { id: string; mediaUrl: string; mimeType: string | null; fileSize: number | null; source: SourceMetadata; initial: AnalysisPanelData | null }) {
  const [analysis, setAnalysis] = useState(initial)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const canAnalyze = mimeType?.startsWith("image/") && mimeType !== "image/svg+xml"

  async function analyze() {
    setLoading(true); setError(null)
    try {
      const response = await fetch("/api/media/analyze", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, mediaUrl, mimeType, fileSize }) })
      const json = await response.json()
      if (!response.ok) throw new Error(json.error ?? "Analysis failed")
      setAnalysis(json.analysis)
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Analysis failed") } finally { setLoading(false) }
  }

  if (!canAnalyze) return null
  return <div className="mt-3 flex flex-col gap-4 border-t border-border pt-3">
    <section className="flex flex-col gap-3" aria-labelledby={`source-metadata-${id}`}>
      <div className="flex items-center gap-2"><span className="size-1.5 bg-muted-foreground" /><h3 id={`source-metadata-${id}`} className="label-mono text-[10px] uppercase tracking-wider text-muted-foreground">Original source metadata</h3></div>
      <dl className="grid grid-cols-2 gap-x-3 gap-y-2 border-l-2 border-muted pl-3"><SourceField label="Filename" value={source.fileName} /><SourceField label="Format" value={source.fileType || "Unknown"} /><SourceField label="Size" value={formatSize(source.fileSize)} /><SourceField label="Stored" value={new Date(source.createdAt).toLocaleDateString()} /></dl>
      <p className="text-[11px] leading-relaxed text-muted-foreground">Authoritative file metadata. AI analysis below is separate and may require editorial review.</p>
    </section>
    {!analysis || analysis.status === "failed" ? <section className="flex flex-col gap-2 border-t border-border pt-3"><button type="button" onClick={analyze} disabled={loading} className="label-mono inline-flex w-fit items-center gap-2 border border-border px-2 py-1 text-xs text-muted-foreground hover:border-primary hover:text-foreground disabled:opacity-50">{loading ? <Loader2 className="size-3 animate-spin" /> : <Sparkles className="size-3" />} {analysis?.status === "failed" ? "Retry analysis" : "Analyze image"}</button>{error || analysis?.error_message ? <p className="text-xs text-destructive">{error || analysis?.error_message}</p> : null}</section> : analysis.status !== "complete" ? <p className="border-t border-border pt-3 text-xs text-muted-foreground">AI-generated metadata is processing.</p> : <section className="flex flex-col gap-3 border-t border-border pt-3" aria-labelledby={`ai-metadata-${id}`}><div className="flex items-center gap-2"><Sparkles className="size-3 text-primary" /><h3 id={`ai-metadata-${id}`} className="label-mono text-[10px] uppercase tracking-wider text-primary">AI-generated metadata · review before publishing</h3></div><dl className="flex flex-col gap-3"><div className="flex flex-col gap-1"><dt className="label-mono text-[10px] uppercase tracking-wider text-muted-foreground">Description</dt><dd className="text-xs leading-relaxed text-foreground">{analysis.summary || analysis.description}</dd></div><List label="Detected text" values={analysis.visible_text} /><List label="Objects" values={analysis.objects} /><List label="Topics" values={analysis.topics} /><List label="Tags" values={analysis.tags} /><List label="Media type" values={analysis.media_type} /><List label="Visual style" values={analysis.visual_style} /><List label="Locations" values={analysis.locations} /><List label="Organizations" values={analysis.organizations} /><List label="People mentioned" values={analysis.people_mentioned} /></dl>{error ? <p className="text-xs text-destructive">{error}</p> : null}</section>}
  </div>
}

export type { SourceMetadata }
