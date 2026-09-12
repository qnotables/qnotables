"use client"

import { Download, FileText, PanelRightClose, PanelRightOpen, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import type { SearchResult } from "@/lib/search-utils"

interface ResearchPanelProps {
  open: boolean
  onToggle: () => void
  savedResults: SearchResult[]
  note: string
  onNoteChange: (value: string) => void
  onRemove: (id: string) => void
  onExport: () => void
}

export function ResearchPanel({ open, onToggle, savedResults, note, onNoteChange, onRemove, onExport }: ResearchPanelProps) {
  return (
    <aside className={open ? "border border-border bg-card/70" : "border border-border bg-card/70"} aria-label="Research panel">
      <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
        <div>
          <p className="label-mono text-primary">Research panel</p>
          <p className="mt-1 text-xs text-muted-foreground">{savedResults.length} saved source{savedResults.length === 1 ? "" : "s"}</p>
        </div>
        <Button variant="ghost" size="icon-sm" onClick={onToggle} aria-label={open ? "Collapse research panel" : "Open research panel"}>
          {open ? <PanelRightClose /> : <PanelRightOpen />}
        </Button>
      </div>
      {open && (
        <div className="flex flex-col gap-4 p-4">
          {savedResults.length === 0 ? (
            <div className="border border-dashed border-border px-3 py-5 text-center">
              <FileText className="mx-auto size-5 text-muted-foreground" />
              <p className="mt-2 text-xs leading-5 text-muted-foreground">Save records here to build a compact source list while you search.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {savedResults.map((result, index) => (
                <div key={result.id} className="flex gap-2">
                  <span className="label-mono text-primary">{String(index + 1).padStart(2, "0")}</span>
                  <div className="min-w-0 flex-1">
                    <a href={result.href} className="line-clamp-2 text-sm font-semibold leading-5 text-foreground hover:text-primary">{result.title}</a>
                    <p className="mt-1 text-xs text-muted-foreground">{result.source ?? "QNotables"} · {result.date ? new Date(result.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "undated"}</p>
                  </div>
                  <Button variant="ghost" size="icon-xs" onClick={() => onRemove(result.id)} aria-label={`Remove ${result.title}`}><Trash2 /></Button>
                </div>
              ))}
            </div>
          )}
          <Separator />
          <label className="flex flex-col gap-2">
            <span className="label-mono text-muted-foreground">Working notes</span>
            <textarea value={note} onChange={(event) => onNoteChange(event.target.value)} placeholder="Capture a lead, question, or next source to verify…" className="min-h-28 resize-y border border-input bg-background px-3 py-2 text-sm leading-6 text-foreground outline-none placeholder:text-muted-foreground focus:border-ring focus:ring-2 focus:ring-ring/30" />
          </label>
          <Button variant="outline" size="sm" onClick={onExport} disabled={savedResults.length === 0} className="label-mono justify-start"><Download data-icon="inline-start" />Export saved sources</Button>
          <p className="text-[11px] leading-5 text-muted-foreground">Saved sources and notes stay in this browser. Nothing is published or shared automatically.</p>
        </div>
      )}
    </aside>
  )
}
