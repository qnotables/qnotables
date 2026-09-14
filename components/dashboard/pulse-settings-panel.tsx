"use client"

import { useState, useTransition } from "react"
import { Check, Loader2, Search, X } from "lucide-react"
import { searchPulseThreads } from "@/app/dashboard/actions"
import { PulsePreview } from "@/components/town-hall-pulse"
import type { PulseCard } from "@/lib/pulse"

type SearchResult = {
  threadId: string
  title: string
  category: string
  href: string
  sourceStatus: "PRIMARY SOURCE" | "COMMUNITY THREAD"
}

export function PulseSettingsPanel({
  settings,
  previewCards,
}: {
  settings: {
    pulse_enabled: boolean
    pulse_editor_thread_id: string | null
    pulse_excluded_thread_ids: string[]
    pulse_active_max_age_days: number
    pulse_backchannel_max_age_days: number
    pulse_kicker: string
    pulse_title: string
    pulse_description: string
    pulse_enter_label: string
    pulse_start_label: string
  }
  previewCards: PulseCard[]
}) {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<SearchResult[]>([])
  const [selectedId, setSelectedId] = useState(settings.pulse_editor_thread_id ?? "")
  const [pending, startTransition] = useTransition()

  function runSearch() {
    startTransition(async () => {
      setResults(await searchPulseThreads(query))
    })
  }

  return (
    <section className="flex flex-col gap-4 border border-border bg-card/40 p-5">
      <div>
        <h2 className="stencil text-lg text-foreground">Town Hall Pulse</h2>
        <p className="label-mono mt-1 text-xs leading-5 text-muted-foreground">
          Curate the public forum signal without changing thread visibility or featured status.
        </p>
      </div>
      <label className="flex items-start justify-between gap-4 border border-border bg-card p-4">
        <span className="flex flex-col gap-1">
          <span className="font-semibold text-foreground">Enable Pulse</span>
          <span className="label-mono text-sm text-muted-foreground">Show the Town Hall module after the site disclaimer.</span>
        </span>
        <input type="checkbox" name="pulse_enabled" defaultChecked={settings.pulse_enabled} className="mt-1 h-5 w-5 shrink-0 accent-primary" />
      </label>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="flex flex-col gap-1">
          <label className="label-mono text-muted-foreground" htmlFor="pulse_active_max_age_days">Active discussion window (days)</label>
          <input id="pulse_active_max_age_days" name="pulse_active_max_age_days" type="number" min={1} max={90} defaultValue={settings.pulse_active_max_age_days} className="w-full border border-border bg-background px-3 py-2 text-foreground outline-none focus:border-primary" />
        </div>
        <div className="flex flex-col gap-1">
          <label className="label-mono text-muted-foreground" htmlFor="pulse_backchannel_max_age_days">Backchannel window (days)</label>
          <input id="pulse_backchannel_max_age_days" name="pulse_backchannel_max_age_days" type="number" min={1} max={90} defaultValue={settings.pulse_backchannel_max_age_days} className="w-full border border-border bg-background px-3 py-2 text-foreground outline-none focus:border-primary" />
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <label className="flex flex-col gap-1"><span className="label-mono text-muted-foreground">Kicker</span><input name="pulse_kicker" defaultValue={settings.pulse_kicker} className="w-full border border-border bg-background px-3 py-2 text-foreground outline-none focus:border-primary" /></label>
        <label className="flex flex-col gap-1"><span className="label-mono text-muted-foreground">Title</span><input name="pulse_title" defaultValue={settings.pulse_title} className="w-full border border-border bg-background px-3 py-2 text-foreground outline-none focus:border-primary" /></label>
      </div>
      <label className="flex flex-col gap-1"><span className="label-mono text-muted-foreground">Description</span><textarea name="pulse_description" rows={2} defaultValue={settings.pulse_description} className="w-full resize-y border border-border bg-background px-3 py-2 text-foreground outline-none focus:border-primary" /></label>
      <div className="grid gap-4 md:grid-cols-2">
        <label className="flex flex-col gap-1"><span className="label-mono text-muted-foreground">Forum link label</span><input name="pulse_enter_label" defaultValue={settings.pulse_enter_label} className="w-full border border-border bg-background px-3 py-2 text-foreground outline-none focus:border-primary" /></label>
        <label className="flex flex-col gap-1"><span className="label-mono text-muted-foreground">Start thread label</span><input name="pulse_start_label" defaultValue={settings.pulse_start_label} className="w-full border border-border bg-background px-3 py-2 text-foreground outline-none focus:border-primary" /></label>
      </div>
      <div className="flex flex-col gap-2">
        <span className="label-mono text-muted-foreground">Editor&apos;s notable</span>
        <input type="hidden" name="pulse_editor_thread_id" value={selectedId} />
        <div className="flex gap-2">
          <input value={query} onChange={(event) => setQuery(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); runSearch() } }} placeholder="Search published threads" className="min-w-0 flex-1 border border-border bg-background px-3 py-2 text-foreground outline-none focus:border-primary" />
          <button type="button" onClick={runSearch} disabled={pending} className="label-mono inline-flex items-center gap-2 border border-border px-3 py-2 text-foreground hover:border-primary disabled:opacity-50">{pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />} Find</button>
        </div>
        {selectedId ? <div className="flex items-center justify-between gap-3 border border-primary/50 bg-primary/5 px-3 py-2 text-sm"><span className="truncate">Selected thread: {selectedId}</span><button type="button" onClick={() => setSelectedId("")} className="text-muted-foreground hover:text-foreground" aria-label="Clear editor notable"><X className="h-4 w-4" /></button></div> : null}
        {results.length ? <div className="flex flex-col border border-border">{results.map((result) => <button key={result.threadId} type="button" onClick={() => { setSelectedId(result.threadId); setResults([]) }} className="flex items-center justify-between gap-3 border-b border-border px-3 py-3 text-left last:border-b-0 hover:bg-muted"><span className="min-w-0"><span className="block truncate text-sm text-foreground">{result.title}</span><span className="label-mono text-[10px] text-muted-foreground">{result.category} · {result.sourceStatus}</span></span>{selectedId === result.threadId ? <Check className="h-4 w-4 shrink-0 text-primary" /> : null}</button>)}</div> : null}
        <p className="label-mono text-[10px] text-muted-foreground">Leave empty to use the pinned or featured fallback.</p>
      </div>
      <label className="flex flex-col gap-1"><span className="label-mono text-muted-foreground">Excluded thread IDs</span><textarea name="pulse_excluded_thread_ids" rows={2} defaultValue={settings.pulse_excluded_thread_ids.join("\n")} placeholder="One UUID per line" className="w-full resize-y border border-border bg-background px-3 py-2 font-mono text-xs text-foreground outline-none focus:border-primary" /></label>
      <div>
        <p className="label-mono mb-3 text-[10px] tracking-[0.16em] text-muted-foreground">CURRENT SLOT PREVIEW</p>
        <PulsePreview cards={previewCards} />
      </div>
    </section>
  )
}
