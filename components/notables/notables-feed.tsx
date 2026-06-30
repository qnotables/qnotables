"use client"

import { useState, useTransition, useCallback } from "react"
import { Search, Calendar, Tag, ExternalLink, RefreshCw, ChevronLeft, ChevronRight } from "lucide-react"
import { getNotables, type NotablesPost } from "@/app/actions/notables-actions"
import DOMPurify from "isomorphic-dompurify"

interface Props {
  initialItems: NotablesPost[]
  initialTotal: number
  boards: string[] // tags in this context
}

const PAGE_SIZE = 20

function formatDate(iso: string | null): string {
  if (!iso) return "—"
  try {
    return new Date(iso).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  } catch {
    return iso
  }
}

function sanitizeBody(html: string | null): string {
  if (!html) return ""
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ["b", "i", "em", "strong", "a", "br", "p", "span"],
    ALLOWED_ATTR: ["href", "class"],
  })
}

function NotablesCard({ item }: { item: NotablesPost }) {
  const cleanBody = sanitizeBody(item.excerpt ?? item.body)

  return (
    <article className="border border-border bg-card p-4 transition-colors hover:bg-muted/40">
      {/* Header row */}
      <div className="mb-2 flex flex-wrap items-start justify-between gap-2">
        {item.tag && (
          <span className="label-mono inline-flex items-center gap-1 border border-border bg-muted/40 px-2 py-0.5 text-[10px] uppercase text-muted-foreground">
            <Tag className="h-3 w-3" />
            {item.tag}
          </span>
        )}
        <span className="label-mono ml-auto text-[10px] text-muted-foreground">
          {formatDate(item.published_at ?? item.created_at)}
        </span>
      </div>

      {/* Title */}
      <h2 className="stencil mb-2 text-sm leading-snug text-foreground">{item.title}</h2>

      {/* Excerpt / body */}
      {cleanBody && (
        <div
          className="mb-3 line-clamp-4 text-xs leading-relaxed text-muted-foreground"
          dangerouslySetInnerHTML={{ __html: cleanBody }}
        />
      )}

      {/* Footer: post_type + source link */}
      <div className="flex flex-wrap items-center gap-3 border-t border-border pt-2">
        {item.post_type && (
          <span className="label-mono text-[10px] text-muted-foreground">{item.post_type}</span>
        )}
        {item.source_url && (
          <a
            href={item.source_url}
            target="_blank"
            rel="noopener noreferrer"
            className="label-mono ml-auto flex items-center gap-1 text-[10px] text-primary hover:underline"
          >
            Source
            <ExternalLink className="h-3 w-3" />
          </a>
        )}
      </div>
    </article>
  )
}

