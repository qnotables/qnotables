"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { ExternalLink, Search } from "lucide-react"
import type { RSSSource } from "@/lib/rss"

const GROUPS = ["All", "Government", "Politics", "Defense", "Economy", "Technology", "Science", "Energy", "Culture", "Crime", "Independent Media", "Major News", "Other"]

function groupSource(source: RSSSource): string {
  const value = `${source.name} ${source.url}`.toLowerCase()
  if (/gov|government|congress|whitehouse|state\.gov|defense\.gov/.test(value)) return "Government"
  if (/politic|election|senate|house/.test(value)) return "Politics"
  if (/defense|military|war|strategic/.test(value)) return "Defense"
  if (/econom|market|business|finance|invest/.test(value)) return "Economy"
  if (/tech|cyber|computer|ai|venture/.test(value)) return "Technology"
  if (/science|space|health|medical|nature/.test(value)) return "Science"
  if (/energy|oil|gas|nuclear/.test(value)) return "Energy"
  if (/culture|art|book|music/.test(value)) return "Culture"
  if (/crime|law|justice|police/.test(value)) return "Crime"
  if (/qnotables|independent|substack|zerohedge|gateway/.test(value)) return "Independent Media"
  if (/news|post|times|journal|reuters|bbc|cnn|fox|guardian/.test(value)) return "Major News"
  return "Other"
}

export function SourcesDirectory({ sources }: { sources: RSSSource[] }) {
  const [query, setQuery] = useState("")
  const [group, setGroup] = useState("All")
  const filteredSources = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()
    return sources.filter((source) => {
      const matchesQuery = !normalizedQuery || `${source.name} ${source.url}`.toLowerCase().includes(normalizedQuery)
      return matchesQuery && (group === "All" || groupSource(source) === group)
    })
  }, [group, query, sources])

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 border-y border-border py-4 md:flex-row">
        <label className="relative min-w-0 flex-1">
          <span className="sr-only">Search monitored sources</span>
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search sources" className="h-10 w-full border border-input bg-background pl-9 pr-3 text-sm text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary" />
        </label>
        <div className="flex gap-2 overflow-x-auto pb-1" aria-label="Filter source groups">
          {GROUPS.map((item) => (
            <button key={item} type="button" onClick={() => setGroup(item)} aria-pressed={group === item} className={`shrink-0 border px-3 py-2 text-xs font-semibold tracking-wide transition-colors ${group === item ? "border-primary bg-primary text-primary-foreground" : "border-border text-muted-foreground hover:border-primary hover:text-primary"}`}>
              {item}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between gap-4">
        <p className="label-mono text-xs text-muted-foreground">{filteredSources.length} of {sources.length} monitored sources</p>
        <Link href="/#the-wire" className="label-mono text-xs text-primary underline underline-offset-4">Return to The Wire</Link>
      </div>

      {filteredSources.length > 0 ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filteredSources.map((source) => (
            <article key={source.id} className="flex min-w-0 flex-col gap-3 border border-border bg-card/60 p-4 transition-colors hover:border-primary">
              <div className="flex items-start justify-between gap-3">
                <span className="label-mono text-[10px] text-primary">{groupSource(source)}</span>
                <span className="label-mono text-[10px] text-muted-foreground">RSS</span>
              </div>
              <h2 className="stencil text-xl leading-tight text-foreground">{source.name}</h2>
              <a href={source.url} target="_blank" rel="noreferrer" className="mt-auto inline-flex min-w-0 items-center gap-2 text-xs text-muted-foreground hover:text-primary">
                <span className="min-w-0 truncate">{source.url}</span>
                <ExternalLink className="size-3.5 shrink-0" aria-hidden="true" />
                <span className="sr-only">Open {source.name}</span>
              </a>
            </article>
          ))}
        </div>
      ) : (
        <p className="border border-dashed border-border px-4 py-10 text-center text-sm text-muted-foreground">No monitored sources match this filter.</p>
      )}
    </div>
  )
}
