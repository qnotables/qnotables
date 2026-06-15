"use client"

import { useRef, useState, useTransition } from "react"
import { UploadCloud, Trash2, Loader2, Copy, Check } from "lucide-react"
import { saveMediaAsset, deleteMediaAsset } from "@/app/dashboard/actions"
import { EmptyState } from "@/components/dashboard/ui"

export interface MediaRow {
  id: string
  file_name: string
  file_url: string
  file_type: string | null
  file_size: number | null
  alt_text: string | null
  created_at: string
}

function formatSize(bytes: number | null) {
  if (!bytes) return "—"
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function MediaLibrary({ assets }: { assets: MediaRow[] }) {
  const [rows, setRows] = useState(assets)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()
  const [busyId, setBusyId] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  async function handleFiles(files: FileList) {
    setError(null)
    setUploading(true)
    try {
      for (const file of Array.from(files)) {
        const fd = new FormData()
        fd.append("file", file)
        fd.append("folder", "media")
        const res = await fetch("/api/dashboard/upload", { method: "POST", body: fd })
        const json = await res.json()
        if (!res.ok || json.error) throw new Error(json.error ?? "Upload failed")
        await saveMediaAsset({
          fileName: json.fileName ?? file.name,
          fileUrl: json.url,
          fileType: json.fileType ?? file.type,
          fileSize: json.fileSize ?? file.size,
        })
      }
      window.location.reload()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed")
      setUploading(false)
    }
  }

  function remove(id: string) {
    if (!confirm("Delete this media asset?")) return
    setBusyId(id)
    startTransition(async () => {
      const res = await deleteMediaAsset(id)
      if (res.success) setRows((prev) => prev.filter((a) => a.id !== id))
      setBusyId(null)
    })
  }

  function copy(id: string, url: string) {
    navigator.clipboard?.writeText(url)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 1500)
  }

  return (
    <div className="flex flex-col gap-6">
      <button
        type="button"
        onClick={() => fileRef.current?.click()}
        disabled={uploading}
        className="label-mono flex h-32 w-full flex-col items-center justify-center gap-2 border border-dashed border-border text-muted-foreground transition-colors hover:border-primary hover:text-foreground disabled:opacity-50"
      >
        {uploading ? <Loader2 className="h-6 w-6 animate-spin" /> : <UploadCloud className="h-6 w-6" />}
        {uploading ? "Uploading…" : "Upload images or videos"}
      </button>
      <input
        ref={fileRef}
        type="file"
        accept="image/*,video/*"
        multiple
        className="hidden"
        onChange={(e) => {
          if (e.target.files?.length) handleFiles(e.target.files)
          e.target.value = ""
        }}
      />
      {error ? <p className="label-mono text-destructive">{error}</p> : null}

      {rows.length === 0 ? (
        <EmptyState title="No media yet" description="Upload images and videos to reuse across posts and ads." />
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {rows.map((asset) => (
            <div key={asset.id} className="group flex flex-col border border-border bg-card">
              <div className="relative aspect-video overflow-hidden bg-muted">
                {asset.file_type?.startsWith("video/") ? (
                  <video src={asset.file_url} className="h-full w-full object-cover" muted />
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={asset.file_url || "/placeholder.svg"} alt={asset.alt_text || asset.file_name} className="h-full w-full object-cover" />
                )}
              </div>
              <div className="flex flex-col gap-1 p-3">
                <p className="truncate text-sm font-semibold text-foreground" title={asset.file_name}>
                  {asset.file_name}
                </p>
                <p className="label-mono text-xs text-muted-foreground">{formatSize(asset.file_size)}</p>
                <div className="mt-2 flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => copy(asset.id, asset.file_url)}
                    className="label-mono inline-flex flex-1 items-center justify-center gap-1 border border-border px-2 py-1 text-xs text-muted-foreground transition-colors hover:border-primary hover:text-foreground"
                  >
                    {copiedId === asset.id ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                    {copiedId === asset.id ? "Copied" : "Copy URL"}
                  </button>
                  <button
                    type="button"
                    onClick={() => remove(asset.id)}
                    className="rounded px-2 py-1 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                    title="Delete"
                  >
                    {busyId === asset.id && pending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
