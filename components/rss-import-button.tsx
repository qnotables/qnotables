"use client"

import { useState, useTransition } from "react"
import { Check, Loader2, ShieldAlert, Upload } from "lucide-react"
import { importRssToTownHall } from "@/app/actions/rss-import-actions"

export interface RssImportButtonProps {
  title: string
  content: string
  sourceUrl: string
  sourceName: string
  author: string
  publishedAt?: string | null
  imageUrl?: string | null
  category: string
  tags?: string[]
  isAdmin: boolean
}

export function RssImportButton({
  title,
  content,
  sourceUrl,
  sourceName,
  author,
  publishedAt,
  imageUrl,
  category,
  tags = [],
  isAdmin,
}: RssImportButtonProps) {
  const [pending, startTransition] = useTransition()
  const [message, setMessage] = useState<string | null>(null)
  const [imported, setImported] = useState(false)

  if (!isAdmin) return null

  function handleImport() {
    const formData = new FormData()
    formData.set("title", title)
    formData.set("content", content)
    formData.set("source_url", sourceUrl)
    formData.set("source_name", sourceName)
    formData.set("author", author)
    formData.set("published_at", publishedAt ?? "")
    formData.set("image_url", imageUrl ?? "")
    formData.set("category", category)
    formData.set("tags", tags.join(", "))
    setMessage(null)
    startTransition(async () => {
      const result = await importRssToTownHall(formData)
      if (result.success) {
        setImported(true)
        setMessage("Pending review")
      } else {
        setMessage(result.duplicate ? "Already imported" : result.error ?? "Import failed")
      }
    })
  }

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={handleImport}
        disabled={pending || imported}
        className="label-mono inline-flex items-center gap-1.5 border border-primary/50 px-2.5 py-1.5 text-[10px] uppercase tracking-wider text-primary transition-colors hover:bg-primary/10 disabled:cursor-not-allowed disabled:opacity-60"
        title="Import this RSS item as a pending Town Hall thread"
      >
        {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : imported ? <Check className="h-3.5 w-3.5" /> : <Upload className="h-3.5 w-3.5" />}
        {pending ? "Importing" : imported ? "In review" : "Import to Town Hall"}
      </button>
      {message && !imported && <span className="label-mono inline-flex items-center gap-1 text-[10px] text-amber-500"><ShieldAlert className="h-3 w-3" />{message}</span>}
      {message && imported && <span className="label-mono text-[10px] text-muted-foreground">{message}</span>}
    </div>
  )
}
