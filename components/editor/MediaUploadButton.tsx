"use client"

/**
 * MediaUploadButton — shared between MarkdownEditor and TiptapEditor.
 *
 * Renders a single "Upload Media" toolbar button that opens a <input type="file">
 * accepting both images and videos.  Handles validation, upload progress, error
 * display, and an attached thumbnail grid showing upload status.
 *
 * The parent editor passes callbacks:
 *   onImageUploaded(url, filename) — called once per successful image upload
 *   onVideoUploaded(url, filename) — called once per successful video upload
 */

import { useCallback, useRef, useState } from "react"
import { Upload, Loader2, X, CheckCircle2, AlertCircle, Image as ImageIcon, Video } from "lucide-react"
import {
  ALLOWED_IMAGE_TYPES,
  ALLOWED_VIDEO_TYPES,
  MAX_IMAGES,
  MAX_VIDEOS,
  UploadedMedia,
  uploadMediaFile,
  validateMediaFile,
} from "@/lib/media-utils"

// ─── Types ────────────────────────────────────────────────────────────────────

export interface MediaUploadButtonProps {
  uploadFolder: "forum" | "blog"
  isSignedIn?: boolean
  /** Notified after a successful image upload. */
  onImageUploaded: (url: string, filename: string) => void
  /** Notified after a successful video upload. */
  onVideoUploaded: (url: string, filename: string) => void
  /** Current media list — used to enforce per-type limits. */
  media?: UploadedMedia[]
}

// ─── Thumbnail grid (shared visual for both editors) ─────────────────────────

export function MediaPreviewGrid({
  media,
  onRemove,
}: {
  media: UploadedMedia[]
  onRemove: (id: string) => void
}) {
  if (media.length === 0) return null

  const imageDone = media.filter((m) => m.kind === "image" && m.status === "done").length
  const videoDone = media.filter((m) => m.kind === "video" && m.status === "done").length

  return (
    <div className="flex flex-wrap gap-2 border-t border-border bg-muted/30 p-3">
      {media.map((item) => (
        <div
          key={item.id}
          className="group relative h-16 w-16 flex-shrink-0 overflow-hidden border border-border bg-background"
          title={item.filename}
        >
          {item.status === "uploading" ? (
            <div className="flex h-full w-full items-center justify-center">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : item.status === "error" ? (
            <div className="flex h-full w-full flex-col items-center justify-center gap-1 px-1">
              <AlertCircle className="h-4 w-4 flex-shrink-0 text-destructive" />
              <span className="label-mono text-center text-[9px] leading-tight text-destructive line-clamp-2">
                {item.error ?? "Error"}
              </span>
            </div>
          ) : item.kind === "image" ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={item.url}
              alt={item.filename}
              className="h-full w-full object-cover opacity-90 group-hover:opacity-100 transition-opacity"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <Video className="h-5 w-5 text-muted-foreground" />
            </div>
          )}

          {item.status === "done" && (
            <div className="absolute bottom-0.5 right-0.5">
              <CheckCircle2 className="h-3 w-3 text-green-400 drop-shadow" />
            </div>
          )}

          <button
            type="button"
            onClick={() => onRemove(item.id)}
            className="absolute right-0 top-0 hidden p-0.5 group-hover:block bg-background/80 hover:bg-destructive hover:text-white text-muted-foreground transition-colors"
            aria-label="Remove"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      ))}

      <div className="flex flex-col justify-end gap-0.5 self-end">
        {imageDone > 0 && (
          <span className="label-mono flex items-center gap-1 text-[10px] text-muted-foreground">
            <ImageIcon className="h-2.5 w-2.5" /> {imageDone}/{MAX_IMAGES}
          </span>
        )}
        {videoDone > 0 && (
          <span className="label-mono flex items-center gap-1 text-[10px] text-muted-foreground">
            <Video className="h-2.5 w-2.5" /> {videoDone}/{MAX_VIDEOS}
          </span>
        )}
      </div>
    </div>
  )
}

