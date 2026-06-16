"use client"

import { useState, useTransition, useRef } from "react"
import { Plus, Pencil, Trash2, Loader2, X, Power, Upload } from "lucide-react"
import { saveAd, toggleAdActive, deleteAdAction } from "@/app/dashboard/actions"
import { EmptyState, PrimaryButton } from "@/components/dashboard/ui"
import type { Ad } from "@/lib/ads"

const PLACEMENTS = ["top", "sidebar", "in-feed", "bottom"] as const
const TYPES = ["internal", "sponsor", "partner"] as const

function AdForm({ ad, onClose }: { ad?: Ad; onClose: () => void }) {
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [previewUrl, setPreviewUrl] = useState(ad?.image_url || "")
  const imageUrlRef = useRef<string>(ad?.image_url || "")
  const formRef = useRef<HTMLFormElement>(null)
  const inputClass = "border border-border bg-background px-3 py-2 text-foreground outline-none focus:border-primary w-full"

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.currentTarget.files?.[0]
    if (!file) return

    setUploading(true)
    setError(null)
    try {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("folder", "ads")

      const res = await fetch("/api/dashboard/upload", {
        method: "POST",
        body: formData,
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Upload failed")
      }

      const data = await res.json()
      imageUrlRef.current = data.url
      setPreviewUrl(data.url)
      if (formRef.current) {
        const input = formRef.current.querySelector('input[name="image_url"]') as HTMLInputElement
        if (input) input.value = data.url
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed")
    } finally {
      setUploading(false)
    }
  }

  function onSubmit(formData: FormData) {
    if (imageUrlRef.current) {
      formData.set("image_url", imageUrlRef.current)
    }
    
    setError(null)
    startTransition(async () => {
      const res = await saveAd(formData)
      if (res.success) onClose()
      else setError(res.error ?? "Failed to save")
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto border border-border bg-card p-6">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="stencil text-lg text-foreground">{ad ? "Edit Ad" : "New Ad"}</h3>
          <button type="button" onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="h-5 w-5" />
          </button>
        </div>
        <form ref={formRef} action={onSubmit} className="flex flex-col gap-4">
          {ad ? <input type="hidden" name="id" value={ad.id} /> : null}
          <div className="flex flex-col gap-1">
            <label className="label-mono text-muted-foreground">Title</label>
            <input name="title" required defaultValue={ad?.title} className={inputClass} />
          </div>

          {/* Image Upload Section */}
          <div className="flex flex-col gap-2">
            <label className="label-mono text-muted-foreground">Ad Image</label>
            
            {previewUrl && (
              <div className="relative border border-border bg-muted/30 p-2">
                <img src={previewUrl} alt="Preview" className="h-32 w-full object-cover" />
                <button
                  type="button"
                  onClick={() => {
                    setPreviewUrl("")
                    imageUrlRef.current = ""
                    if (formRef.current) {
                      const input = formRef.current.querySelector('input[name="image_url"]') as HTMLInputElement
                      if (input) input.value = ""
                    }
                  }}
                  className="absolute right-1 top-1 bg-destructive/90 p-1 text-white hover:bg-destructive"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}

            <div className="flex gap-2">
              <label className="flex-1 flex items-center justify-center gap-2 border-2 border-dashed border-border bg-muted/30 px-4 py-4 cursor-pointer transition-colors hover:border-primary hover:bg-muted/50">
                <Upload className="h-4 w-4" />
                <span className="label-mono text-sm font-semibold">{uploading ? "Uploading..." : "Upload Image"}</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  disabled={uploading}
                  className="hidden"
                />
              </label>
            </div>

            <input type="hidden" name="image_url" defaultValue={ad?.image_url ?? ""} />
            {error && <p className="label-mono text-xs text-destructive">{error}</p>}
          </div>

          <div className="flex flex-col gap-1">
            <label className="label-mono text-muted-foreground">Description</label>
            <textarea name="description" rows={2} defaultValue={ad?.description} className={`${inputClass} resize-y`} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="label-mono text-muted-foreground">Button Text</label>
              <input name="button_text" defaultValue={ad?.button_text ?? "Learn More"} className={inputClass} />
            </div>
            <div className="flex flex-col gap-1">
              <label className="label-mono text-muted-foreground">Button Link</label>
              <input name="button_link" defaultValue={ad?.button_link ?? "#"} className={inputClass} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="label-mono text-muted-foreground">Placement</label>
              <select name="placement" defaultValue={ad?.placement ?? "sidebar"} className={inputClass}>
                {PLACEMENTS.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="label-mono text-muted-foreground">Type</label>
              <select name="type" defaultValue={ad?.type ?? "internal"} className={inputClass}>
                {TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="label-mono text-muted-foreground">Priority</label>
              <input name="priority" type="number" defaultValue={ad?.priority ?? 0} className={inputClass} />
            </div>
            <label className="mt-6 flex items-center gap-2">
              <input type="checkbox" name="is_active" defaultChecked={ad?.is_active ?? true} className="h-4 w-4 accent-primary" />
              <span className="label-mono text-foreground">Active</span>
            </label>
          </div>
          {error ? <p className="label-mono text-destructive">{error}</p> : null}
          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={pending || uploading}
              className="label-mono inline-flex items-center gap-2 bg-primary px-4 py-2 font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {ad ? "Update" : "Create"}
            </button>
            <button type="button" onClick={onClose} className="label-mono px-4 py-2 text-muted-foreground hover:text-foreground">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export function AdsManager({ ads }: { ads: Ad[] }) {
  const [rows, setRows] = useState(ads)
  const [editing, setEditing] = useState<Ad | null>(null)
  const [creating, setCreating] = useState(false)
  const [pending, startTransition] = useTransition()
  const [busyId, setBusyId] = useState<string | null>(null)

  function toggle(ad: Ad) {
    setBusyId(ad.id)
    startTransition(async () => {
      const res = await toggleAdActive(ad.id, !ad.is_active)
      if (res.success) setRows((prev) => prev.map((a) => (a.id === ad.id ? { ...a, is_active: !a.is_active } : a)))
      setBusyId(null)
    })
  }

  function remove(id: string) {
    if (!confirm("Delete this ad permanently?")) return
    setBusyId(id)
    startTransition(async () => {
      const res = await deleteAdAction(id)
      if (res.success) setRows((prev) => prev.filter((a) => a.id !== id))
      setBusyId(null)
    })
  }

  function refresh() {
    setEditing(null)
    setCreating(false)
    window.location.reload()
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <PrimaryButton onClick={() => setCreating(true)}>
          <Plus className="h-4 w-4" /> New Ad
        </PrimaryButton>
      </div>

      {rows.length === 0 ? (
        <EmptyState title="No ads yet" description="Create your first ad banner to display across the site." />
      ) : (
        <div className="overflow-x-auto border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30 text-left">
                <th className="px-4 py-3 font-semibold">Image</th>
                <th className="px-4 py-3 font-semibold">Title</th>
                <th className="px-4 py-3 font-semibold">Placement</th>
                <th className="px-4 py-3 font-semibold">Type</th>
                <th className="px-4 py-3 font-semibold">Priority</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((ad) => (
                <tr key={ad.id} className="border-b border-border hover:bg-muted/20">
                  <td className="px-4 py-3">
                    {ad.image_url ? (
                      <img src={ad.image_url} alt={ad.title} className="h-12 w-16 object-cover border border-border" />
                    ) : (
                      <div className="h-12 w-16 bg-muted border border-border flex items-center justify-center text-xs text-muted-foreground">No image</div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-semibold text-foreground">{ad.title}</p>
                    <p className="label-mono text-xs text-muted-foreground">{ad.description}</p>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{ad.placement}</td>
                  <td className="px-4 py-3 text-muted-foreground">{ad.type}</td>
                  <td className="px-4 py-3 text-muted-foreground">{ad.priority}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`label-mono inline-block px-2 py-1 text-xs font-semibold ${
                        ad.is_active ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {ad.is_active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      {busyId === ad.id && pending ? (
                        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                      ) : (
                        <>
                          <button
                            type="button"
                            onClick={() => toggle(ad)}
                            title={ad.is_active ? "Deactivate" : "Activate"}
                            className="rounded px-2 py-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                          >
                            <Power className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditing(ad)}
                            title="Edit"
                            className="rounded px-2 py-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => remove(ad.id)}
                            title="Delete"
                            className="rounded px-2 py-1 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {(editing || creating) && <AdForm ad={editing ?? undefined} onClose={refresh} />}
    </div>
  )
}
