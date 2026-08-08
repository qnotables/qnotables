"use client"

import { useState, useTransition } from "react"
import Link from "next/link"
import {
  ArrowLeft,
  RefreshCw,
  Check,
  X,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  AlertTriangle,
  CheckCircle2,
  Eye,
} from "lucide-react"
import {
  DESKS,
  CONTENT_TYPES,
  DESK_LABELS,
  CONTENT_TYPE_LABELS,
  type Desk,
  type ContentType,
} from "@/lib/taxonomy"
import {
  previewTaxonomy,
  applyTaxonomy,
  rollbackTaxonomy,
  getTaxonomyStats,
  type TaxonomyPreviewRow,
  type TaxonomyStats,
  type TaxonomyApplyInput,
} from "@/app/actions/taxonomy-actions"

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function confidenceClass(c: number) {
  if (c >= 0.85) return "bg-green-500"
  if (c >= 0.65) return "bg-yellow-500"
  return "bg-red-500"
}

function confidenceLabel(c: number) {
  if (c >= 0.85) return "High"
  if (c >= 0.65) return "Medium"
  return "Low"
}

function pct(n: number, total: number) {
  if (!total) return "0%"
  return `${Math.round((n / total) * 100)}%`
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface Props {
  initialStats: TaxonomyStats
  legacyCategories: string[]
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function TaxonomyClient({ initialStats, legacyCategories }: Props) {
  // ── Stats state ────────────────────────────────────────────────────────────
  const [stats, setStats] = useState<TaxonomyStats>(initialStats)

  // ── Preview rows state ─────────────────────────────────────────────────────
  const [rows, setRows] = useState<TaxonomyPreviewRow[]>([])
  const [total, setTotal] = useState(0)
  const [offset, setOffset] = useState(0)
  const PAGE_SIZE = 50

  // ── Selection state ────────────────────────────────────────────────────────
  const [selected, setSelected] = useState<Set<string>>(new Set())

  // Per-row overrides: users can edit the suggested desk/contentType before applying
  const [overrides, setOverrides] = useState<
    Map<string, { desk: Desk; contentType: ContentType; tags: string[] }>
  >(new Map())

  // ── Filter state ───────────────────────────────────────────────────────────
  const [filterLegacy, setFilterLegacy] = useState("")
  const [filterDesk, setFilterDesk] = useState<Desk | "">("")
  const [missingOnly, setMissingOnly] = useState(true)
  const [unreviewedOnly, setUnreviewedOnly] = useState(false)

  // ── Mode state ─────────────────────────────────────────────────────────────
  const [mode, setMode] = useState<"preview" | "apply" | "rollback">("preview")

  // ── Result state ───────────────────────────────────────────────────────────
  const [result, setResult] = useState<{
    updated: number
    skipped: number
    errors: string[]
  } | null>(null)

  // ── Pending transitions ────────────────────────────────────────────────────
  const [isPreviewing, startPreview] = useTransition()
  const [isApplying, startApply] = useTransition()
  const [isRollingBack, startRollback] = useTransition()

  // ── Derived ────────────────────────────────────────────────────────────────
  const selectedCount = selected.size
  const allSelected = rows.length > 0 && selected.size === rows.length

  // ── Handlers ───────────────────────────────────────────────────────────────

  function runPreview(newOffset = 0) {
    setResult(null)
    setSelected(new Set())
    setOverrides(new Map())
    startPreview(async () => {
      const { rows: fetched, total: t } = await previewTaxonomy({
        missingOnly,
        unreviewedOnly,
        legacyCategory: filterLegacy || undefined,
        suggestedDesk: filterDesk || undefined,
        limit: PAGE_SIZE,
        offset: newOffset,
      })
      setRows(fetched)
      setTotal(t)
      setOffset(newOffset)
    })
  }

  function toggleRow(id: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  function toggleAll() {
    if (allSelected) {
      setSelected(new Set())
    } else {
      setSelected(new Set(rows.map((r) => r.id)))
    }
  }

  function setOverride(
    id: string,
    field: "desk" | "contentType" | "tags",
    value: string | string[]
  ) {
    setOverrides((prev) => {
      const next = new Map(prev)
      const row = rows.find((r) => r.id === id)!
      const existing = next.get(id) ?? {
        desk: row.suggestedDesk,
        contentType: row.suggestedContentType,
        tags: row.suggestedTags,
      }
      next.set(id, { ...existing, [field]: value })
      return next
    })
  }

  function handleApply() {
    if (selectedCount === 0) return
    setResult(null)
    startApply(async () => {
      const inputs: TaxonomyApplyInput[] = Array.from(selected).map((id) => {
        const row = rows.find((r) => r.id === id)!
        const override = overrides.get(id)
        return {
          id,
          desk: override?.desk ?? row.suggestedDesk,
          contentType: override?.contentType ?? row.suggestedContentType,
          tags: override?.tags ?? row.suggestedTags,
        }
      })
      const res = await applyTaxonomy(inputs)
      setResult(res)
      // Refresh stats
      const freshStats = await getTaxonomyStats()
      setStats(freshStats)
      // Remove applied rows from view
      setRows((prev) => prev.filter((r) => !selected.has(r.id)))
      setSelected(new Set())
    })
  }

  function handleRollback() {
    if (selectedCount === 0) return
    setResult(null)
    startRollback(async () => {
      const res = await rollbackTaxonomy(Array.from(selected))
      setResult(res)
      const freshStats = await getTaxonomyStats()
      setStats(freshStats)
      setRows((prev) => prev.filter((r) => !selected.has(r.id)))
      setSelected(new Set())
    })
  }

  const totalPages = Math.ceil(total / PAGE_SIZE)
  const currentPage = Math.floor(offset / PAGE_SIZE) + 1
  const isWorking = isPreviewing || isApplying || isRollingBack

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <div className="border-b border-border px-6 py-4">
        <div className="mx-auto max-w-7xl flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/admin"
              className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Admin
            </Link>
            <span className="text-muted-foreground">/</span>
            <h1 className="stencil text-foreground">Archive Taxonomy Cleanup</h1>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-6 py-8 space-y-8">

        {/* Stats Banner */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard label="Total Posts" value={stats.totalPosts} />
          <StatCard
            label="With Desk"
            value={stats.withDesk}
            sub={pct(stats.withDesk, stats.totalPosts)}
          />
          <StatCard
            label="With Content Type"
            value={stats.withContentType}
            sub={pct(stats.withContentType, stats.totalPosts)}
          />
          <StatCard
            label="Reviewed"
            value={stats.reviewed}
            sub={`${stats.needsReview} remaining`}
          />
        </div>

        {/* Desk breakdown */}
        {stats.deskBreakdown.length > 0 && (
          <div>
            <h2 className="label-mono text-xs text-muted-foreground mb-3 uppercase tracking-widest">
              Desk Breakdown
            </h2>
            <div className="flex flex-wrap gap-2">
              {stats.deskBreakdown.map(({ desk, count }) => (
                <span
                  key={desk}
                  className="border border-border px-2 py-1 text-xs label-mono"
                >
                  {DESK_LABELS[desk as Desk] ?? desk}: {count}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Mode tabs */}
        <div className="flex gap-0 border border-border w-fit">
          {(["preview", "apply", "rollback"] as const).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`px-4 py-2 text-sm label-mono uppercase tracking-wide transition-colors ${
                mode === m
                  ? "bg-foreground text-background"
                  : "bg-background text-muted-foreground hover:text-foreground"
              }`}
            >
              {m}
            </button>
          ))}
        </div>

        {/* Filters */}
        <div className="border border-border p-4 space-y-3">
          <h2 className="label-mono text-xs text-muted-foreground uppercase tracking-widest">
            Filters
          </h2>
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex items-center gap-2">
              <input
                id="missing-only"
                type="checkbox"
                checked={missingOnly}
                onChange={(e) => setMissingOnly(e.target.checked)}
                className="h-4 w-4"
              />
              <label htmlFor="missing-only" className="text-sm">
                Missing desk/type only
              </label>
            </div>
            <div className="flex items-center gap-2">
              <input
                id="unreviewed-only"
                type="checkbox"
                checked={unreviewedOnly}
                onChange={(e) => setUnreviewedOnly(e.target.checked)}
                className="h-4 w-4"
              />
              <label htmlFor="unreviewed-only" className="text-sm">
                Unreviewed only
              </label>
            </div>
            <select
              value={filterLegacy}
              onChange={(e) => setFilterLegacy(e.target.value)}
              className="border border-border bg-background px-3 py-1.5 text-sm"
            >
              <option value="">All legacy categories</option>
              {legacyCategories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
            <select
              value={filterDesk}
              onChange={(e) => setFilterDesk(e.target.value as Desk | "")}
              className="border border-border bg-background px-3 py-1.5 text-sm"
            >
              <option value="">All desks</option>
              {DESKS.map((d) => (
                <option key={d} value={d}>
                  {DESK_LABELS[d]}
                </option>
              ))}
            </select>
          </div>
          <button
            onClick={() => runPreview(0)}
            disabled={isWorking}
            className="flex items-center gap-2 border border-border bg-background px-4 py-2 text-sm hover:border-foreground transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${isPreviewing ? "animate-spin" : ""}`} />
            Preview
          </button>
        </div>

        {/* Result toast */}
        {result && (
          <div
            className={`border p-4 text-sm ${
              result.errors.length > 0
                ? "border-red-500 text-red-400"
                : "border-green-500 text-green-400"
            }`}
          >
            {result.errors.length === 0 ? (
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" />
                Updated {result.updated} rows, skipped {result.skipped}
              </div>
            ) : (
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  Updated {result.updated}, skipped {result.skipped},{" "}
                  {result.errors.length} error(s)
                </div>
                {result.errors.map((e, i) => (
                  <div key={i} className="text-xs pl-6">
                    {e}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Table */}
        {rows.length > 0 && (
          <div className="space-y-3">
            {/* Bulk actions bar */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 text-sm">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={toggleAll}
                  className="h-4 w-4"
                />
                <span className="text-muted-foreground">
                  {selectedCount} / {rows.length} selected
                </span>
              </div>
              <div className="flex gap-2">
                {mode === "apply" && (
                  <button
                    onClick={handleApply}
                    disabled={selectedCount === 0 || isApplying}
                    className="flex items-center gap-2 bg-foreground text-background px-4 py-2 text-sm disabled:opacity-50 hover:opacity-90 transition-opacity"
                  >
                    <Check className="h-4 w-4" />
                    Apply {selectedCount > 0 ? `(${selectedCount})` : ""}
                  </button>
                )}
                {mode === "rollback" && (
                  <button
                    onClick={handleRollback}
                    disabled={selectedCount === 0 || isRollingBack}
                    className="flex items-center gap-2 border border-red-500 text-red-400 px-4 py-2 text-sm disabled:opacity-50 hover:border-red-400 transition-colors"
                  >
                    <RotateCcw className="h-4 w-4" />
                    Rollback {selectedCount > 0 ? `(${selectedCount})` : ""}
                  </button>
                )}
              </div>
            </div>

            {/* Row list */}
            <div className="border border-border divide-y divide-border">
              {rows.map((row) => {
                const override = overrides.get(row.id)
                const displayDesk = override?.desk ?? row.suggestedDesk
                const displayCT = override?.contentType ?? row.suggestedContentType
                const isSelected = selected.has(row.id)

                return (
                  <div
                    key={row.id}
                    className={`p-4 space-y-3 transition-colors ${
                      isSelected ? "bg-foreground/5" : ""
                    }`}
                  >
                    {/* Row header */}
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleRow(row.id)}
                        className="mt-1 h-4 w-4 flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-sm truncate">{row.title}</span>
                          {row.taxonomyReviewed && (
                            <span className="text-xs border border-green-500 text-green-400 px-1.5 py-0.5">
                              Reviewed
                            </span>
                          )}
                          {row.requiresReview && !row.taxonomyReviewed && (
                            <span className="text-xs border border-yellow-500 text-yellow-400 px-1.5 py-0.5">
                              Needs Review
                            </span>
                          )}
                        </div>
                        {row.legacyCategory && (
                          <div className="mt-0.5 text-xs text-muted-foreground label-mono">
                            Legacy: {row.legacyCategory}
                          </div>
                        )}
                      </div>

                      {/* Confidence badge */}
                      <div className="flex flex-col items-end gap-1 flex-shrink-0">
                        <span className="text-xs text-muted-foreground label-mono">
                          {confidenceLabel(row.confidence)}
                        </span>
                        <div className="w-20 h-1.5 bg-muted">
                          <div
                            className={`h-full ${confidenceClass(row.confidence)}`}
                            style={{ width: `${Math.round(row.confidence * 100)}%` }}
                          />
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {Math.round(row.confidence * 100)}%
                        </span>
                      </div>
                    </div>

                    {/* Current vs. suggested */}
                    <div className="pl-7 grid grid-cols-1 md:grid-cols-2 gap-3">
                      {/* Current */}
                      <div className="space-y-1">
                        <div className="text-xs label-mono text-muted-foreground uppercase tracking-wide">
                          Current
                        </div>
                        <div className="flex flex-wrap gap-2 text-xs">
                          <Tag className="h-3 w-3 text-muted-foreground mt-0.5" />
                          <span className="text-muted-foreground">
                            Desk:{" "}
                            <span className="text-foreground">
                              {row.currentDesk
                                ? DESK_LABELS[row.currentDesk as Desk] ?? row.currentDesk
                                : "—"}
                            </span>
                          </span>
                          <span className="text-muted-foreground">
                            Type:{" "}
                            <span className="text-foreground">
                              {row.currentContentType
                                ? CONTENT_TYPE_LABELS[row.currentContentType as ContentType] ??
                                  row.currentContentType
                                : "—"}
                            </span>
                          </span>
                        </div>
                      </div>

                      {/* Suggested / editable */}
                      <div className="space-y-2">
                        <div className="text-xs label-mono text-muted-foreground uppercase tracking-wide">
                          Suggested {row.wouldChange && <span className="text-yellow-400">(change)</span>}
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <select
                            value={displayDesk}
                            onChange={(e) =>
                              setOverride(row.id, "desk", e.target.value as Desk)
                            }
                            className="border border-border bg-background text-xs px-2 py-1"
                          >
                            {DESKS.map((d) => (
                              <option key={d} value={d}>
                                {DESK_LABELS[d]}
                              </option>
                            ))}
                          </select>
                          <select
                            value={displayCT}
                            onChange={(e) =>
                              setOverride(row.id, "contentType", e.target.value as ContentType)
                            }
                            className="border border-border bg-background text-xs px-2 py-1"
                          >
                            {CONTENT_TYPES.map((ct) => (
                              <option key={ct} value={ct}>
                                {CONTENT_TYPE_LABELS[ct]}
                              </option>
                            ))}
                          </select>
                        </div>
                        {(override?.tags ?? row.suggestedTags).length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {(override?.tags ?? row.suggestedTags).map((tag) => (
                              <span
                                key={tag}
                                className="border border-border px-1.5 py-0.5 text-xs label-mono"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>
                  Page {currentPage} of {totalPages} ({total} total)
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => runPreview(offset - PAGE_SIZE)}
                    disabled={offset === 0 || isWorking}
                    className="p-1.5 border border-border disabled:opacity-30 hover:border-foreground transition-colors"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => runPreview(offset + PAGE_SIZE)}
                    disabled={offset + PAGE_SIZE >= total || isWorking}
                    className="p-1.5 border border-border disabled:opacity-30 hover:border-foreground transition-colors"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {rows.length === 0 && !isPreviewing && (
          <div className="border border-border p-12 text-center text-muted-foreground">
            <Eye className="h-8 w-8 mx-auto mb-3 opacity-40" />
            <p className="label-mono text-sm">Run a preview to see posts</p>
          </div>
        )}

        {isPreviewing && (
          <div className="border border-border p-12 text-center text-muted-foreground">
            <RefreshCw className="h-6 w-6 mx-auto mb-2 animate-spin" />
            <p className="label-mono text-sm">Loading...</p>
          </div>
        )}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// StatCard
// ---------------------------------------------------------------------------

function StatCard({
  label,
  value,
  sub,
}: {
  label: string
  value: number
  sub?: string
}) {
  return (
    <div className="border border-border p-4">
      <div className="label-mono text-xs text-muted-foreground uppercase tracking-widest mb-1">
        {label}
      </div>
      <div className="text-2xl font-bold tabular-nums">{value.toLocaleString()}</div>
      {sub && <div className="text-xs text-muted-foreground mt-0.5">{sub}</div>}
    </div>
  )
}