// ─── Main button ──────────────────────────────────────────────────────────────

export function MediaUploadButton({
  uploadFolder,
  isSignedIn = true,
  onImageUploaded,
  onVideoUploaded,
  media = [],
}: MediaUploadButtonProps) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const imageDone = media.filter((m) => m.kind === "image" && m.status === "done").length
  const videoDone = media.filter((m) => m.kind === "video" && m.status === "done").length
  const canUploadImage = imageDone < MAX_IMAGES
  const canUploadVideo = videoDone < MAX_VIDEOS
  const canUpload = isSignedIn && (canUploadImage || canUploadVideo)

  const handleFiles = useCallback(
    async (files: File[]) => {
      if (!files.length) return
      setError(null)
      setUploading(true)

      for (const file of files) {
        const kind: "image" | "video" = ALLOWED_IMAGE_TYPES.has(file.type) ? "image" : "video"

        // Capacity check
        if (kind === "image" && !canUploadImage) continue
        if (kind === "video" && !canUploadVideo) continue

        const validationError = validateMediaFile(file, kind)
        if (validationError) {
          setError(validationError)
          continue
        }

        try {
          const result = await uploadMediaFile(file, uploadFolder)
          if (kind === "image") {
            onImageUploaded(result.url, result.filename)
          } else {
            onVideoUploaded(result.url, result.filename)
          }
        } catch (err) {
          setError(err instanceof Error ? err.message : "Upload failed.")
        }
      }

      setUploading(false)
    },
    [canUploadImage, canUploadVideo, onImageUploaded, onVideoUploaded, uploadFolder],
  )

  function onChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files) handleFiles(Array.from(e.target.files))
    e.target.value = ""
  }

  if (!isSignedIn) {
    return (
      <span className="label-mono px-2 text-[10px] text-muted-foreground">Sign in to upload</span>
    )
  }

  return (
    <>
      <button
        type="button"
        title={
          !canUpload
            ? "Upload limits reached"
            : `Upload image or video (${MAX_IMAGES - imageDone} images, ${MAX_VIDEOS - videoDone} videos remaining)`
        }
        disabled={!canUpload || uploading}
        onClick={() => fileRef.current?.click()}
        className="flex items-center gap-1.5 px-2 py-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40 label-mono text-[11px]"
      >
        {uploading ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <Upload className="h-3.5 w-3.5" />
        )}
        Upload
      </button>

      {error && (
        <span className="label-mono text-[10px] text-destructive flex items-center gap-1">
          <AlertCircle className="h-3 w-3" />
          {error}
        </span>
      )}

      <input
        ref={fileRef}
        type="file"
        accept=".jpg,.jpeg,.png,.webp,.gif,.mp4,.webm,.mov,image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm,video/quicktime"
        multiple
        className="hidden"
        onChange={onChange}
      />
    </>
  )
}

/**
 * Hook — manages the UploadedMedia[] list used by both editors.
 * The editor calls addMedia / updateMedia / removeMedia as upload lifecycle proceeds.
 */
export function useMediaList() {
  const [media, setMedia] = useState<UploadedMedia[]>([])

  function addUploading(id: string, file: File, kind: "image" | "video") {
    setMedia((prev) => [
      ...prev,
      { id, url: "", filename: file.name, size: file.size, kind, status: "uploading" },
    ])
  }

  function markDone(id: string, url: string, filename: string) {
    setMedia((prev) =>
      prev.map((m) => (m.id === id ? { ...m, url, filename, status: "done" } : m)),
    )
  }

  function markError(id: string, error: string) {
    setMedia((prev) =>
      prev.map((m) => (m.id === id ? { ...m, status: "error", error } : m)),
    )
  }

  function remove(id: string) {
    setMedia((prev) => prev.filter((m) => m.id !== id))
  }

  return { media, setMedia, addUploading, markDone, markError, remove }
}
