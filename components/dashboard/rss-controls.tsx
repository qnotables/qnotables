"use client"

import { useState, useTransition } from "react"
import { Check, Loader2, Pause, Play, Save } from "lucide-react"
import { reviewRssItem, saveRssPolicy, toggleRssSource } from "@/app/dashboard/actions"

export interface RssSourceControlRow {
  source_key: string
  name: string
  feed_url: string
  enabled: boolean
  last_fetched_at: string | null
  last_success_at: string | null
  last_error: string | null
  item_count: number
}

export interface RssReviewRow {
  id: string
  title: string
  source_name: string | null
  primary_category: string
  review_status: "moderation" | "approved" | "rejected"
  manual_lock: boolean
  published_at: string | null
}

interface RssPolicyValues {
  excludedCategories: string[]
  excludedTerms: string[]
  retentionDays: number
}

function formatDate(value: string | null) {
  if (!value) return "Never"
  return new Date(value).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" })
}

function SourceRow({ source }: { source: RssSourceControlRow }) {
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function submit() {
    setError(null)
    startTransition(async () => {
      const result = await toggleRssSource(source.source_key, !source.enabled)
      if (result.success) window.location.reload()
      else setError(result.error ?? "Unable to update source")
    })
  }

  return (
    <div className="flex flex-col gap-3 border-b border-border px-4 py-4 last:border-b-0 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <span className={`h-2 w-2 rounded-full ${source.enabled ? "bg-primary" : "bg-muted-foreground/40"}`} aria-hidden="true" />
          <h3 className="font-semibold text-foreground">{source.name}</h3>
        </div>
        <p className="mt-1 truncate text-xs text-muted-foreground">{source.feed_url}</p>
        <p className="label-mono mt-2 text-[10px] text-muted-foreground">
          {source.item_count} items · last success {formatDate(source.last_success_at)}
        </p>
        {source.last_error ? <p className="mt-1 text-xs text-destructive">{source.last_error}</p> : null}
        {error ? <p className="mt-1 text-xs text-destructive">{error}</p> : null}
      </div>
      <button
        type="button"
        onClick={submit}
        disabled={pending}
        className="label-mono inline-flex shrink-0 items-center justify-center gap-2 border border-border px-3 py-2 text-xs font-semibold text-foreground transition-colors hover:border-primary hover:text-primary disabled:opacity-50"
      >
        {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : source.enabled ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
        {source.enabled ? "Disable" : "Enable"}
      </button>
    </div>
  )
}

function ReviewRow({ item }: { item: RssReviewRow }) {
  const [pending, startTransition] = useTransition()
  const [status, setStatus] = useState(item.review_status)
  const [error, setError] = useState<string | null>(null)

  function update(nextStatus: "approved" | "rejected" | "moderation") {
    setError(null)
    startTransition(async () => {
      const result = await reviewRssItem(item.id, nextStatus)
      if (result.success) setStatus(nextStatus)
      else setError(result.error ?? "Unable to update review")
    })
  }

  return (
    <div className="flex flex-col gap-3 border-b border-border px-4 py-4 last:border-b-0 lg:flex-row lg:items-center lg:justify-between">
      <div className="min-w-0">
        <p className="font-semibold text-foreground">{item.title}</p>
        <p className="label-mono mt-1 text-[10px] text-muted-foreground">
          {item.source_name ?? "Unknown source"} · {item.primary_category} · {status}
          {item.manual_lock ? " · locked" : ""}
        </p>
        {error ? <p className="mt-1 text-xs text-destructive">{error}</p> : null}
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <button
          type="button"
          onClick={() => update("approved")}
          disabled={pending || status === "approved"}
          className="label-mono inline-flex items-center gap-1 border border-primary/50 px-2.5 py-1.5 text-[10px] font-semibold text-primary hover:bg-primary/10 disabled:opacity-40"
        >
          {pending && status !== "approved" ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
          Approve
        </button>
        <button
          type="button"
          onClick={() => update("rejected")}
          disabled={pending || status === "rejected"}
          className="label-mono border border-destructive/40 px-2.5 py-1.5 text-[10px] font-semibold text-destructive hover:bg-destructive/10 disabled:opacity-40"
        >
          Reject
        </button>
        <button
          type="button"
          onClick={() => update("moderation")}
          disabled={pending || status === "moderation"}
          className="label-mono border border-border px-2.5 py-1.5 text-[10px] font-semibold text-muted-foreground hover:text-foreground disabled:opacity-40"
        >
          Hold
        </button>
      </div>
    </div>
  )
}

export function RssControls({ sources, policy, reviewItems }: { sources: RssSourceControlRow[]; policy: RssPolicyValues; reviewItems: RssReviewRow[] }) {
  const [pending, startTransition] = useTransition()
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function submitPolicy(formData: FormData) {
    setError(null)
    setSaved(false)
    startTransition(async () => {
      const result = await saveRssPolicy(formData)
      if (result.success) {
        setSaved(true)
        setTimeout(() => setSaved(false), 2500)
      } else setError(result.error ?? "Unable to save policy")
    })
  }

  return (
    <div className="flex flex-col gap-6">
      <section className="border border-border bg-card">
        <div className="border-b border-border px-4 py-4">
          <p className="label-mono text-xs font-semibold uppercase tracking-[0.18em] text-primary">Source registry</p>
          <h2 className="stencil mt-1 text-xl text-foreground">Wire sources</h2>
          <p className="mt-1 text-sm text-muted-foreground">Enable or pause feeds without editing deployment code.</p>
        </div>
        {sources.length ? sources.map((source) => <SourceRow key={source.source_key} source={source} />) : <p className="p-4 text-sm text-muted-foreground">No database sources are configured.</p>}
      </section>

      <section className="border border-border bg-card p-4 sm:p-6">
        <div className="mb-5">
          <p className="label-mono text-xs font-semibold uppercase tracking-[0.18em] text-primary">Editorial policy</p>
          <h2 className="stencil mt-1 text-xl text-foreground">Freshness and exclusions</h2>
          <p className="mt-1 text-sm text-muted-foreground">These rules apply to the live homepage wire and are saved centrally.</p>
        </div>
        <form action={submitPolicy} className="flex flex-col gap-4">
          <label className="flex flex-col gap-1">
            <span className="label-mono text-xs text-muted-foreground">Retention window (days)</span>
            <input name="retention_days" type="number" min={1} max={90} defaultValue={policy.retentionDays} className="w-full border border-border bg-background px-3 py-2 text-foreground outline-none focus:border-primary sm:max-w-xs" />
          </label>
          <label className="flex flex-col gap-1">
            <span className="label-mono text-xs text-muted-foreground">Excluded categories</span>
            <textarea name="excluded_categories" rows={2} defaultValue={policy.excludedCategories.join(", ")} placeholder="sports, celebrity" className="border border-border bg-background px-3 py-2 text-foreground outline-none focus:border-primary" />
          </label>
          <label className="flex flex-col gap-1">
            <span className="label-mono text-xs text-muted-foreground">Excluded terms</span>
            <textarea name="excluded_terms" rows={3} defaultValue={policy.excludedTerms.join(", ")} placeholder="term one, term two" className="border border-border bg-background px-3 py-2 text-foreground outline-none focus:border-primary" />
          </label>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          <div>
            <button type="submit" disabled={pending} className="label-mono inline-flex items-center gap-2 bg-primary px-4 py-2 font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50">
              {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : saved ? <Check className="h-4 w-4" /> : <Save className="h-4 w-4" />}
              {pending ? "Saving…" : saved ? "Saved" : "Save policy"}
            </button>
          </div>
        </form>
      </section>

      <section className="border border-border bg-card">
        <div className="border-b border-border px-4 py-4">
          <p className="label-mono text-xs font-semibold uppercase tracking-[0.18em] text-primary">Manual review</p>
          <h2 className="stencil mt-1 text-xl text-foreground">Recent imported items</h2>
          <p className="mt-1 text-sm text-muted-foreground">Lock a classification decision so future automated passes do not overwrite it.</p>
        </div>
        {reviewItems.length ? reviewItems.map((item) => <ReviewRow key={item.id} item={item} />) : <p className="p-4 text-sm text-muted-foreground">No imported items are waiting for review.</p>}
      </section>
    </div>
  )
}
