"use client"

import { useState, useTransition } from "react"
import { Check, Database, Loader2, Pencil, Plus, RefreshCw, Trash2, X } from "lucide-react"
import { deleteSearchAliasGroup, rebuildSearchIndex, saveSearchAliasGroup, type SearchAliasGroupInput } from "@/app/dashboard/actions"

export interface SearchAliasGroupView {
  id: string
  label: string
  slug: string
  enabled: boolean
  terms: string[]
}

const emptyDraft: SearchAliasGroupInput = { label: "", slug: "", terms: [], enabled: true }

export function SearchAliasManager({ groups }: { groups: SearchAliasGroupView[] }) {
  const [draft, setDraft] = useState<SearchAliasGroupInput | null>(null)
  const [pending, startTransition] = useTransition()
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  function beginCreate() {
    setMessage(null)
    setError(null)
    setDraft(emptyDraft)
  }

  function beginEdit(group: SearchAliasGroupView) {
    setMessage(null)
    setError(null)
    setDraft({ id: group.id, label: group.label, slug: group.slug, terms: group.terms, enabled: group.enabled })
  }

  function submit() {
    if (!draft) return
    setMessage(null)
    setError(null)
    startTransition(async () => {
      const result = await saveSearchAliasGroup(draft)
      if (result.success) {
        setDraft(null)
        setMessage("Alias group saved. Rebuild the index if you changed source content.")
      } else {
        setError(result.error ?? "Unable to save the alias group.")
      }
    })
  }

  function remove(group: SearchAliasGroupView) {
    if (!window.confirm(`Delete the “${group.label}” alias group?`)) return
    setMessage(null)
    setError(null)
    startTransition(async () => {
      const result = await deleteSearchAliasGroup(group.id)
      if (result.success) setMessage("Alias group deleted.")
      else setError(result.error ?? "Unable to delete the alias group.")
    })
  }

  function rebuild() {
    setMessage(null)
    setError(null)
    startTransition(async () => {
      const result = await rebuildSearchIndex()
      if (result.success) setMessage("Search index rebuilt from published records.")
      else setError(result.error ?? "Unable to rebuild the search index.")
    })
  }

  return (
    <section className="flex flex-col gap-4 border-t border-border pt-8">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="stencil text-lg text-foreground">Search Aliases</h2>
          <p className="label-mono mt-1 max-w-2xl text-sm text-muted-foreground">Keep reviewed spellings and abbreviations together so punctuation variants resolve to the same public record.</p>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={rebuild} disabled={pending} className="label-mono inline-flex items-center gap-2 border border-border px-3 py-2 text-sm text-muted-foreground hover:border-primary hover:text-foreground disabled:opacity-50">
            {pending ? <Loader2 className="size-4 animate-spin" /> : <RefreshCw className="size-4" />} Rebuild index
          </button>
          <button type="button" onClick={beginCreate} disabled={pending} className="label-mono inline-flex items-center gap-2 bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50">
            <Plus className="size-4" /> Add group
          </button>
        </div>
      </div>

      {message && <p className="label-mono inline-flex items-center gap-2 text-sm text-primary"><Check className="size-4" />{message}</p>}
      {error && <p className="label-mono text-sm text-destructive">{error}</p>}

      {draft && (
        <div className="flex flex-col gap-4 border border-primary/50 bg-card p-4">
          <div className="grid gap-4 md:grid-cols-2">
            <label className="flex flex-col gap-1"><span className="label-mono text-muted-foreground">Label</span><input value={draft.label} onChange={(event) => setDraft({ ...draft, label: event.target.value })} placeholder="September 11" className="w-full border border-border bg-background px-3 py-2 text-foreground outline-none focus:border-primary" /></label>
            <label className="flex flex-col gap-1"><span className="label-mono text-muted-foreground">Slug</span><input value={draft.slug} onChange={(event) => setDraft({ ...draft, slug: event.target.value })} placeholder="september-11" className="w-full border border-border bg-background px-3 py-2 text-foreground outline-none focus:border-primary" /></label>
          </div>
          <label className="flex flex-col gap-1"><span className="label-mono text-muted-foreground">Terms</span><textarea value={draft.terms.join("\n")} onChange={(event) => setDraft({ ...draft, terms: event.target.value.split(/\n|,/).map((term) => term.trim()).filter(Boolean) })} rows={4} placeholder={'9/11\nSeptember 11\n911'} className="w-full resize-y border border-border bg-background px-3 py-2 text-foreground outline-none focus:border-primary" /><span className="label-mono text-xs text-muted-foreground">One term per line. Duplicate normalized terms are removed.</span></label>
          <label className="inline-flex items-center gap-2 text-sm text-foreground"><input type="checkbox" checked={draft.enabled} onChange={(event) => setDraft({ ...draft, enabled: event.target.checked })} className="size-4 accent-primary" /> Enabled for public search</label>
          <div className="flex items-center gap-2"><button type="button" onClick={submit} disabled={pending} className="label-mono inline-flex items-center gap-2 bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50">{pending ? <Loader2 className="size-4 animate-spin" /> : <Database className="size-4" />} Save alias group</button><button type="button" onClick={() => setDraft(null)} disabled={pending} className="label-mono inline-flex items-center gap-2 border border-border px-4 py-2 text-sm text-muted-foreground hover:text-foreground disabled:opacity-50"><X className="size-4" /> Cancel</button></div>
        </div>
      )}

      <div className="flex flex-col gap-2">
        {groups.length === 0 && <p className="label-mono border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">No reviewed alias groups yet.</p>}
        {groups.map((group) => (
          <div key={group.id} className="flex flex-wrap items-center justify-between gap-3 border border-border bg-card p-4">
            <div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><span className="font-semibold text-foreground">{group.label}</span><span className="label-mono border border-border px-2 py-0.5 text-[10px] text-muted-foreground">{group.enabled ? "ENABLED" : "DISABLED"}</span></div><p className="label-mono mt-1 break-words text-xs text-muted-foreground">{group.terms.join(" · ")}</p></div>
            <div className="flex items-center gap-1"><button type="button" onClick={() => beginEdit(group)} disabled={pending} className="label-mono inline-flex items-center gap-1 px-2 py-1.5 text-xs text-muted-foreground hover:text-foreground"><Pencil className="size-3.5" /> Edit</button><button type="button" onClick={() => remove(group)} disabled={pending} className="label-mono inline-flex items-center gap-1 px-2 py-1.5 text-xs text-destructive hover:opacity-75"><Trash2 className="size-3.5" /> Delete</button></div>
          </div>
        ))}
      </div>
    </section>
  )
}
