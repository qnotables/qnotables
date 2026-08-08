"use client"

import { useState, useTransition } from "react"
import Link from "next/link"
import { ArrowLeft, RefreshCw, Check, X, Tag, AlertTriangle, CheckCircle2 } from "lucide-react"
import { categories, type Category } from "@/lib/news-data"
import {
  previewReclassify,
  applyReclassify,
  type ReclassifyPreviewRow,
} from "@/app/actions/reclassify-actions"

const VALID_CATEGORIES = new Set<string>(categories)

// Confidence bar colour thresholds
function confidenceClass(c: number) {
  if (c >= 0.9) return "bg-green-500"
  if (c >= 0.75) return "bg-yellow-500"
  return "bg-red-500"
}

interface Props {
  initialDistribution: { category: string | null; count: number }[]
}

export function ReclassifyClient({ initialDistribution }: Props) {
  // ── UI state ───────────────────────────────────────────────────────────────
  const [rows, setRows] = useState<ReclassifyPreviewRow[]>([])
  const [totalMatched, setTotalMatched] = useState(0)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [result, setResult] = useState<{
    updated: number
    skipped: number
    errors: string[]
  } | null>(null)

  // filter state
  const [invalidOnly, setInvalidOnly] = useState(true)
  const [filterCategory, setFilterCategory] = useState("")
  const [pageSize, setPageSize] = useState(100)
  const [offset, setOffset] = useState(0)

  const [isPending, startTransition] = useTransition()
  const [applyPending, startApply] = useTransition()

  // ── Actions ────────────────────────────────────────────────────────────────

  function runPreview(newOffset = 0) {
    setResult(null)
    setSelected(new Set())
    startTransition(async () => {
      const { rows: fetched, totalMatched: total } = await previewReclassify({
        invalidOnly,
        currentCategory: filterCategory || undefined,
        limit: pageSize,
        offset: newOffset,
      })
      setRows(fetched)
      setTotalMatched(total)
      setOffset(newOffset)
    })
  }

  function handleSelectAll() {
    if (selected.size === rows.length) {
      setSelected(new Set())
    } else {
      setSelected(new Set(rows.map(r => r.id)))
    }
  }

  function toggleRow(id: string) {
    setSelected(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  function handleApply() {
    if (selected.size === 0) return
    startApply(async () => {
      const applyResult = await applyReclassify(Array.from(selected), {
        allowOverwriteValid: false,
      })
      setResult(applyResult)
      // Re-run preview at same offset so the list reflects the changes
      runPreview(offset)
    })
  }

  // Breakdown of invalid vs valid in distribution
  const invalidCount = initialDistribution
    .filter(d => d.category !== null && !VALID_CATEGORIES.has(d.category))
    .reduce((s, d) => s + d.count, 0)
  const noneCount = initialDistribution.find(d => d.category === null)?.count ?? 0

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-background tactical-grid">
      {/* Header */}
      <header className="border-b border-border bg-background/95 backdrop-blur sticky top-0 z-10">
        <div className="mx-auto max-w-7xl px-4 py-4 md:px-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              href="/admin"
              className="label-mono flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-4 w-4" /> Admin
            </Link>
            <span className="text-border">/</span>
            <h1 className="stencil text-xl text-foreground">Reclassify Stories</h1>
          </div>
          <p className="label-mono text-xs text-muted-foreground hidden sm:block">
            // DETERMINISTIC · NO AI · READ-ONLY PREVIEW
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 md:px-6 space-y-8">

        {/* Distribution overview */}
        <section>
          <h2 className="stencil text-sm text-muted-foreground mb-3">CURRENT CATEGORY DISTRIBUTION</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
            {initialDistribution.slice(0, 15).map(d => {
              const isValid = d.category !== null && VALID_CATEGORIES.has(d.category)
              const label = d.category ?? "(none)"
              return (
                <div
                  key={label}
                  className={`border p-3 ${
                    isValid
                      ? "border-border bg-card"
                      : "border-yellow-500/40 bg-yellow-500/5"
                  }`}
                >
                  <p className="label-mono text-xs text-muted-foreground truncate">{label}</p>
                  <p className="stencil text-lg text-foreground mt-1">{d.count}</p>
                  {!isValid && (
                    <p className="label-mono text-xs text-yellow-500 mt-1">invalid</p>
                  )}
                </div>
              )
            })}
          </div>
          {(invalidCount + noneCount) > 0 && (
            <p className="label-mono text-sm text-yellow-500 mt-3 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              {invalidCount + noneCount} posts with invalid or missing categories
            </p>
          )}
        </section>

        {/* Filters */}
        <section className="border border-border bg-card p-6 space-y-4">
          <h2 className="stencil text-sm text-foreground">FILTER &amp; PREVIEW</h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="label-mono text-xs text-muted-foreground block mb-1">
                CURRENT CATEGORY (filter)
              </label>
              <select
                value={filterCategory}
                onChange={e => setFilterCategory(e.target.value)}
                className="w-full px-3 py-2 border border-border bg-background text-sm"
              >
                <option value="">All categories</option>
                {initialDistribution.map(d => (
                  <option key={d.category ?? "__none__"} value={d.category ?? ""}>
                    {d.category ?? "(none)"} ({d.count})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="label-mono text-xs text-muted-foreground block mb-1">
                PAGE SIZE
              </label>
              <select
                value={pageSize}
                onChange={e => setPageSize(Number(e.target.value))}
                className="w-full px-3 py-2 border border-border bg-background text-sm"
              >
                {[50, 100, 200, 500].map(n => (
                  <option key={n} value={n}>{n} rows</option>
                ))}
              </select>
            </div>

            <div className="flex items-end">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={invalidOnly}
                  onChange={e => setInvalidOnly(e.target.checked)}
                  className="h-4 w-4"
                />
                <span className="label-mono text-xs text-muted-foreground">
                  INVALID CATEGORIES ONLY
                </span>
              </label>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => runPreview(0)}
              disabled={isPending}
              className="label-mono flex items-center gap-2 border border-primary text-primary px-4 py-2 hover:bg-primary/10 disabled:opacity-50 transition-colors text-sm"
            >
              <RefreshCw className={`h-4 w-4 ${isPending ? "animate-spin" : ""}`} />
              {isPending ? "SCANNING..." : "PREVIEW CHANGES"}
            </button>
          </div>
        </section>

        {/* Apply result banner */}
        {result && (
          <div
            className={`border p-4 flex items-start gap-3 ${
              result.errors.length > 0
                ? "border-red-500/40 bg-red-500/5"
                : "border-green-500/40 bg-green-500/5"
            }`}
          >
            {result.errors.length === 0 ? (
              <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
            ) : (
              <AlertTriangle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
            )}
            <div className="space-y-1">
              <p className="label-mono text-sm text-foreground">
                {result.updated} updated · {result.skipped} skipped
                {result.errors.length > 0 && ` · ${result.errors.length} errors`}
              </p>
              {result.errors.map((e, i) => (
                <p key={i} className="label-mono text-xs text-red-400">{e}</p>
              ))}
            </div>
          </div>
        )}

        {/* Preview table */}
        {rows.length > 0 && (
          <section className="space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-4">
                <h2 className="stencil text-sm text-foreground">
                  PREVIEW — {rows.length} ROWS SHOWN
                  {totalMatched > rows.length && (
                    <span className="text-muted-foreground"> (of {totalMatched} matched)</span>
                  )}
                </h2>
                <button
                  onClick={handleSelectAll}
                  className="label-mono text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  {selected.size === rows.length ? "Deselect all" : "Select all"}
                </button>
              </div>

              <div className="flex items-center gap-3">
                {selected.size > 0 && (
                  <span className="label-mono text-xs text-muted-foreground">
                    {selected.size} selected
                  </span>
                )}
                <button
                  onClick={handleApply}
                  disabled={selected.size === 0 || applyPending}
                  className="label-mono flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 hover:bg-primary/90 disabled:opacity-50 transition-colors text-sm"
                >
                  {applyPending ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <Tag className="h-4 w-4" />
                  )}
                  APPLY {selected.size > 0 ? `(${selected.size})` : ""}
                </button>
              </div>
            </div>

            <div className="border border-border overflow-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="px-3 py-2 w-10">
                      <input
                        type="checkbox"
                        checked={selected.size === rows.length && rows.length > 0}
                        onChange={handleSelectAll}
                        className="h-4 w-4"
                      />
                    </th>
                    <th className="px-3 py-2 text-left label-mono text-xs text-muted-foreground font-normal">
                      TITLE
                    </th>
                    <th className="px-3 py-2 text-left label-mono text-xs text-muted-foreground font-normal w-32">
                      CURRENT
                    </th>
                    <th className="px-3 py-2 text-left label-mono text-xs text-muted-foreground font-normal w-32">
                      SUGGESTED
                    </th>
                    <th className="px-3 py-2 text-left label-mono text-xs text-muted-foreground font-normal w-28">
                      CONFIDENCE
                    </th>
                    <th className="px-3 py-2 text-left label-mono text-xs text-muted-foreground font-normal">
                      REASONING
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map(row => (
                    <tr
                      key={row.id}
                      onClick={() => toggleRow(row.id)}
                      className={`border-b border-border cursor-pointer transition-colors ${
                        selected.has(row.id)
                          ? "bg-primary/8"
                          : "hover:bg-muted/20"
                      } ${!row.wouldChange ? "opacity-50" : ""}`}
                    >
                      <td className="px-3 py-3" onClick={e => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={selected.has(row.id)}
                          onChange={() => toggleRow(row.id)}
                          className="h-4 w-4"
                        />
                      </td>
                      <td className="px-3 py-3">
                        <p className="font-medium text-foreground line-clamp-2 leading-snug">
                          {row.title}
                        </p>
                      </td>
                      <td className="px-3 py-3">
                        <span
                          className={`label-mono text-xs px-2 py-0.5 ${
                            row.currentIsValid
                              ? "bg-muted text-muted-foreground"
                              : "bg-yellow-500/15 text-yellow-400"
                          }`}
                        >
                          {row.currentCategory ?? "(none)"}
                        </span>
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-1">
                          {row.wouldChange ? (
                            <Check className="h-3 w-3 text-green-500 shrink-0" />
                          ) : (
                            <X className="h-3 w-3 text-muted-foreground shrink-0" />
                          )}
                          <span className="label-mono text-xs text-foreground">
                            {row.suggestedCategory}
                          </span>
                        </div>
                      </td>
                      <td className="px-3 py-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <div className="h-1.5 w-16 bg-muted rounded-full overflow-hidden">
                              <div
                                className={`h-full ${confidenceClass(row.confidence)} rounded-full`}
                                style={{ width: `${Math.round(row.confidence * 100)}%` }}
                              />
                            </div>
                            <span className="label-mono text-xs text-muted-foreground">
                              {Math.round(row.confidence * 100)}%
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-3">
                        <p className="label-mono text-xs text-muted-foreground line-clamp-2">
                          {row.reasoning}
                        </p>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalMatched > pageSize && (
              <div className="flex items-center justify-between">
                <p className="label-mono text-xs text-muted-foreground">
                  Showing {offset + 1}–{Math.min(offset + rows.length, totalMatched)} of {totalMatched}
                </p>
                <div className="flex gap-2">
                  <button
                    disabled={offset === 0 || isPending}
                    onClick={() => runPreview(Math.max(0, offset - pageSize))}
                    className="label-mono text-xs border border-border px-3 py-1.5 hover:bg-muted/30 disabled:opacity-40 transition-colors"
                  >
                    Previous
                  </button>
                  <button
                    disabled={offset + pageSize >= totalMatched || isPending}
                    onClick={() => runPreview(offset + pageSize)}
                    className="label-mono text-xs border border-border px-3 py-1.5 hover:bg-muted/30 disabled:opacity-40 transition-colors"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </section>
        )}

        {rows.length === 0 && !isPending && totalMatched > 0 && (
          <div className="border border-border bg-card p-8 text-center">
            <CheckCircle2 className="h-8 w-8 text-green-500 mx-auto mb-3" />
            <p className="stencil text-foreground">No rows to reclassify</p>
            <p className="label-mono text-xs text-muted-foreground mt-1">
              All matched posts already have valid categories.
            </p>
          </div>
        )}
      </main>
    </div>
  )
}
