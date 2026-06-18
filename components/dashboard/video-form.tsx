"use client"

import { useState, useRef, useCallback } from "react"
import { useRouter } from "next/navigation"
import {
  Loader2,
  Upload,
  X,
  Check,
  AlertCircle,
  Play,
  Image as ImageIcon,
  ExternalLink,
  Link as LinkIcon,
} from "lucide-react"
import { createVideo, updateVideo, type Video, type VideoFormData } from "@/app/actions/video-actions"

const VIDEO_CATEGORIES = [
  "Briefing",
  "Situation Report",
  "Investigation",
  "Archive",
  "Interview",
  "Documentary",
  "Live Stream",
  "Other",
]

interface VideoFormProps {
  video?: Video
}

type UploadState = "idle" | "uploading" | "done" | "error"

interface FileUploadState {
  state: UploadState
  progress: number
  error: string | null
}

const initUpload: FileUploadState = { state: "idle", progress: 0, error: null }

// ---------------------------------------------------------------------------
// XHR upload with progress
// ---------------------------------------------------------------------------
function uploadWithProgress(
  url: string,
  fd: FormData,
  onProgress: (pct: number) => void,
): Promise<{ url: string }> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open("POST", url)
    xhr.upload.addEventListener("progress", (e) => {
      if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100))
    })
    xhr.addEventListener("load", () => {
      try {
        const json = JSON.parse(xhr.responseText)
        if (xhr.status >= 200 && xhr.status < 300 && json.url) {
          resolve(json)
        } else {
          reject(new Error(json.error ?? "Upload failed"))
        }
      } catch {
        reject(new Error("Upload failed"))
      }
    })
    xhr.addEventListener("error", () => reject(new Error("Network error during upload")))
    xhr.send(fd)
  })
}

