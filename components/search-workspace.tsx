"use client"

import { useEffect, useMemo, useState } from "react"
import useSWR from "swr"
import { CalendarDays, ChevronDown, Clock3, Filter, List, Search, SlidersHorizontal, Sparkles, X } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { SearchResultCard } from "@/components/search-result-card"
import { ResearchPanel } from "@/components/research-panel"
import { cn } from "@/lib/utils"
import type { SearchResponse, SearchResult, SearchSort, SearchTab } from "@/lib/search-utils"

const fetcher = async (url: string): Promise<SearchResponse> => {
  const response = await fetch(url)
  if (!response.ok) throw new Error("Search index unavailable")
  return response.json()
}

const tabs: Array<{ id: SearchTab; label: string }> = [
  { id: "all", label: "All" },
  { id: "archives", label: "Archives" },
  { id: "town-hall", label: "Town Hall" },
  { id: "news", label: "News / RSS" },
  { id: "documents", label: "Documents" },
  { id: "media", label: "Media" },
]

interface SearchWorkspaceProps {
  initialQuery: string
  initialTab: string
  initialSort: string
  initialDesk: string
  initialCategory: string
  initialType: string
  initialSource: string
  initialAuthor: string
  initialTag: string
  initialFrom: string
  initialTo: string
  initialPrimary: boolean
}

function isTab(value: string): value is SearchTab {
  return tabs.some((tab) => tab.id === value)
}

function isSort(value: string): value is SearchSort {
  return value === "relevance" || value === "newest" || value === "oldest"
}

function formatElapsed(value?: number): string {
  return value ? `${value} ms` : "—"
}

function buildParams(state: { query: string; tab: SearchTab; sort: SearchSort; desk: string; category: string; type: string; source: string; author: string; tag: string; from: string; to: string; primary: boolean; page: number }): string {
  const params = new URLSearchParams()
  if (state.query.trim()) params.set("q", state.query.trim())
  if (state.tab !== "all") params.set("tab", state.tab)
  if (state.sort !== "relevance") params.set("sort", state.sort)
  for (const key of ["desk", "category", "type", "source", "author", "tag", "from", "to"] as const) if (state[key]) params.set(key, state[key])
  if (state.primary) params.set("primary", "true")
  if (state.page > 1) params.set("page", String(state.page))
  return params.toString()
}

