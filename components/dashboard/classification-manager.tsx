"use client"

import { useState, useTransition } from "react"
import { Check, Eye, Loader2, LockKeyhole } from "lucide-react"
import { applyReclassification, previewReclassification, setManualClassification, type ProposedChange } from "@/app/dashboard/classification/actions"
import { categories, type Category } from "@/lib/news-data"
import { StatusBadge } from "@/components/dashboard/ui"

const inputClass = "w-full border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary"

export function ClassificationManager({ initial }: { initial: ProposedChange[] }) {
  const [changes, setChanges] = useState(initial)
  const [selected, setSelected] = useState(() => new Set(initial.map((item) => item.id)))
  const [pending, startTransition] = useTransition()
  const [message, setMessage] = useState<string | null>(null)

  function preview(formData: FormData) {
    setMessage(null)
    startTransition(async () => {
      try {
        const next = await previewReclassification(Object.fromEntries(formData) as Record<string, string>)
        setChanges(next)
        setSelected(new Set(next.map((item) => item.id)))
        setMessage(`Previewed ${next.length} unlocked stories.`)
      } catch (error) { setMessage(error instanceof Error ? error.message : "Preview failed") }
    })
  }

  function apply() {
    const approved = changes.filter((item) => selected.has(item.id))
    if (!approved.length || !confirm(`Apply ${approved.length} proposed classifications?`)) return
    startTransition(async () => {
      try { await applyReclassification(approved); setMessage(`Applied ${approved.length} classifications.`) }
      catch (error) { setMessage(error instanceof Error ? error.message : "Apply failed") }
    })
  }

  function lockCategory(item: ProposedChange, category: Category) {
    startTransition(async () => {
      try {
        await setManualClassification(item.id, category)
        setChanges((current) => current.filter((change) => change.id !== item.id))
        setMessage(`Locked “${item.title}” to ${category}.`)
      } catch (error) { setMessage(error instanceof Error ? error.message : "Manual correction failed") }
    })
  }

  return (
    <div className="flex flex-col gap-6">
      <form action={preview} className="grid grid-cols-1 gap-3 border border-border bg-card p-4 md:grid-cols-3 lg:grid-cols-6">
        <input type="date" name="from" aria-label="From date" className={inputClass} />
        <input type="date" name="to" aria-label="To date" className={inputClass} />
        <input name="publisher" aria-label="Publisher" placeholder="Publisher" className={inputClass} />
        <select name="category" aria-label="Current category" className={inputClass}><option value="">All categories</option>{categories.map((category) => <option key={category}>{category}</option>)}</select>
        <select name="confidence" aria-label="Confidence" className={inputClass}><option value="">All confidence</option><option value="high">85–100</option><option value="medium">65–84</option><option value="low">Below 65</option></select>
        <select name="reviewStatus" aria-label="Review status" className={inputClass}><option value="">All review states</option><option value="auto_published">Auto-published</option><option value="review">Flagged</option><option value="moderation">Moderation</option><option value="reviewed">Reviewed</option></select>
        <div className="flex gap-3 md:col-span-3 lg:col-span-6">
          <button type="submit" disabled={pending} className="label-mono inline-flex items-center gap-2 bg-primary px-4 py-2 font-semibold text-primary-foreground disabled:opacity-50">{pending ? <Loader2 className="animate-spin" /> : <Eye />} Preview changes</button>
          <button type="button" onClick={apply} disabled={pending || selected.size === 0} className="label-mono inline-flex items-center gap-2 border border-primary px-4 py-2 text-primary disabled:opacity-50"><Check /> Apply selected ({selected.size})</button>
        </div>
      </form>

      {message ? <p role="status" className="label-mono border border-border bg-muted/30 px-4 py-3 text-sm text-foreground">{message}</p> : null}

      <div className="overflow-x-auto border border-border">
        <table className="w-full min-w-[980px] text-sm">
          <thead><tr className="border-b border-border bg-muted/30 text-left"><th className="px-4 py-3"><span className="sr-only">Select</span></th><th className="px-4 py-3">Story</th><th className="px-4 py-3">Current</th><th className="px-4 py-3">Proposed</th><th className="px-4 py-3">Confidence</th><th className="px-4 py-3">Review</th><th className="px-4 py-3">Manual lock</th></tr></thead>
          <tbody>{changes.map((item) => <tr key={item.id} className="border-b border-border align-top">
            <td className="px-4 py-3"><input type="checkbox" checked={selected.has(item.id)} aria-label={`Select ${item.title}`} onChange={(event) => setSelected((current) => { const next = new Set(current); event.target.checked ? next.add(item.id) : next.delete(item.id); return next })} /></td>
            <td className="max-w-md px-4 py-3"><p className="font-semibold text-foreground">{item.title}</p><p className="mt-1 text-xs text-muted-foreground">{item.publisher ?? "Unknown publisher"} · {item.method === "ai" ? "AI fallback" : "Rules"} · {item.rationale}</p></td>
            <td className="px-4 py-3"><StatusBadge status={item.currentCategory} /></td>
            <td className="px-4 py-3"><StatusBadge status={item.proposedCategory} />{item.secondaryTags.length ? <p className="mt-1 text-xs text-muted-foreground">+ {item.secondaryTags.join(", ")}</p> : null}</td>
            <td className="px-4 py-3 font-mono">{item.confidence}</td><td className="px-4 py-3"><StatusBadge status={item.reviewStatus} /></td>
            <td className="px-4 py-3"><label className="sr-only" htmlFor={`category-${item.id}`}>Manually classify {item.title}</label><select id={`category-${item.id}`} defaultValue="" disabled={pending} onChange={(event) => { if (event.target.value) lockCategory(item, event.target.value as Category) }} className={inputClass}><option value="">Choose category</option>{categories.map((category) => <option key={category}>{category}</option>)}</select><span className="mt-1 flex items-center gap-1 text-xs text-muted-foreground"><LockKeyhole /> Persists on refresh</span></td>
          </tr>)}</tbody>
        </table>
      </div>
    </div>
  )
}
