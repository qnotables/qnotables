"use client"

import { useState, useCallback, useRef } from "react"
import {
  Upload, Link2, FileJson, Rss, AlertTriangle, CheckCircle2,
  Loader2, Eye, ArrowRight, ArrowLeft, RefreshCw, X,
  Image as ImageIcon, ExternalLink, Info,
} from "lucide-react"
import {
  fetchWixRssFeed,
  previewWixRss,
  previewWixJson,
  getExistingSlugs,
  runWixImport,
  type WixImportOptions,
  type WixImportResult,
} from "@/app/actions/wix-import"
import type { WixPreviewRow, WixImportWarning } from "@/lib/wix-parser"

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const POST_TYPES = [
  "Field Note",
  "News Brief",
  "Opinion",
  "Explainer",
  "Show Notes",
  "Document Drop",
  "Public Record",
  "Source Archive",
  "Video Archive",
  "External Link",
]

const CATEGORIES = [
  "Archive",
  "General",
  "Politics",
  "Culture",
  "Technology",
  "Economy",
  "Health",
  "Science",
  "Media",
  "World",
]

const WARNING_LABELS: Record<WixImportWarning, string> = {
  missing_title: "Missing title",
  missing_date: "Missing date",
  duplicate_slug: "Duplicate slug",
  missing_body: "Missing body",
  missing_image: "No image found",
  invalid_source_url: "Invalid URL",
  unsafe_html_removed: "Unsafe HTML removed",
}

type ImportSource = "rss_url" | "json_paste" | "json_upload"
type Step = "configure" | "preview" | "done"

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function Badge({
  children,
  variant = "default",
}: {
  children: React.ReactNode
  variant?: "default" | "warn" | "error" | "ok"
}) {
  const cls = {
    default: "bg-muted text-muted-foreground",
    warn: "bg-yellow-500/15 text-yellow-600 dark:text-yellow-400",
    error: "bg-destructive/15 text-destructive",
    ok: "bg-green-500/15 text-green-600 dark:text-green-400",
  }[variant]
  return (
    <span className={`inline-block rounded px-1.5 py-0.5 text-[10px] font-mono font-semibold leading-tight ${cls}`}>
      {children}
    </span>
  )
}

function Label({ children, htmlFor }: { children: React.ReactNode; htmlFor?: string }) {
  return (
    <label
      htmlFor={htmlFor}
      className="label-mono block text-xs font-semibold uppercase tracking-wider text-muted-foreground"
    >
      {children}
    </label>
  )
}