export function SearchWorkspace(props: SearchWorkspaceProps) {
  const [query, setQuery] = useState(props.initialQuery)
  const [debouncedQuery, setDebouncedQuery] = useState(props.initialQuery)
  const [tab, setTab] = useState<SearchTab>(isTab(props.initialTab) ? props.initialTab : "all")
  const [sort, setSort] = useState<SearchSort>(isSort(props.initialSort) ? props.initialSort : "relevance")
  const [desk, setDesk] = useState(props.initialDesk)
  const [category, setCategory] = useState(props.initialCategory)
  const [type, setType] = useState(props.initialType)
  const [source, setSource] = useState(props.initialSource)
  const [author, setAuthor] = useState(props.initialAuthor)
  const [tag, setTag] = useState(props.initialTag)
  const [from, setFrom] = useState(props.initialFrom)
  const [to, setTo] = useState(props.initialTo)
  const [primary, setPrimary] = useState(props.initialPrimary)
  const [page, setPage] = useState(1)
  const [timeline, setTimeline] = useState(false)
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [researchOpen, setResearchOpen] = useState(true)
  const [savedIds, setSavedIds] = useState<string[]>([])
  const [savedResults, setSavedResults] = useState<SearchResult[]>([])
  const [loadedResults, setLoadedResults] = useState<SearchResult[]>([])
  const [note, setNote] = useState("")
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const state = { query: debouncedQuery, tab, sort, desk, category, type, source, author, tag, from, to, primary, page }
  const queryString = buildParams(state)
  const { data, error, isLoading } = useSWR<SearchResponse>(debouncedQuery.trim().length >= 2 ? `/api/search?${queryString}` : null, fetcher, { keepPreviousData: true })

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setDebouncedQuery(query)
      setPage(1)
      const next = buildParams({ ...state, query, page: 1 })
      window.history.replaceState(null, "", next ? `/search?${next}` : "/search")
    }, 320)
    return () => window.clearTimeout(timeout)
  }, [query])

  useEffect(() => {
    setLoadedResults([])
  }, [debouncedQuery, tab, sort, desk, category, type, source, author, tag, from, to, primary])

  useEffect(() => {
    if (!data) return
    setLoadedResults((current) => {
      if (data.page === 1) return data.results
      const known = new Set(current.map((result) => result.id))
      return [...current, ...data.results.filter((result) => !known.has(result.id))]
    })
  }, [data])

  useEffect(() => {
    const raw = window.localStorage.getItem("qnotables-research-panel")
    if (!raw) return
    try {
      const parsed = JSON.parse(raw) as { ids?: string[]; results?: SearchResult[]; note?: string }
      setSavedIds(parsed.ids ?? [])
      setSavedResults(parsed.results ?? [])
      setNote(parsed.note ?? "")
    } catch {
      window.localStorage.removeItem("qnotables-research-panel")
    }
  }, [])

  useEffect(() => {
    window.localStorage.setItem("qnotables-research-panel", JSON.stringify({ ids: savedIds, results: savedResults, note }))
  }, [savedIds, savedResults, note])

  useEffect(() => {
    setSavedResults((current) => {
      const known = new Map(current.map((item) => [item.id, item]))
      for (const result of data?.results ?? []) if (savedIds.includes(result.id)) known.set(result.id, result)
      return savedIds.map((id) => known.get(id)).filter((item): item is SearchResult => Boolean(item))
    })
  }, [data, savedIds])

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault()
        document.getElementById("research-search-input")?.focus()
      }
      if (event.key === "Escape" && document.activeElement?.id === "research-search-input") {
        setQuery("")
        ;(document.activeElement as HTMLInputElement).blur()
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [])

  const activeFilterCount = [desk, category, type, source, author, tag, from, to, primary ? "primary" : ""].filter(Boolean).length
  const activeFilterChips = [
    ["desk", desk], ["category", category], ["type", type], ["source", source], ["author", author], ["tag", tag], ["from", from], ["to", to], ["primary", primary ? "Primary source" : ""],
  ].filter(([, value]) => value)
  const clearFilters = () => { setDesk(""); setCategory(""); setType(""); setSource(""); setAuthor(""); setTag(""); setFrom(""); setTo(""); setPrimary(false); setPage(1) }
  const resetForControl = (setter: (value: string) => void) => (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => { setter(event.target.value); setPage(1) }

  const displayResults = loadedResults
  const groupedResults = useMemo(() => {
    if (!timeline) return null
    return displayResults.reduce<Record<string, SearchResult[]>>((groups, result) => {
      const key = result.date ? new Date(result.date).toLocaleDateString("en-US", { month: "long", year: "numeric" }) : "Undated records"
      ;(groups[key] ??= []).push(result)
      return groups
    }, {})
  }, [displayResults, timeline])

  function toggleSaved(result: SearchResult) {
    if (savedIds.includes(result.id)) {
      setSavedIds((current) => current.filter((id) => id !== result.id))
      return
    }
    setSavedIds((current) => [...current, result.id])
    setSavedResults((current) => [...current.filter((item) => item.id !== result.id), result])
  }

  async function copyLink(result: SearchResult) {
    await navigator.clipboard?.writeText(new URL(result.href, window.location.origin).toString())
    setCopiedId(result.id)
    window.setTimeout(() => setCopiedId(null), 1600)
  }

  async function shareLink(result: SearchResult) {
    const url = new URL(result.href, window.location.origin).toString()
    if (navigator.share) await navigator.share({ title: result.title, url })
    else await copyLink(result)
  }

  function exportSaved() {
    const content = [`QNOTABLES RESEARCH EXPORT`, `Generated ${new Date().toISOString()}`, "", ...savedResults.map((result, index) => `${index + 1}. ${result.title}\n${result.source ?? "QNotables"} · ${result.date ?? "undated"}\n${new URL(result.href, window.location.origin).toString()}`), "", "NOTES", note].join("\n")
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement("a")
    anchor.href = url
    anchor.download = "qnotables-research.txt"
    anchor.click()
    URL.revokeObjectURL(url)
  }

  function updateUrlForControls(nextTab = tab, nextSort = sort) {
    const next = buildParams({ ...state, tab: nextTab, sort: nextSort, page: 1 })
    window.history.replaceState(null, "", next ? `/search?${next}` : "/search")
  }

  return (
    <div className="flex flex-col gap-8">
      <section className="border-y border-border py-7 md:py-9">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <p className="label-mono text-primary">Research Search / QNotables Index</p>
            <h1 className="mt-3 text-balance font-heading text-4xl font-semibold leading-none text-foreground md:text-6xl">Find the thread behind the story.</h1>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-muted-foreground md:text-base">Search field notes, public records, Town Hall discussions, and media in one place. Filter the evidence, save sources, and keep your working trail close.</p>
          </div>
          <div className="hidden shrink-0 items-center gap-2 border border-border px-3 py-2 text-muted-foreground lg:flex"><Sparkles className="size-4 text-primary" /><span className="label-mono">Public index / live query</span></div>
        </div>
        <div className="mt-7 flex items-center gap-3 border border-border bg-card px-3 py-2 focus-within:border-primary md:px-4 md:py-3">
          <Search className="size-5 shrink-0 text-primary" />
          <input id="research-search-input" type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search dispatches, records, threads…" className="min-w-0 flex-1 bg-transparent text-base text-foreground outline-none placeholder:text-muted-foreground" autoComplete="off" spellCheck={false} aria-label="Search QNotables" />
          {query && <Button variant="ghost" size="icon-sm" onClick={() => setQuery("")} aria-label="Clear search"><X /></Button>}
          <kbd className="hidden border border-border px-2 py-1 font-mono text-[10px] text-muted-foreground md:inline">⌘ K</kbd>
        </div>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
          <span>{data ? `${data.total.toLocaleString()} records found` : query.trim().length >= 2 ? "Reading the index…" : "Start with a keyword or phrase"}</span>
          <span className="inline-flex items-center gap-1.5"><Clock3 className="size-3.5" /> {formatElapsed(data?.elapsedMs)} query time</span>
        </div>
      </section>

      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2 overflow-x-auto border-b border-border pb-2" role="tablist" aria-label="Search result types">
          {tabs.map((item) => (
            <button key={item.id} type="button" role="tab" aria-selected={tab === item.id} onClick={() => { setTab(item.id); setPage(1); updateUrlForControls(item.id) }} className={cn("label-mono flex shrink-0 items-center gap-2 border-b-2 border-transparent px-3 py-2 text-muted-foreground transition-colors hover:text-foreground", tab === item.id && "border-primary text-primary")}>
              {item.label}<span className="text-[10px] text-muted-foreground">{data?.counts[item.id] ?? "—"}</span>
            </button>
          ))}
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Button variant="outline" size="sm" onClick={() => setFiltersOpen((open) => !open)} className="label-mono"><Filter data-icon="inline-start" />Filters {activeFilterCount > 0 && <Badge variant="secondary" className="ml-1 rounded-none">{activeFilterCount}</Badge>}</Button>
          <div className="flex items-center gap-2">
            <label className="label-mono flex items-center gap-2 text-muted-foreground">Sort <select value={sort} onChange={(event) => { const nextSort = event.target.value as SearchSort; setSort(nextSort); setPage(1); updateUrlForControls(tab, nextSort) }} className="border border-border bg-background px-2 py-1.5 text-foreground outline-none focus:border-primary"><option value="relevance">Relevance</option><option value="newest">Newest</option><option value="oldest">Oldest</option></select></label>
            <div className="hidden items-center border border-border sm:flex"><Button variant={timeline ? "ghost" : "secondary"} size="icon-sm" onClick={() => setTimeline(false)} aria-label="List view"><List /></Button><Button variant={timeline ? "secondary" : "ghost"} size="icon-sm" onClick={() => setTimeline(true)} aria-label="Timeline view"><CalendarDays /></Button></div>
            <Button variant="outline" size="icon-sm" onClick={() => setResearchOpen((open) => !open)} aria-label={researchOpen ? "Collapse research panel" : "Open research panel"}><SlidersHorizontal /></Button>
          </div>
        </div>
        {filtersOpen && (
          <div className="grid gap-3 border border-border bg-card/60 p-4 sm:grid-cols-2 lg:grid-cols-4">
            <label className="flex flex-col gap-1.5"><span className="label-mono text-muted-foreground">Desk</span><input value={desk} onChange={resetForControl(setDesk)} placeholder="e.g. politics" className="border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary" /></label>
            <label className="flex flex-col gap-1.5"><span className="label-mono text-muted-foreground">Category</span><input value={category} onChange={resetForControl(setCategory)} placeholder="e.g. investigation" className="border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary" /></label>
            <label className="flex flex-col gap-1.5"><span className="label-mono text-muted-foreground">Content type</span><input value={type} onChange={resetForControl(setType)} placeholder="e.g. field note" className="border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary" /></label>
            <label className="flex flex-col gap-1.5"><span className="label-mono text-muted-foreground">Source</span><input value={source} onChange={resetForControl(setSource)} placeholder="source name" className="border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary" /></label>
            <label className="flex flex-col gap-1.5"><span className="label-mono text-muted-foreground">Author</span><input value={author} onChange={resetForControl(setAuthor)} placeholder="author name" className="border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary" /></label>
            <label className="flex flex-col gap-1.5"><span className="label-mono text-muted-foreground">Tag</span><input value={tag} onChange={resetForControl(setTag)} placeholder="topic tag" className="border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary" /></label>
            <label className="flex flex-col gap-1.5"><span className="label-mono text-muted-foreground">From</span><input type="date" value={from} onChange={resetForControl(setFrom)} className="border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary" /></label>
            <label className="flex flex-col gap-1.5"><span className="label-mono text-muted-foreground">To</span><input type="date" value={to} onChange={resetForControl(setTo)} className="border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary" /></label>
            <div className="flex items-end justify-between gap-3 sm:col-span-2 lg:col-span-4"><label className="inline-flex items-center gap-2 text-sm text-foreground"><input type="checkbox" checked={primary} onChange={(event) => { setPrimary(event.target.checked); setPage(1) }} className="size-4 accent-primary" /> Primary sources only</label><Button variant="ghost" size="sm" onClick={clearFilters} disabled={activeFilterCount === 0} className="label-mono text-muted-foreground">Clear all</Button></div>
          </div>
        )}
        {activeFilterChips.length > 0 && <div className="flex flex-wrap gap-2">{activeFilterChips.map(([key, value]) => <button key={key} type="button" onClick={() => { if (key === "desk") setDesk(""); if (key === "category") setCategory(""); if (key === "type") setType(""); if (key === "source") setSource(""); if (key === "author") setAuthor(""); if (key === "tag") setTag(""); if (key === "from") setFrom(""); if (key === "to") setTo(""); if (key === "primary") setPrimary(false); setPage(1) }} className="label-mono inline-flex items-center gap-2 border border-primary/50 px-2.5 py-1.5 text-primary hover:bg-primary/10">{value}<X className="size-3" /></button>)}</div>}
      </div>

      <div className={cn("grid items-start gap-6", researchOpen ? "lg:grid-cols-[minmax(0,1fr)_320px]" : "grid-cols-1")}>
        <section aria-live="polite" className="flex min-w-0 flex-col gap-4">
          {data?.partial && data.partial.length > 0 && <div className="border border-primary/40 bg-primary/5 px-4 py-3 text-sm leading-6 text-muted-foreground">Some sources are temporarily unavailable: {data.partial.join(", ")}. Other public records are still included below.</div>}
          {error && <div className="border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">The search index could not be reached. Try again or clear a filter.</div>}
          {isLoading && <div className="border border-border bg-card/50 px-4 py-5 text-sm text-muted-foreground">Reading public records…</div>}
          {!isLoading && !error && debouncedQuery.trim().length < 2 && <div className="flex flex-col items-center border border-dashed border-border px-6 py-16 text-center"><Search className="size-8 text-primary/70" /><h2 className="mt-4 font-heading text-2xl text-foreground">Begin with a search term</h2><p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">Try a name, place, institution, or phrase. Search is limited to public records and published QNotables material.</p></div>}
          {!isLoading && !error && debouncedQuery.trim().length >= 2 && displayResults.length === 0 && <div className="flex flex-col items-center border border-dashed border-border px-6 py-16 text-center"><Search className="size-8 text-muted-foreground" /><h2 className="mt-4 font-heading text-2xl text-foreground">No records matched</h2><p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">Try fewer words, remove a filter, or search a broader desk. The index only displays material that is already public.</p><Button variant="outline" size="sm" onClick={clearFilters} className="mt-5 label-mono">Clear filters</Button></div>}
          {timeline && groupedResults ? Object.entries(groupedResults).map(([group, groupResults]) => <div key={group} className="flex flex-col gap-3"><div className="flex items-center gap-3"><span className="label-mono text-primary">{group}</span><div className="h-px flex-1 bg-border" /></div>{groupResults.map((result) => <SearchResultCard key={result.id} result={result} query={debouncedQuery} saved={savedIds.includes(result.id)} copied={copiedId === result.id} onSave={() => toggleSaved(result)} onCopy={() => copyLink(result)} onShare={() => shareLink(result)} />)}</div>) : displayResults.map((result) => <SearchResultCard key={result.id} result={result} query={debouncedQuery} saved={savedIds.includes(result.id)} copied={copiedId === result.id} onSave={() => toggleSaved(result)} onCopy={() => copyLink(result)} onShare={() => shareLink(result)} />)}
          {data?.hasMore && <Button variant="outline" onClick={() => setPage((current) => current + 1)} className="label-mono self-center">Load more <ChevronDown data-icon="inline-end" /></Button>}
        </section>
        {researchOpen && <div className="lg:sticky lg:top-24"><ResearchPanel open={researchOpen} onToggle={() => setResearchOpen(false)} savedResults={savedResults} note={note} onNoteChange={setNote} onRemove={(id) => setSavedIds((current) => current.filter((item) => item !== id))} onExport={exportSaved} /></div>}
      </div>
    </div>
  )
}
