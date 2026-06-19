"use client"

import { useState, useRef, useCallback } from "react"
import { ImagePlus, Video, Loader2, AlertCircle, Link as LinkIcon } from "lucide-react"
import { VideoEmbed } from "@/lib/video-embed-utils"

interface MediaInserterProps {
  onInsertImage: (url: string, alt: string) => void
  onInsertVideo: (url: string) => void
  onInsertVideoLink?: (embed: VideoEmbed) => void
}

type UploadState = "idle" | "uploading" | "done" | "error"

async function uploadFile(
  file: File,
  folder: string,
): Promise<{ url: string }> {
  const fd = new FormData()
  fd.append("file", file)
  fd.append("folder", folder)
  const res = await fetch("/api/dashboard/upload", { method: "POST", body: fd })
  const json = await res.json()
  if (!res.ok || json.error) throw new Error(json.error ?? "Upload failed")
  return json
}

export function MediaInserter({ onInsertImage, onInsertVideo, onInsertVideoLink }: MediaInserterProps) {
  const [imageState, setImageState] = useState<UploadState>("idle")
  const [videoState, setVideoState] = useState<UploadState>("idle")
  const [imageError, setImageError] = useState<string | null>(null)
  const [videoError, setVideoError] = useState<string | null>(null)
  const imageRef = useRef<HTMLInputElement>(null)
  const videoRef = useRef<HTMLInputElement>(null)
  const [showEmbedModal, setShowEmbedModal] = useState(false)

  const handleImageUpload = useCallback(
    async (file: File) => {
      setImageError(null)
      setImageState("uploading")
      try {
        const { url } = await uploadFile(file, "blog")
        // Prompt for alt text
        const alt = prompt("Alt text for image (for accessibility):", file.name.split(".")[0])
        if (alt !== null) {
          onInsertImage(url, alt || "Image")
        }
        setImageState("done")
        setTimeout(() => setImageState("idle"), 2000)
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Upload failed"
        setImageError(msg)
        setImageState("error")
      }
    },
    [onInsertImage],
  )

  const handleVideoUpload = useCallback(
    async (file: File) => {
      setVideoError(null)
      setVideoState("uploading")
      try {
        const { url } = await uploadFile(file, "blog-videos")
        onInsertVideo(url)
        setVideoState("done")
        setTimeout(() => setVideoState("idle"), 2000)
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Upload failed"
        setVideoError(msg)
        setVideoState("error")
      }
    },
    [onInsertVideo],
  )

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.currentTarget.files?.[0]
    if (file) handleImageUpload(file)
    e.currentTarget.value = ""
  }

  const handleVideoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.currentTarget.files?.[0]
    if (file) handleVideoUpload(file)
    e.currentTarget.value = ""
  }

  return (
    <div className="flex items-center gap-2 border-l border-border pl-2">
      {/* Insert Image */}
      <button
        type="button"
        onClick={() => imageRef.current?.click()}
        disabled={imageState !== "idle"}
        title="Upload and insert image"
        className="inline-flex items-center justify-center h-8 w-8 border border-border bg-background text-foreground hover:border-primary hover:text-primary transition-colors disabled:opacity-50"
      >
        {imageState === "uploading" ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : imageState === "done" ? (
          <span className="text-green-600 text-lg">✓</span>
        ) : (
          <ImagePlus className="h-4 w-4" />
        )}
      </button>
      <input
        ref={imageRef}
        type="file"
        accept="image/*"
        onChange={handleImageSelect}
        className="hidden"
      />
      {imageError && <span className="text-xs text-destructive">{imageError}</span>}

      {/* Insert Video */}
      <button
        type="button"
        onClick={() => videoRef.current?.click()}
        disabled={videoState !== "idle"}
        title="Upload and insert video"
        className="inline-flex items-center justify-center h-8 w-8 border border-border bg-background text-foreground hover:border-primary hover:text-primary transition-colors disabled:opacity-50"
      >
        {videoState === "uploading" ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : videoState === "done" ? (
          <span className="text-green-600 text-lg">✓</span>
        ) : (
          <Video className="h-4 w-4" />
        )}
      </button>
      <input
        ref={videoRef}
        type="file"
        accept="video/*"
        onChange={handleVideoSelect}
        className="hidden"
      />
      {videoError && <span className="text-xs text-destructive">{videoError}</span>}

      {/* Embed Video Link */}
      {onInsertVideoLink && (
        <button
          type="button"
          onClick={() => setShowEmbedModal(true)}
          title="Embed video from URL"
          className="inline-flex items-center justify-center h-8 w-8 border border-border bg-background text-foreground hover:border-primary hover:text-primary transition-colors"
        >
          <LinkIcon className="h-4 w-4" />
        </button>
      )}

      {/* Embed Modal */}
      {onInsertVideoLink && showEmbedModal && (
        <EmbedVideoModalWrapper
          isOpen={showEmbedModal}
          onClose={() => setShowEmbedModal(false)}
          onInsert={(embed) => {
            onInsertVideoLink(embed)
            setShowEmbedModal(false)
          }}
        />
      )}
    </div>
  )
}

/**
 * Lazy-loaded modal wrapper to avoid circular dependencies
 */
function EmbedVideoModalWrapper({
  isOpen,
  onClose,
  onInsert,
}: {
  isOpen: boolean
  onClose: () => void
  onInsert: (embed: VideoEmbed) => void
}) {
  const [EmbedVideoModal, setEmbedVideoModal] = useState<typeof import("./embed-video-modal").EmbedVideoModal | null>(
    null,
  )

  // Lazy load to avoid circular dependency
  if (!EmbedVideoModal && isOpen) {
    import("./embed-video-modal").then((m) => {
      setEmbedVideoModal(() => m.EmbedVideoModal)
    })
  }

  if (!EmbedVideoModal) return null

  return <EmbedVideoModal isOpen={isOpen} onClose={onClose} onInsert={onInsert} />
}
