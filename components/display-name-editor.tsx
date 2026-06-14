"use client"

import { useState } from "react"
import { Pencil, Check, X, Loader2 } from "lucide-react"
import { updateDisplayName } from "@/app/forum/actions"

export function DisplayNameEditor({ initialName }: { initialName: string }) {
  const [name, setName] = useState(initialName)
  const [editing, setEditing] = useState(false)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSave(formData: FormData) {
    setPending(true)
    setError(null)
    const res = await updateDisplayName(formData)
    setPending(false)
    if (res?.error) {
      setError(res.error)
      return
    }
    setName(String(formData.get("display_name") ?? "").trim())
    setEditing(false)
  }

  if (editing) {
    return (
      <form action={handleSave} className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <input
            name="display_name"
            defaultValue={name}
            required
            minLength={2}
            maxLength={32}
            autoFocus
            className="stencil border border-primary bg-background px-3 py-1 text-2xl text-foreground outline-none"
          />
          <button
            type="submit"
            disabled={pending}
            aria-label="Save display name"
            className="flex items-center gap-1 bg-primary px-3 py-2 font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
          >
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
          </button>
          <button
            type="button"
            onClick={() => {
              setEditing(false)
              setError(null)
            }}
            aria-label="Cancel"
            className="flex items-center gap-1 border border-border px-3 py-2 text-muted-foreground transition-colors hover:border-primary hover:text-primary"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        {error ? <p className="label-mono text-destructive">{error}</p> : null}
      </form>
    )
  }

  return (
    <div className="flex items-center gap-3">
      <h1 className="stencil text-3xl text-foreground md:text-4xl">{name}</h1>
      <button
        type="button"
        onClick={() => setEditing(true)}
        aria-label="Edit display name"
        className="flex items-center gap-1 border border-border px-2 py-1 text-muted-foreground transition-colors hover:border-primary hover:text-primary"
      >
        <Pencil className="h-3.5 w-3.5" />
        <span className="label-mono">Edit</span>
      </button>
    </div>
  )
}
