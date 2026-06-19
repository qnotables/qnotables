"use client"

import { useState } from "react"
import { X, AlertCircle, CheckCircle } from "lucide-react"
import {
  createVideoEmbed,
  detectVideoPlatform,
  extractThumbnailUrl,
  isValidVideoUrl,
  VideoEmbed,
} from "@/lib/video-embed-utils"

interface EmbedVideoModalProps {
  isOpen: boolean
  onClose: () => void
  onInsert: (embed: VideoEmbed) => void
}

export function EmbedVideoModal({ isOpen, onClose, onInsert }: EmbedVideoModalProps) {
  const [url, setUrl] = useState("")
  const [title, setTitle] = useState("")
  const [caption, setCaption] = useState("")
  const [thumbnail, setThumbnail] = useState<string | null>(null)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [platform, setPlatform] = useState("")

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newUrl = e.target.value
    setUrl(newUrl)
    setError("")

    if (newUrl.trim()) {
      const detectedPlatform = detectVideoPlatform(newUrl)
      setPlatform(detectedPlatform)
      
      // Pre-extract thumbnail for some platforms
      const thumb = extractThumbnailUrl(newUrl, detectedPlatform)
      if (thumb) {
        setThumbnail(thumb)
      }
    } else {
      setPlatform("")
      setThumbnail(null)
    }
  }

  const handlePreview = async () => {
    if (!url.trim()) {
      setError("Please enter a video URL")
      return
    }

    if (!isValidVideoUrl(url)) {
      setError("Invalid URL. Please enter a valid HTTP/HTTPS video link.")
      return
    }

    setLoading(true)
    setError("")

    try {
      const thumb = extractThumbnailUrl(url)
      if (thumb) {
        setThumbnail(thumb)
      }
    } catch (err) {
      setError("Failed to load preview")
    } finally {
      setLoading(false)
    }
  }

  const handleInsert = () => {
    if (!url.trim()) {
      setError("Please enter a video URL")
      return
    }

    if (!isValidVideoUrl(url)) {
      setError("Invalid URL. Please enter a valid HTTP/HTTPS video link.")
      return
    }

    const embed = createVideoEmbed(url, {
      title: title.trim() || undefined,
      caption: caption.trim() || undefined,
    })

    if (!embed) {
      setError("Failed to create video embed")
      return
    }

    onInsert(embed)
    handleClose()
  }

  const handleClose = () => {
    setUrl("")
    setTitle("")
    setCaption("")
    setThumbnail(null)
    setError("")
    setPlatform("")
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded border border-border bg-background p-6 shadow-lg">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <h2 className="stencil text-lg font-bold text-foreground">EMBED VIDEO</h2>
          <button
            onClick={handleClose}
            className="text-muted-foreground transition-colors hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* URL Input */}
        <div className="mb-4">
          <label className="label-mono block text-xs font-semibold text-muted-foreground mb-2">
            Video URL
          </label>
          <input
            type="text"
            value={url}
            onChange={handleUrlChange}
            placeholder="https://youtube.com/watch?v=... or https://rumble.com/..."
            className="w-full border border-border bg-muted/20 px-3 py-2 text-sm text-foreground placeholder-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/20"
          />
          {platform && (
            <div className="mt-2 flex items-center gap-2 text-xs text-primary">
              <CheckCircle className="h-3.5 w-3.5" />
              <span className="capitalize">{platform}</span>
            </div>
          )}
        </div>

        {/* Title Input */}
        <div className="mb-4">
          <label className="label-mono block text-xs font-semibold text-muted-foreground mb-2">
            Title (Optional)
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter video title"
            className="w-full border border-border bg-muted/20 px-3 py-2 text-sm text-foreground placeholder-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/20"
          />
        </div>

        {/* Caption Input */}
        <div className="mb-4">
          <label className="label-mono block text-xs font-semibold text-muted-foreground mb-2">
            Caption (Optional)
          </label>
          <textarea
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="Enter video caption or description"
            rows={2}
            className="w-full border border-border bg-muted/20 px-3 py-2 text-sm text-foreground placeholder-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/20 resize-none"
          />
        </div>

        {/* Thumbnail Preview */}
        {thumbnail && (
          <div className="mb-4">
            <p className="label-mono block text-xs font-semibold text-muted-foreground mb-2">
              PREVIEW
            </p>
            <img
              src={thumbnail}
              alt="Video thumbnail"
              className="w-full aspect-video object-cover border border-border bg-muted/20"
            />
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-4 flex items-start gap-2 rounded border border-red-600/50 bg-red-50/10 p-3">
            <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0 text-red-600" />
            <p className="text-xs text-red-600">{error}</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={handlePreview}
            disabled={!url.trim() || loading}
            className="flex-1 border border-border bg-muted/20 px-3 py-2 text-xs font-semibold text-muted-foreground transition-colors hover:bg-muted/40 hover:text-foreground disabled:opacity-50"
          >
            {loading ? "Loading..." : "Preview"}
          </button>
          <button
            onClick={handleInsert}
            disabled={!url.trim() || loading}
            className="flex-1 border border-primary bg-primary/10 px-3 py-2 text-xs font-semibold text-primary transition-colors hover:bg-primary/20 disabled:opacity-50"
          >
            Insert
          </button>
          <button
            onClick={handleClose}
            className="flex-1 border border-border px-3 py-2 text-xs font-semibold text-muted-foreground transition-colors hover:bg-muted/20"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}
