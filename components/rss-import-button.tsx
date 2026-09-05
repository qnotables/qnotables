"use client"

import { useState } from "react"
import { Loader2, Upload } from "lucide-react"

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
  isLoggedIn: boolean
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
  isLoggedIn,
}: RssImportButtonProps) {
  const [pending, setPending] = useState(false)

  if (!isLoggedIn) return null

  function handleImport() {
    setPending(true)
    const params = new URLSearchParams({
      imported: "1",
      title,
      content,
      source_url: sourceUrl,
      source_name: sourceName,
      author,
      published_at: publishedAt ?? "",
      image_url: imageUrl ?? "",
      category,
      tags: tags.join(", "),
    })
    window.location.assign(`/forum/new?${params.toString()}`)
  }

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={handleImport}
        disabled={pending}
        className="label-mono inline-flex items-center gap-1.5 border border-primary/50 px-2.5 py-1.5 text-[10px] uppercase tracking-wider text-primary transition-colors hover:bg-primary/10 disabled:cursor-not-allowed disabled:opacity-60"
        title="Open this RSS item in a new Town Hall post"
      >
        {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
        {pending ? "Opening" : "Import to Town Hall"}
      </button>
    </div>
  )
}