export function NotablesFeed({ initialItems, initialTotal, boards }: Props) {
  const [items, setItems] = useState<NotablesPost[]>(initialItems)
  const [total, setTotal] = useState(initialTotal)
  const [search, setSearch] = useState("")
  const [board, setBoard] = useState("all")
  const [dateFrom, setDateFrom] = useState("")
  const [dateTo, setDateTo] = useState("")
  const [page, setPage] = useState(1)
  const [isPending, startTransition] = useTransition()

  const totalPages = Math.ceil(total / PAGE_SIZE)

  const fetchData = useCallback(
    (overrides?: { search?: string; board?: string; dateFrom?: string; dateTo?: string; page?: number }) => {
      startTransition(async () => {
        const s = overrides?.search ?? search
        const b = overrides?.board ?? board
        const df = overrides?.dateFrom ?? dateFrom
        const dt = overrides?.dateTo ?? dateTo
        const p = overrides?.page ?? page

        const result = await getNotables({
          search: s || undefined,
          tag: b !== "all" ? b : undefined,
          dateFrom: df || undefined,
          dateTo: dt || undefined,
          page: p,
          pageSize: PAGE_SIZE,
        })
        setItems(result.items)
        setTotal(result.total)
      })
    },
    [search, board, dateFrom, dateTo, page],
  )

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    setPage(1)
    fetchData({ page: 1 })
  }

  function handleBoardChange(val: string) {
    setBoard(val)
    setPage(1)
    fetchData({ board: val, page: 1 })
  }

  function handleDateFromChange(val: string) {
    setDateFrom(val)
    setPage(1)
    fetchData({ dateFrom: val, page: 1 })
  }

  function handleDateToChange(val: string) {
    setDateTo(val)
    setPage(1)
    fetchData({ dateTo: val, page: 1 })
  }

  function handleReset() {
    setSearch("")
    setBoard("all")
    setDateFrom("")
    setDateTo("")
    setPage(1)
    startTransition(async () => {
      const result = await getNotables({ page: 1, pageSize: PAGE_SIZE })
      setItems(result.items)
      setTotal(result.total)
    })
  }

  function handlePageChange(p: number) {
    setPage(p)
    fetchData({ page: p })
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Filters */}
      <div className="border border-border bg-card p-4">
        <form onSubmit={handleSearch} className="flex flex-wrap gap-3">
          {/* Search */}
          <div className="relative min-w-[200px] flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search notables..."
              className="label-mono w-full border border-border bg-background pl-9 pr-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>

          {/* Tag filter */}
          <select
            value={board}
            onChange={(e) => handleBoardChange(e.target.value)}
            className="label-mono border border-border bg-background px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          >
            <option value="all">All Tags</option>
            {boards.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>

          {/* Date from */}
          <div className="flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => handleDateFromChange(e.target.value)}
              className="label-mono border border-border bg-background px-2 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            />
            <span className="label-mono text-xs text-muted-foreground">to</span>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => handleDateToChange(e.target.value)}
              className="label-mono border border-border bg-background px-2 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>

          <button
            type="submit"
            className="label-mono border border-primary bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground transition-opacity hover:opacity-90"
          >
            SEARCH
          </button>
          <button
            type="button"
            onClick={handleReset}
            className="label-mono border border-border px-3 py-2 text-xs text-muted-foreground transition-colors hover:bg-muted/40"
          >
            RESET
          </button>
        </form>
      </div>

      {/* Count + loading */}
      <div className="flex items-center justify-between">
        <p className="label-mono text-xs text-muted-foreground">
          {isPending ? "Loading…" : `${total.toLocaleString()} notable${total !== 1 ? "s" : ""}`}
          {total > 0 && !isPending && (
            <span className="ml-2 text-muted-foreground/60">
              — page {page} of {totalPages}
            </span>
          )}
        </p>
        {isPending && <RefreshCw className="h-4 w-4 animate-spin text-muted-foreground" />}
      </div>

      {/* Items */}
      {items.length === 0 && !isPending ? (
        <div className="border border-dashed border-border bg-card px-6 py-12 text-center">
          <p className="label-mono text-sm text-muted-foreground">No notables found.</p>
          {(search || board !== "all" || dateFrom || dateTo) && (
            <button
              onClick={handleReset}
              className="label-mono mt-3 text-xs text-primary hover:underline"
            >
              Clear filters
            </button>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {items.map((item) => (
            <NotablesCard key={item.id} item={item} />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <nav className="flex items-center justify-center gap-2" aria-label="Pagination">
          <button
            onClick={() => handlePageChange(page - 1)}
            disabled={page <= 1 || isPending}
            className="label-mono flex items-center gap-1 border border-border px-3 py-2 text-xs text-muted-foreground transition-colors hover:bg-muted/40 disabled:pointer-events-none disabled:opacity-40"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
            Prev
          </button>
          <span className="label-mono text-xs text-muted-foreground">
            {page} / {totalPages}
          </span>
          <button
            onClick={() => handlePageChange(page + 1)}
            disabled={page >= totalPages || isPending}
            className="label-mono flex items-center gap-1 border border-border px-3 py-2 text-xs text-muted-foreground transition-colors hover:bg-muted/40 disabled:pointer-events-none disabled:opacity-40"
          >
            Next
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </nav>
      )}
    </div>
  )
}
