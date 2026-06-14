"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import Link from "next/link"
import { Search, X, FileText, MessageSquare, Radio, ArrowRight, Loader2 } from "lucide-react"

interface ThreadResult {
  id: string
  title: string
  body: string
  created_at: string
  profiles: { display_name: string } | null
}

interface PostResult {
  id: string
  slug: string
  title: string
  excerpt: string
  tag: string
  created_at: string
}

interface SearchResults {
  threads: ThreadResult[]
  posts: PostResult[]
}

interface Props {
  open: boolean
  onClose: () => void
  // RSS wire stories passed from a server component so they're searchable client-side
  wireStories?: { id: string; headline: string; summary: string; source: string; url?: string }[]
}

export function SearchOverlay({ open, onClose, wireStories = [] }: Props) {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<SearchResults | null>(null)
  const [loading, setLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Focus input when opened
  useEffect(() => {
    if (open) {
      setQuery("")
      setResults(null)
      setTimeout(() => inputRef.current?.focus(), 60)
    }
  }, [open])

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [onClose])

  const runSearch = useCallback(async (q: string) => {
    if (q.trim().length < 2) {
      setResults(null)
      setLoading(false)
      return
    }
    setLoading(true)
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`)
      const data: SearchResults = await res.json()
      setResults(data)
    } catch {
      setResults({ threads: [], posts: [] })
    } finally {
      setLoading(false)
    }
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const q = e.target.value
    setQuery(q)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => runSearch(q), 320)
  }

  // Filter wire stories client-side
  const wireMatches =
    query.trim().length >= 2
      ? wireStories.filter(
          (s) =>
            s.headline.toLowerCase().includes(query.toLowerCase()) ||
            s.summary.toLowerCase().includes(query.toLowerCase()),
        ).slice(0, 5)
      : []

  const hasResults =
    results && (results.threads.length > 0 || results.posts.length > 0 || wireMatches.length > 0)
  const noResults =
    query.trim().length >= 2 &&
    !loading &&
    results !== null &&
    !hasResults &&
    wireMatches.length === 0

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col bg-background/95 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="Search"
    >
      {/* Search input bar */}
      <div className="border-b border-border bg-card px-4 py-4 md:px-8">
        <div className="mx-auto flex max-w-3xl items-center gap-4">
          <div className="flex flex-1 items-center gap-3 border border-border bg-background px-4 py-3 focus-within:border-primary">
            {loading ? (
              <Loader2 className="h-5 w-5 shrink-0 animate-spin text-primary" />
            ) : (
              <Search className="h-5 w-5 shrink-0 text-muted-foreground" />
            )}
            <input
              ref={inputRef}
              type="search"
              value={query}
              onChange={handleChange}
              placeholder="Search dispatches, forum threads, field notes…"
              className="flex-1 bg-transparent text-foreground placeholder:text-muted-foreground focus:outline-none label-mono text-sm"
              autoComplete="off"
              spellCheck={false}
            />
            {query && (
              <button
                type="button"
                onClick={() => { setQuery(""); setResults(null) }}
                className="text-muted-foreground hover:text-foreground"
                aria-label="Clear search"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="label-mono shrink-0 border border-border px-3 py-3 text-muted-foreground transition-colors hover:border-primary hover:text-primary"
            aria-label="Close search"
          >
            ESC
          </button>
        </div>
      </div>

      {/* Results */}
      <div className="flex-1 overflow-y-auto px-4 py-6 md:px-8">
        <div className="mx-auto max-w-3xl space-y-8">

          {/* Empty prompt */}
          {!query && (
            <div className="flex flex-col items-center gap-3 py-16 text-center text-muted-foreground">
              <Search className="h-10 w-10 opacity-30" />
              <p className="label-mono text-sm">Type to search news, forum & field notes</p>
            </div>
          )}

          {/* No results */}
          {noResults && (
            <div className="flex flex-col items-center gap-3 py-16 text-center text-muted-foreground">
              <p className="label-mono text-sm">No results for &ldquo;{query}&rdquo;</p>
            </div>
          )}

          {/* Wire / News results */}
          {wireMatches.length > 0 && (
            <section>
              <div className="mb-3 flex items-center gap-2">
                <Radio className="h-4 w-4 text-primary" />
                <h2 className="label-mono text-xs text-primary">NEWS WIRE</h2>
              </div>
              <ul className="flex flex-col gap-2">
                {wireMatches.map((s) => (
                  <li key={s.id}>
                    {s.url ? (
                      <a
                        href={s.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={onClose}
                        className="group flex items-start gap-3 border border-border bg-card p-4 transition-colors hover:border-primary"
                      >
                        <ArrowRight className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground group-hover:text-primary" />
                        <div className="min-w-0">
                          <p className="stencil text-sm text-foreground group-hover:text-primary">
                            {s.headline}
                          </p>
                          <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">
                            {s.source} — {s.summary}
                          </p>
                        </div>
                      </a>
                    ) : (
                      <div className="flex items-start gap-3 border border-border bg-card p-4">
                        <ArrowRight className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                        <div className="min-w-0">
                          <p className="stencil text-sm text-foreground">{s.headline}</p>
                          <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">
                            {s.source} — {s.summary}
                          </p>
                        </div>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Forum threads */}
          {results && results.threads.length > 0 && (
            <section>
              <div className="mb-3 flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-primary" />
                <h2 className="label-mono text-xs text-primary">FORUM THREADS</h2>
              </div>
              <ul className="flex flex-col gap-2">
                {results.threads.map((t) => (
                  <li key={t.id}>
                    <Link
                      href={`/forum/${t.id}`}
                      onClick={onClose}
                      className="group flex items-start gap-3 border border-border bg-card p-4 transition-colors hover:border-primary"
                    >
                      <ArrowRight className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground group-hover:text-primary" />
                      <div className="min-w-0">
                        <p className="stencil text-sm text-foreground group-hover:text-primary">
                          {t.title}
                        </p>
                        <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">
                          {t.profiles?.display_name ?? "operator"} —{" "}
                          {t.body.replace(/!\[.*?\]\(.*?\)/g, "").slice(0, 80)}
                        </p>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Blog / Field Notes */}
          {results && results.posts.length > 0 && (
            <section>
              <div className="mb-3 flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary" />
                <h2 className="label-mono text-xs text-primary">FIELD NOTES</h2>
              </div>
              <ul className="flex flex-col gap-2">
                {results.posts.map((p) => (
                  <li key={p.id}>
                    <Link
                      href={`/blog/${p.slug}`}
                      onClick={onClose}
                      className="group flex items-start gap-3 border border-border bg-card p-4 transition-colors hover:border-primary"
                    >
                      <ArrowRight className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground group-hover:text-primary" />
                      <div className="min-w-0">
                        <p className="stencil text-sm text-foreground group-hover:text-primary">
                          {p.title}
                        </p>
                        <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">
                          {p.tag} — {p.excerpt}
                        </p>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      </div>
    </div>
  )
}