function FieldRow({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-col gap-1.5">{children}</div>
}

function Select({
  id, value, onChange, options,
}: {
  id?: string
  value: string
  onChange: (v: string) => void
  options: string[]
}) {
  return (
    <select
      id={id}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="h-9 w-full rounded border border-border bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
    >
      {options.map((o) => (
        <option key={o} value={o}>
          {o}
        </option>
      ))}
    </select>
  )
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function WixImportForm() {
  // --- step ---
  const [step, setStep] = useState<Step>("configure")

  // --- source selection ---
  const [source, setSource] = useState<ImportSource>("rss_url")
  const [rssUrl, setRssUrl] = useState("")
  const [jsonText, setJsonText] = useState("")
  const fileRef = useRef<HTMLInputElement>(null)

  // --- options ---
  const [opts, setOpts] = useState<WixImportOptions>({
    defaultCategory: "Archive",
    defaultPostType: "Field Note",
    defaultStatus: "draft",
    includeInRss: true,
  })

  // --- state ---
  const [loading, setLoading] = useState(false)
  const [loadingMsg, setLoadingMsg] = useState("")
  const [error, setError] = useState<string | null>(null)

  // --- preview ---
  const [rows, setRows] = useState<WixPreviewRow[]>([])
  const [selected, setSelected] = useState<Set<number>>(new Set())

  // --- result ---
  const [result, setResult] = useState<WixImportResult | null>(null)

  // ---------------------------------------------------------------------------
  // File upload handler
  // ---------------------------------------------------------------------------
  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      const text = ev.target?.result as string
      setJsonText(text ?? "")
    }
    reader.readAsText(file)
  }, [])

  // ---------------------------------------------------------------------------
  // Step 1 → Preview
  // ---------------------------------------------------------------------------
  const handlePreview = useCallback(async () => {
    setError(null)
    setLoading(true)

    try {
      setLoadingMsg("Fetching existing slugs…")
      const existingSlugs = await getExistingSlugs()

      let previewRows: WixPreviewRow[] = []

      if (source === "rss_url") {
        if (!rssUrl.trim()) { setError("Please enter an RSS feed URL."); setLoading(false); return }
        setLoadingMsg("Fetching RSS feed…")
        const fetchResult = await fetchWixRssFeed(rssUrl.trim())
        if (!fetchResult.ok || !fetchResult.xml) {
          setError(fetchResult.error ?? "Failed to fetch feed.")
          setLoading(false)
          return
        }
        setLoadingMsg("Parsing RSS items…")
        const { rows: parsed, error: parseError } = await previewWixRss(
          fetchResult.xml,
          opts,
          existingSlugs,
        )
        if (parseError) { setError(parseError); setLoading(false); return }
        previewRows = parsed
      } else {
        const text = jsonText.trim()
        if (!text) { setError("Please paste or upload JSON."); setLoading(false); return }
        setLoadingMsg("Parsing JSON…")
        const { rows: parsed, error: parseError } = await previewWixJson(text, opts, existingSlugs)
        if (parseError) { setError(parseError); setLoading(false); return }
        previewRows = parsed
      }

      if (previewRows.length === 0) {
        setError("No posts found in the provided content.")
        setLoading(false)
        return
      }

      setRows(previewRows)
      setSelected(new Set(previewRows.map((r) => r.index)))
      setStep("preview")
    } catch (e) {
      setError(e instanceof Error ? e.message : "An unexpected error occurred.")
    } finally {
      setLoading(false)
      setLoadingMsg("")
    }
  }, [source, rssUrl, jsonText, opts])

  // ---------------------------------------------------------------------------
  // Step 2 → Import
  // ---------------------------------------------------------------------------
  const handleImport = useCallback(async () => {
    const toImport = rows.filter((r) => selected.has(r.index))
    if (toImport.length === 0) { setError("No posts selected."); return }

    setError(null)
    setLoading(true)
    setLoadingMsg(`Importing ${toImport.length} post${toImport.length === 1 ? "" : "s"}…`)

    try {
      const res = await runWixImport(toImport, opts)
      setResult(res)
      setStep("done")
    } catch (e) {
      setError(e instanceof Error ? e.message : "Import failed.")
    } finally {
      setLoading(false)
      setLoadingMsg("")
    }
  }, [rows, selected, opts])

  // ---------------------------------------------------------------------------
  // Toggle row selection
  // ---------------------------------------------------------------------------
  const toggleRow = (index: number) => {
    setSelected((prev) => {
      const next = new Set(prev)
      next.has(index) ? next.delete(index) : next.add(index)
      return next
    })
  }

  const toggleAll = () => {
    if (selected.size === rows.length) {
      setSelected(new Set())
    } else {
      setSelected(new Set(rows.map((r) => r.index)))
    }
  }

  // ---------------------------------------------------------------------------
  // Reset
  // ---------------------------------------------------------------------------
  const reset = () => {
    setStep("configure")
    setRows([])
    setSelected(new Set())
    setResult(null)
    setError(null)
    setJsonText("")
    setRssUrl("")
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div className="flex flex-col gap-6">
      {/* Step indicator */}
      <div className="flex items-center gap-2 label-mono text-xs text-muted-foreground">
        {(["configure", "preview", "done"] as Step[]).map((s, i) => (
          <span key={s} className="flex items-center gap-2">
            {i > 0 && <span className="text-muted-foreground/40">/</span>}
            <span className={step === s ? "text-primary font-semibold" : ""}>{s.toUpperCase()}</span>
          </span>
        ))}
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* STEP 1: Configure                                                   */}
      {/* ------------------------------------------------------------------ */}
      {step === "configure" && (
        <div className="flex flex-col gap-6">
          {/* Source tabs */}
          <div className="flex flex-col gap-3">
            <Label>Import Source</Label>
            <div className="grid grid-cols-3 gap-2">
              {(
                [
                  { id: "rss_url", icon: Rss, label: "RSS Feed URL" },
                  { id: "json_paste", icon: FileJson, label: "Paste JSON" },
                  { id: "json_upload", icon: Upload, label: "Upload JSON" },
                ] as { id: ImportSource; icon: any; label: string }[]
              ).map(({ id, icon: Icon, label }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setSource(id)}
                  className={`flex flex-col items-center gap-2 rounded border p-4 text-sm transition-colors ${
                    source === id
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border bg-card text-muted-foreground hover:border-primary/50"
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span className="label-mono text-[11px] text-center">{label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Source input */}
          <div className="flex flex-col gap-3 rounded border border-border bg-card p-4">
            {source === "rss_url" && (
              <FieldRow>
                <Label htmlFor="rss-url">Wix RSS Feed URL</Label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Link2 className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <input
                      id="rss-url"
                      type="url"
                      value={rssUrl}
                      onChange={(e) => setRssUrl(e.target.value)}
                      placeholder="https://example.com/blog-feed.xml"
                      className="h-9 w-full rounded border border-border bg-background pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  Enter the URL of the Wix blog RSS feed (usually{" "}
                  <code className="bg-muted px-1 rounded text-[11px]">yoursite.com/blog-feed.xml</code>).
                </p>
              </FieldRow>
            )}

            {source === "json_paste" && (
              <FieldRow>
                <Label htmlFor="json-paste">Paste Wix API JSON</Label>
                <textarea
                  id="json-paste"
                  value={jsonText}
                  onChange={(e) => setJsonText(e.target.value)}
                  rows={10}
                  placeholder={'[\n  {\n    "title": "My Post",\n    "firstPublishedDate": "2022-01-01",\n    ...\n  }\n]'}
                  className="w-full rounded border border-border bg-background p-3 font-mono text-xs text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary"
                />
                <p className="text-xs text-muted-foreground">
                  Paste the JSON exported from the Wix Blog API. Accepts array at root, or{" "}
                  <code className="bg-muted px-1 rounded text-[11px]">{"{ posts: [...] }"}</code>.
                </p>
              </FieldRow>
            )}

            {source === "json_upload" && (
              <FieldRow>
                <Label>Upload JSON File</Label>
                <div
                  className="flex cursor-pointer flex-col items-center gap-3 rounded border border-dashed border-border bg-background p-8 text-center transition-colors hover:border-primary/50"
                  onClick={() => fileRef.current?.click()}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault()
                    const file = e.dataTransfer.files[0]
                    if (file) {
                      const reader = new FileReader()
                      reader.onload = (ev) => setJsonText((ev.target?.result as string) ?? "")
                      reader.readAsText(file)
                    }
                  }}
                >
                  <Upload className="h-8 w-8 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Drop your JSON file here</p>
                    <p className="text-xs text-muted-foreground">or click to browse</p>
                  </div>
                  {jsonText && (
                    <p className="text-xs text-green-600">
                      File loaded — {jsonText.length.toLocaleString()} characters
                    </p>
                  )}
                </div>
                <input
                  ref={fileRef}
                  type="file"
                  accept=".json,application/json"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </FieldRow>
            )}
          </div>

          {/* Import options */}
          <div className="rounded border border-border bg-card p-4">
            <p className="label-mono mb-4 text-xs font-semibold text-muted-foreground">IMPORT DEFAULTS</p>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FieldRow>
                <Label htmlFor="default-category">Default Category</Label>
                <Select
                  id="default-category"
                  value={opts.defaultCategory}
                  onChange={(v) => setOpts((o) => ({ ...o, defaultCategory: v }))}
                  options={CATEGORIES}
                />
              </FieldRow>
              <FieldRow>
                <Label htmlFor="default-post-type">Default Post Type</Label>
                <Select
                  id="default-post-type"
                  value={opts.defaultPostType}
                  onChange={(v) => setOpts((o) => ({ ...o, defaultPostType: v }))}
                  options={POST_TYPES}
                />
              </FieldRow>
              <FieldRow>
                <Label htmlFor="default-status">Default Status</Label>
                <Select
                  id="default-status"
                  value={opts.defaultStatus}
                  onChange={(v) =>
                    setOpts((o) => ({ ...o, defaultStatus: v as "draft" | "published" }))
                  }
                  options={["draft", "published"]}
                />
              </FieldRow>
              <FieldRow>
                <Label htmlFor="include-rss">Include in RSS</Label>
                <Select
                  id="include-rss"
                  value={opts.includeInRss ? "yes" : "no"}
                  onChange={(v) => setOpts((o) => ({ ...o, includeInRss: v === "yes" }))}
                  options={["yes", "no"]}
                />
                <p className="text-xs text-muted-foreground">Only applies to published posts.</p>
              </FieldRow>
            </div>
          </div>

          {error && (
            <div className="flex items-start gap-3 rounded border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              {error}
            </div>
          )}

          <div className="flex justify-end">
            <button
              type="button"
              onClick={handlePreview}
              disabled={loading}
              className="flex items-center gap-2 rounded bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {loadingMsg || "Loading…"}
                </>
              ) : (
                <>
                  <Eye className="h-4 w-4" />
                  Preview Posts
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* STEP 2: Preview                                                     */}
      {/* ------------------------------------------------------------------ */}
      {step === "preview" && (
        <div className="flex flex-col gap-4">
          {/* Summary bar */}
          <div className="flex flex-wrap items-center gap-3 rounded border border-border bg-card p-3">
            <span className="label-mono text-xs text-muted-foreground">
              {rows.length} POSTS FOUND
            </span>
            <span className="label-mono text-xs text-primary">
              {selected.size} SELECTED
            </span>
            <span className="label-mono text-xs text-yellow-600">
              {rows.filter((r) => r.warnings.length > 0).length} WITH WARNINGS
            </span>
            <span className="ml-auto label-mono text-xs text-muted-foreground">
              CATEGORY: {opts.defaultCategory} / STATUS: {opts.defaultStatus.toUpperCase()}
            </span>
          </div>

          {/* Preview table */}
          <div className="overflow-x-auto rounded border border-border">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="w-8 px-3 py-2 text-left">
                    <input
                      type="checkbox"
                      checked={selected.size === rows.length}
                      onChange={toggleAll}
                      className="accent-primary"
                    />
                  </th>
                  <th className="px-3 py-2 text-left font-mono font-semibold uppercase tracking-wide text-muted-foreground">
                    Title
                  </th>
                  <th className="px-3 py-2 text-left font-mono font-semibold uppercase tracking-wide text-muted-foreground">
                    Date
                  </th>
                  <th className="px-3 py-2 text-left font-mono font-semibold uppercase tracking-wide text-muted-foreground">
                    Category
                  </th>
                  <th className="px-3 py-2 text-left font-mono font-semibold uppercase tracking-wide text-muted-foreground">
                    Slug
                  </th>
                  <th className="px-3 py-2 text-left font-mono font-semibold uppercase tracking-wide text-muted-foreground">
                    Img
                  </th>
                  <th className="px-3 py-2 text-left font-mono font-semibold uppercase tracking-wide text-muted-foreground">
                    Warnings
                  </th>
                  <th className="px-3 py-2 text-left font-mono font-semibold uppercase tracking-wide text-muted-foreground">
                    Source
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {rows.map((row) => {
                  const isSelected = selected.has(row.index)
                  const hasWarnings = row.warnings.length > 0
                  const hasErrors = row.warnings.some(
                    (w) => w === "missing_title" || w === "missing_body",
                  )
                  return (
                    <tr
                      key={row.index}
                      className={`transition-colors ${
                        !isSelected
                          ? "opacity-40"
                          : hasErrors
                          ? "bg-destructive/5"
                          : hasWarnings
                          ? "bg-yellow-500/5"
                          : ""
                      }`}
                    >
                      <td className="px-3 py-2">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleRow(row.index)}
                          className="accent-primary"
                        />
                      </td>
                      <td className="max-w-[200px] px-3 py-2">
                        <span className="line-clamp-2 font-medium text-foreground">
                          {row.title}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-3 py-2 font-mono text-muted-foreground">
                        {row.publishedAt
                          ? new Date(row.publishedAt).toLocaleDateString("en-US", {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            })
                          : <Badge variant="warn">NO DATE</Badge>}
                      </td>
                      <td className="px-3 py-2 text-muted-foreground">{row.category}</td>
                      <td className="max-w-[140px] px-3 py-2 font-mono text-muted-foreground">
                        <span className="truncate block">{row.slug}</span>
                      </td>
                      <td className="px-3 py-2 text-center">
                        {row.imageFound ? (
                          <ImageIcon className="mx-auto h-3.5 w-3.5 text-green-600" />
                        ) : (
                          <X className="mx-auto h-3.5 w-3.5 text-muted-foreground/40" />
                        )}
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex flex-wrap gap-1">
                          {row.warnings.length === 0 ? (
                            <Badge variant="ok">OK</Badge>
                          ) : (
                            row.warnings.map((w) => (
                              <Badge
                                key={w}
                                variant={
                                  w === "missing_title" || w === "missing_body" ? "error" : "warn"
                                }
                              >
                                {WARNING_LABELS[w]}
                              </Badge>
                            ))
                          )}
                        </div>
                      </td>
                      <td className="px-3 py-2">
                        {row.sourceUrl ? (
                          <a
                            href={row.sourceUrl}
                            target="_blank"
                            rel="noopener noreferrer nofollow"
                            className="flex items-center gap-1 text-primary hover:underline"
                          >
                            <ExternalLink className="h-3 w-3" />
                            <span className="truncate max-w-[100px] block">link</span>
                          </a>
                        ) : (
                          <span className="text-muted-foreground/40">—</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Info note */}
          <div className="flex items-start gap-2 rounded border border-border bg-card/50 p-3 text-xs text-muted-foreground">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            <span>
              Original Wix publish dates will be preserved as{" "}
              <code className="bg-muted rounded px-1">published_at</code>. Posts with missing dates
              will be saved as drafts. Imported posts will appear in{" "}
              <code className="bg-muted rounded px-1">/archives</code> and, if post type is Field
              Note or News Brief,{" "}
              <code className="bg-muted rounded px-1">/blog</code>.
            </span>
          </div>

          {error && (
            <div className="flex items-start gap-3 rounded border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              {error}
            </div>
          )}

          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => { setStep("configure"); setError(null) }}
              className="flex items-center gap-2 rounded border border-border px-4 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </button>
            <button
              type="button"
              onClick={handleImport}
              disabled={loading || selected.size === 0}
              className="flex items-center gap-2 rounded bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {loadingMsg || "Importing…"}
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  Import {selected.size} Post{selected.size !== 1 ? "s" : ""}
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* STEP 3: Done                                                        */}
      {/* ------------------------------------------------------------------ */}
      {step === "done" && result && (
        <div className="flex flex-col gap-6">
          {/* Result summary */}
          <div className="rounded border border-border bg-card p-6">
            <div className="mb-4 flex items-center gap-3">
              <CheckCircle2 className="h-6 w-6 text-green-600" />
              <h2 className="stencil text-xl text-foreground">Import Complete</h2>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="rounded border border-green-500/30 bg-green-500/10 p-4 text-center">
                <p className="text-3xl font-bold text-green-600">{result.success}</p>
                <p className="label-mono mt-1 text-xs text-muted-foreground">IMPORTED</p>
              </div>
              <div className="rounded border border-destructive/30 bg-destructive/10 p-4 text-center">
                <p className="text-3xl font-bold text-destructive">{result.failed}</p>
                <p className="label-mono mt-1 text-xs text-muted-foreground">FAILED</p>
              </div>
              <div className="rounded border border-border bg-muted/30 p-4 text-center">
                <p className="text-3xl font-bold text-foreground">
                  {result.success + result.failed}
                </p>
                <p className="label-mono mt-1 text-xs text-muted-foreground">TOTAL</p>
              </div>
            </div>
          </div>

          {/* Errors detail */}
          {result.errors.length > 0 && (
            <div className="rounded border border-destructive/30 bg-card p-4">
              <p className="label-mono mb-3 text-xs font-semibold text-destructive">
                FAILED POSTS ({result.errors.length})
              </p>
              <ul className="flex flex-col gap-2">
                {result.errors.map((e, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs">
                    <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-destructive" />
                    <span>
                      <span className="font-medium">{e.title ?? `Post #${e.index}`}</span>
                      {" — "}
                      <span className="text-muted-foreground">{e.error}</span>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Next steps */}
          <div className="rounded border border-border bg-card p-4">
            <p className="label-mono mb-3 text-xs font-semibold text-muted-foreground">
              NEXT STEPS
            </p>
            <div className="flex flex-wrap gap-3">
              <a
                href="/archives"
                className="flex items-center gap-2 rounded border border-border px-3 py-2 text-sm text-foreground transition-colors hover:bg-muted"
              >
                View in Archives
                <ArrowRight className="h-3.5 w-3.5" />
              </a>
              <a
                href="/dashboard/blog"
                className="flex items-center gap-2 rounded border border-border px-3 py-2 text-sm text-foreground transition-colors hover:bg-muted"
              >
                Manage Posts
                <ArrowRight className="h-3.5 w-3.5" />
              </a>
              <button
                type="button"
                onClick={reset}
                className="flex items-center gap-2 rounded border border-border px-3 py-2 text-sm text-foreground transition-colors hover:bg-muted"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Import More
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
