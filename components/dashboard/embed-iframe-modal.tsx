"use client"

import { useState } from "react"
import { X, AlertCircle, CheckCircle } from "lucide-react"
import { IframeEmbed, validateIframeEmbed } from "@/lib/iframe-embed-utils"
import { SafeEmbed } from "@/components/safe-embed"

export interface EmbedIframeModalProps {
  isOpen: boolean
  onClose: () => void
  onInsert: (embed: IframeEmbed) => void
}

export function EmbedIframeModal({ isOpen, onClose, onInsert }: EmbedIframeModalProps) {
  const [url, setUrl] = useState("")
  const [title, setTitle] = useState("")
  const [aspectRatio, setAspectRatio] = useState<"16:9" | "4:3" | "1:1">("16:9")
  const [error, setError] = useState<string | null>(null)
  const [showPreview, setShowPreview] = useState(false)

  if (!isOpen) return null

  const validation = validateIframeEmbed({ url, title, aspectRatio })

  const handleInsert = () => {
    if (!validation.valid) {
      setError(validation.error || "Invalid embed data")
      return
    }

    const embed: IframeEmbed = {
      url,
      title: title || undefined,
      aspectRatio,
      maxWidth: "100%",
    }

    onInsert(embed)
    resetForm()
    onClose()
  }

  const resetForm = () => {
    setUrl("")
    setTitle("")
    setAspectRatio("16:9")
    setError(null)
    setShowPreview(false)
  }

  const handleClose = () => {
    resetForm()
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto border border-border bg-background p-6 shadow-xl">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <h2 className="stencil text-xl font-bold text-foreground">EMBED IFRAME</h2>
          <button
            onClick={handleClose}
            className="p-1 text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* URL Input */}
        <div className="mb-4 space-y-2">
          <label className="label-mono block text-xs font-semibold text-foreground">
            URL <span className="text-red-500">*</span>
          </label>
          <input
            type="url"
            placeholder="https://example.com"
            value={url}
            onChange={(e) => {
              setUrl(e.target.value)
              setError(null)
            }}
            className="w-full border border-border bg-background px-3 py-2 text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
          />
          <p className="text-xs text-muted-foreground">
            Supported domains: YouTube, Rumble, Vimeo, Odysee, BitChute, Archive.org, Google Docs/Drive
          </p>
        </div>

        {/* Title Input */}
        <div className="mb-4 space-y-2">
          <label className="label-mono block text-xs font-semibold text-foreground">
            Title <span className="text-muted-foreground">(optional)</span>
          </label>
          <input
            type="text"
            placeholder="e.g., My Embedded Content"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full border border-border bg-background px-3 py-2 text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
          />
        </div>

        {/* Aspect Ratio */}
        <div className="mb-4 space-y-2">
          <label className="label-mono block text-xs font-semibold text-foreground">
            Aspect Ratio
          </label>
          <select
            value={aspectRatio}
            onChange={(e) => setAspectRatio(e.target.value as "16:9" | "4:3" | "1:1")}
            className="w-full border border-border bg-background px-3 py-2 text-foreground focus:border-primary focus:outline-none"
          >
            <option value="16:9">16:9 (Widescreen)</option>
            <option value="4:3">4:3 (Standard)</option>
            <option value="1:1">1:1 (Square)</option>
          </select>
        </div>

        {/* Preview */}
        <div className="mb-6 space-y-2">
          <label className="label-mono flex cursor-pointer items-center gap-2 text-xs font-semibold text-foreground">
            <input
              type="checkbox"
              checked={showPreview}
              onChange={(e) => setShowPreview(e.target.checked)}
            />
            Preview
          </label>
          {showPreview && validation.valid && (
            <div className="border border-border p-4">
              <SafeEmbed url={url} title={title} type="iframe" aspectRatio={aspectRatio} />
            </div>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 flex items-start gap-2 border-l-4 border-red-500 bg-red-50/10 p-3">
            <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-red-500" />
            <p className="text-sm text-red-500">{error}</p>
          </div>
        )}

        {/* Validation Status */}
        {url && !error && validation.valid && (
          <div className="mb-6 flex items-center gap-2 text-sm text-green-600">
            <CheckCircle className="h-4 w-4" />
            <span>URL is valid and approved for embedding</span>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={handleClose}
            className="label-mono flex-1 border border-border bg-transparent px-4 py-2 text-sm font-semibold text-foreground hover:bg-muted/50 transition-colors"
          >
            CANCEL
          </button>
          <button
            onClick={handleInsert}
            disabled={!validation.valid}
            className="label-mono flex-1 bg-primary px-4 py-2 text-sm font-semibold text-background hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            INSERT
          </button>
        </div>
      </div>
    </div>
  )
}