// ---------------------------------------------------------------------------
// DropZone helper
// ---------------------------------------------------------------------------
function DropZone({
  accept,
  label,
  hint,
  uploadState,
  fileUrl,
  fileLabel,
  previewType,
  onFile,
  onRemove,
  inputRef,
}: {
  accept: string
  label: string
  hint: string
  uploadState: FileUploadState
  fileUrl: string
  fileLabel: string
  previewType: "video" | "image"
  onFile: (file: File) => void
  onRemove: () => void
  inputRef: React.RefObject<HTMLInputElement | null>
}) {
  const [dragging, setDragging] = useState(false)

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setDragging(false)
      const file = e.dataTransfer.files?.[0]
      if (file) onFile(file)
    },
    [onFile],
  )

  if (fileUrl) {
    return (
      <div className="border border-border bg-muted/20 p-3">
        {previewType === "image" ? (
          <div className="flex items-start gap-3">
            <div className="relative aspect-video w-36 shrink-0 overflow-hidden border border-border bg-muted">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={fileUrl} alt="Thumbnail preview" className="h-full w-full object-cover" />
            </div>
            <div className="flex min-w-0 flex-1 flex-col gap-1">
              <p className="label-mono truncate text-xs text-foreground">{fileLabel}</p>
              <button
                type="button"
                onClick={onRemove}
                className="label-mono flex w-fit items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground"
              >
                <X className="h-3 w-3" />
                Remove
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center border border-primary/30 bg-primary/10">
              <Play className="h-4 w-4 text-primary" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="label-mono truncate text-xs text-foreground">{fileLabel}</p>
              <a
                href={fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="label-mono text-[11px] text-primary hover:underline"
              >
                Preview ↗
              </a>
            </div>
            <button
              type="button"
              onClick={onRemove}
              className="ml-auto flex h-7 w-7 shrink-0 items-center justify-center border border-border text-muted-foreground hover:border-destructive/50 hover:text-destructive transition-colors"
              aria-label="Remove file"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </div>
    )
  }

  const isUploading = uploadState.state === "uploading"

  return (
    <div>
      <div
        role="button"
        tabIndex={0}
        aria-label={label}
        onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => !isUploading && inputRef.current?.click()}
        onKeyDown={(e) => e.key === "Enter" && !isUploading && inputRef.current?.click()}
        className={`label-mono flex w-full cursor-pointer flex-col items-center justify-center gap-2 border border-dashed px-4 py-8 text-center transition-colors ${
          dragging
            ? "border-primary bg-primary/5 text-foreground"
            : isUploading
              ? "border-border bg-muted/10 opacity-70 cursor-wait"
              : "border-border bg-muted/10 text-muted-foreground hover:border-primary hover:bg-primary/5 hover:text-foreground"
        }`}
      >
        {isUploading ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
            <span className="text-xs text-primary">Uploading... {uploadState.progress}%</span>
            <div className="h-1 w-full max-w-xs overflow-hidden bg-border">
              <div
                className="h-full bg-primary transition-all duration-200"
                style={{ width: `${uploadState.progress}%` }}
              />
            </div>
          </>
        ) : (
          <>
            {previewType === "video" ? (
              <Upload className="h-5 w-5" />
            ) : (
              <ImageIcon className="h-5 w-5" />
            )}
            <span className="text-xs">{label}</span>
            <span className="text-[11px] text-muted-foreground/70">{hint}</span>
          </>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="sr-only"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) onFile(file)
        }}
      />
      {uploadState.error && (
        <p className="label-mono mt-1.5 flex items-center gap-1 text-[11px] text-destructive">
          <AlertCircle className="h-3 w-3 shrink-0" />
          {uploadState.error}
        </p>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main form
// ---------------------------------------------------------------------------
export function VideoForm({ video }: VideoFormProps) {
  const router = useRouter()
  const isEditing = !!video

  const [title, setTitle] = useState(video?.title ?? "")
  const [description, setDescription] = useState(video?.description ?? "")
  const [category, setCategory] = useState(video?.category ?? "")
  const [date, setDate] = useState(video?.date ?? "")
  const [externalUrl, setExternalUrl] = useState(video?.external_url ?? "")
  const [videoUrl, setVideoUrl] = useState(video?.video_url ?? "")
  const [thumbnailUrl, setThumbnailUrl] = useState(video?.thumbnail_url ?? "")
  const [published, setPublished] = useState(video?.published ?? false)

  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const [videoUpload, setVideoUpload] = useState<FileUploadState>(initUpload)
  const [thumbUpload, setThumbUpload] = useState<FileUploadState>(initUpload)

  const videoFileRef = useRef<HTMLInputElement | null>(null)
  const thumbFileRef = useRef<HTMLInputElement | null>(null)

  // ---------------------------------------------------------------------------
  // Uploads
  // ---------------------------------------------------------------------------
  async function handleVideoFile(file: File) {
    const allowed = ["video/mp4", "video/webm", "video/quicktime", "video/mov"]
    if (!allowed.includes(file.type)) {
      setVideoUpload({ state: "error", progress: 0, error: "Only mp4, webm, or mov files are allowed." })
      return
    }
    if (file.size > 500 * 1024 * 1024) {
      setVideoUpload({ state: "error", progress: 0, error: "Video must be under 500 MB." })
      return
    }
    setVideoUpload({ state: "uploading", progress: 0, error: null })
    try {
      const fd = new FormData()
      fd.append("file", file)
      fd.append("folder", "videos")
      const { url } = await uploadWithProgress("/api/dashboard/upload", fd, (pct) =>
        setVideoUpload((s) => ({ ...s, progress: pct })),
      )
      setVideoUrl(url)
      setVideoUpload({ state: "done", progress: 100, error: null })
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Upload failed"
      setVideoUpload({ state: "error", progress: 0, error: msg })
    }
  }

  async function handleThumbnailFile(file: File) {
    const allowed = ["image/jpeg", "image/jpg", "image/png", "image/webp"]
    if (!allowed.includes(file.type)) {
      setThumbUpload({ state: "error", progress: 0, error: "Only jpg, png, or webp files are allowed." })
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      setThumbUpload({ state: "error", progress: 0, error: "Thumbnail must be under 10 MB." })
      return
    }
    setThumbUpload({ state: "uploading", progress: 0, error: null })
    try {
      const fd = new FormData()
      fd.append("file", file)
      fd.append("folder", "video-thumbnails")
      const { url } = await uploadWithProgress("/api/dashboard/upload", fd, (pct) =>
        setThumbUpload((s) => ({ ...s, progress: pct })),
      )
      setThumbnailUrl(url)
      setThumbUpload({ state: "done", progress: 100, error: null })
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Upload failed"
      setThumbUpload({ state: "error", progress: 0, error: msg })
    }
  }

  // ---------------------------------------------------------------------------
  // Submit
  // ---------------------------------------------------------------------------
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setFormError(null)
    setSuccess(false)

    if (!title.trim()) {
      setFormError("Title is required.")
      return
    }
    if (!externalUrl.trim() && !videoUrl.trim()) {
      setFormError("Provide either an external URL or upload a video file.")
      return
    }

    setSaving(true)
    try {
      const data: VideoFormData = {
        title,
        description: description || undefined,
        category: category || undefined,
        date: date || undefined,
        external_url: externalUrl || undefined,
        video_url: videoUrl || undefined,
        thumbnail_url: thumbnailUrl || undefined,
        published,
      }

      if (isEditing && video) {
        await updateVideo(video.id, data)
        setSuccess(true)
        setTimeout(() => setSuccess(false), 3000)
      } else {
        await createVideo(data)
        router.push("/dashboard/videos")
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "An error occurred"
      setFormError(msg)
    } finally {
      setSaving(false)
    }
  }

  const inputCls =
    "label-mono w-full border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary placeholder:text-muted-foreground/50"
  const labelCls = "label-mono mb-1.5 block text-xs font-semibold uppercase text-muted-foreground"

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Banners */}
      {formError && (
        <div className="flex items-start gap-2 border border-destructive/40 bg-destructive/10 px-4 py-3">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
          <p className="label-mono text-sm text-destructive">{formError}</p>
        </div>
      )}
      {success && (
        <div className="flex items-center gap-2 border border-primary/40 bg-primary/10 px-4 py-3">
          <Check className="h-4 w-4 shrink-0 text-primary" />
          <p className="label-mono text-sm text-primary">Video saved successfully.</p>
        </div>
      )}

      {/* ── Details ── */}
      <section className="border border-border bg-card">
        <div className="border-b border-border px-4 py-3">
          <p className="stencil text-sm text-foreground">Video Details</p>
        </div>
        <div className="space-y-4 p-4">
          <div>
            <label htmlFor="title" className={labelCls}>
              Title <span className="text-primary">*</span>
            </label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter video title"
              required
              className={inputCls}
            />
          </div>

          <div>
            <label htmlFor="description" className={labelCls}>
              Short Description
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief summary shown on the video card"
              rows={3}
              className={inputCls + " resize-none"}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="category" className={labelCls}>
                Category
              </label>
              <select
                id="category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className={inputCls}
              >
                <option value="">— Select category —</option>
                {VIDEO_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="date" className={labelCls}>
                Date
              </label>
              <input
                id="date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className={inputCls}
              />
            </div>
          </div>
        </div>
      </section>

      {/* ── Video Source ── */}
      <section className="border border-border bg-card">
        <div className="border-b border-border px-4 py-3">
          <p className="stencil text-sm text-foreground">Video Source</p>
          <p className="label-mono mt-0.5 text-xs text-muted-foreground">
            Provide an external URL, upload a file, or both. At least one is required to publish.
          </p>
        </div>
        <div className="space-y-5 p-4">
          {/* External URL */}
          <div>
            <label htmlFor="external_url" className={labelCls}>
              <ExternalLink className="mr-1 inline-block h-3 w-3" />
              External Video URL
            </label>
            <div className="relative">
              <LinkIcon className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground/60" />
              <input
                id="external_url"
                type="url"
                value={externalUrl}
                onChange={(e) => setExternalUrl(e.target.value)}
                placeholder="https://rumble.com/... or https://youtu.be/..."
                className={inputCls + " pl-9"}
              />
            </div>
            <p className="label-mono mt-1 text-[11px] text-muted-foreground">
              YouTube, Rumble, X, Vimeo, or any direct link. Opens in a new tab on /videos.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="h-px flex-1 bg-border" />
            <span className="label-mono text-[11px] uppercase text-muted-foreground">or upload</span>
            <span className="h-px flex-1 bg-border" />
          </div>

          {/* Video file upload */}
          <div>
            <p className={labelCls}>
              <Upload className="mr-1 inline-block h-3 w-3" />
              Upload Video File
            </p>
            <DropZone
              accept="video/mp4,video/webm,video/quicktime,.mov"
              label="Drop video here or click to choose"
              hint="mp4, webm, mov — max 500 MB"
              uploadState={videoUpload}
              fileUrl={videoUrl}
              fileLabel={videoUrl ? videoUrl.split("/").pop() ?? videoUrl : ""}
              previewType="video"
              onFile={handleVideoFile}
              onRemove={() => {
                setVideoUrl("")
                setVideoUpload(initUpload)
                if (videoFileRef.current) videoFileRef.current.value = ""
              }}
              inputRef={videoFileRef}
            />
          </div>
        </div>
      </section>

      {/* ── Thumbnail ── */}
      <section className="border border-border bg-card">
        <div className="border-b border-border px-4 py-3">
          <p className="stencil text-sm text-foreground">Thumbnail</p>
          <p className="label-mono mt-0.5 text-xs text-muted-foreground">
            Optional cover image displayed on the /videos card. Ideal ratio: 16:9.
          </p>
        </div>
        <div className="p-4">
          <DropZone
            accept="image/jpeg,image/jpg,image/png,image/webp"
            label="Drop image here or click to choose"
            hint="jpg, png, webp — max 10 MB"
            uploadState={thumbUpload}
            fileUrl={thumbnailUrl}
            fileLabel={thumbnailUrl ? thumbnailUrl.split("/").pop() ?? thumbnailUrl : ""}
            previewType="image"
            onFile={handleThumbnailFile}
            onRemove={() => {
              setThumbnailUrl("")
              setThumbUpload(initUpload)
              if (thumbFileRef.current) thumbFileRef.current.value = ""
            }}
            inputRef={thumbFileRef}
          />
        </div>
      </section>

      {/* ── Publish + actions ── */}
      <div className="flex flex-col gap-4 border border-border bg-card p-4 sm:flex-row sm:items-center sm:justify-between">
        <label className="flex cursor-pointer select-none items-center gap-3">
          <div
            role="checkbox"
            aria-checked={published}
            tabIndex={0}
            onClick={() => setPublished((p) => !p)}
            onKeyDown={(e) => e.key === " " && setPublished((p) => !p)}
            className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full border transition-colors ${
              published ? "border-primary bg-primary" : "border-border bg-muted"
            }`}
          >
            <span
              className={`absolute left-0.5 h-4 w-4 rounded-full bg-background shadow transition-transform ${
                published ? "translate-x-4" : "translate-x-0"
              }`}
            />
          </div>
          <span className="label-mono text-sm text-foreground">
            {published ? "Published — visible on /videos" : "Draft — hidden from public"}
          </span>
        </label>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.push("/dashboard/videos")}
            className="label-mono border border-border px-4 py-2 text-sm text-muted-foreground hover:border-primary hover:text-foreground transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving || videoUpload.state === "uploading" || thumbUpload.state === "uploading"}
            className="label-mono inline-flex items-center gap-2 bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            {isEditing ? "Save Changes" : "Create Video"}
          </button>
        </div>
      </div>
    </form>
  )
}
