"use client"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { Loader2, Upload, X, Check, AlertCircle, Play, Image as ImageIcon } from "lucide-react"
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
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const [uploadingVideo, setUploadingVideo] = useState(false)
  const [uploadingThumb, setUploadingThumb] = useState(false)
  const [videoUploadError, setVideoUploadError] = useState<string | null>(null)
  const [thumbUploadError, setThumbUploadError] = useState<string | null>(null)

  const videoFileRef = useRef<HTMLInputElement>(null)
  const thumbFileRef = useRef<HTMLInputElement>(null)

  // ---------------------------------------------------------------------------
  // File uploads
  // ---------------------------------------------------------------------------

  async function handleVideoUpload(file: File) {
    setVideoUploadError(null)
    const allowed = ["video/mp4", "video/webm", "video/quicktime", "video/mov"]
    if (!allowed.includes(file.type)) {
      setVideoUploadError("Only mp4, webm, or mov files are allowed.")
      return
    }
    if (file.size > 500 * 1024 * 1024) {
      setVideoUploadError("Video must be under 500 MB.")
      return
    }
    setUploadingVideo(true)
    try {
      const fd = new FormData()
      fd.append("file", file)
      fd.append("folder", "videos")
      const res = await fetch("/api/dashboard/upload", { method: "POST", body: fd })
      const json = await res.json()
      if (!res.ok || json.error) throw new Error(json.error ?? "Upload failed")
      setVideoUrl(json.url)
    } catch (err: any) {
      setVideoUploadError(err.message ?? "Upload failed")
    } finally {
      setUploadingVideo(false)
    }
  }

  async function handleThumbnailUpload(file: File) {
    setThumbUploadError(null)
    const allowed = ["image/jpeg", "image/jpg", "image/png", "image/webp"]
    if (!allowed.includes(file.type)) {
      setThumbUploadError("Only jpg, png, or webp files are allowed.")
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      setThumbUploadError("Thumbnail must be under 10 MB.")
      return
    }
    setUploadingThumb(true)
    try {
      const fd = new FormData()
      fd.append("file", file)
      fd.append("folder", "video-thumbnails")
      const res = await fetch("/api/dashboard/upload", { method: "POST", body: fd })
      const json = await res.json()
      if (!res.ok || json.error) throw new Error(json.error ?? "Upload failed")
      setThumbnailUrl(json.url)
    } catch (err: any) {
      setThumbUploadError(err.message ?? "Upload failed")
    } finally {
      setUploadingThumb(false)
    }
  }

  // ---------------------------------------------------------------------------
  // Submit
  // ---------------------------------------------------------------------------

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSuccess(false)
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
    } catch (err: any) {
      setError(err.message ?? "An error occurred")
    } finally {
      setSaving(false)
    }
  }

  const inputCls =
    "label-mono w-full border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary placeholder:text-muted-foreground/50"
  const labelCls = "label-mono mb-1.5 block text-xs font-semibold uppercase text-muted-foreground"

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Error / success banners */}
      {error && (
        <div className="flex items-center gap-2 border border-destructive/40 bg-destructive/10 px-4 py-3">
          <AlertCircle className="h-4 w-4 shrink-0 text-destructive" />
          <p className="label-mono text-sm text-destructive">{error}</p>
        </div>
      )}
      {success && (
        <div className="flex items-center gap-2 border border-primary/40 bg-primary/10 px-4 py-3">
          <Check className="h-4 w-4 shrink-0 text-primary" />
          <p className="label-mono text-sm text-primary">Video saved successfully.</p>
        </div>
      )}

      {/* Main fields */}
      <div className="border border-border bg-card">
        <div className="border-b border-border px-4 py-3">
          <p className="stencil text-sm text-foreground">Video Details</p>
        </div>
        <div className="space-y-4 p-4">
          {/* Title */}
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

          {/* Description */}
          <div>
            <label htmlFor="description" className={labelCls}>
              Short Description
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief summary displayed on the video card"
              rows={3}
              className={inputCls + " resize-none"}
            />
          </div>

          {/* Category + Date */}
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
                <option value="">Select a category</option>
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
      </div>

      {/* Video source */}
      <div className="border border-border bg-card">
        <div className="border-b border-border px-4 py-3">
          <p className="stencil text-sm text-foreground">Video Source</p>
          <p className="label-mono mt-0.5 text-xs text-muted-foreground">
            Provide either an external URL or upload a video file. At least one is required to publish.
          </p>
        </div>
        <div className="space-y-4 p-4">
          {/* External URL */}
          <div>
            <label htmlFor="external_url" className={labelCls}>
              External Video URL
            </label>
            <input
              id="external_url"
              type="url"
              value={externalUrl}
              onChange={(e) => setExternalUrl(e.target.value)}
              placeholder="https://rumble.com/... or https://youtu.be/..."
              className={inputCls}
            />
            <p className="label-mono mt-1 text-[11px] text-muted-foreground">
              YouTube, Rumble, X, Vimeo, or any direct link. Opens in a new tab.
            </p>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-3">
            <span className="h-px flex-1 bg-border" />
            <span className="label-mono text-[11px] uppercase text-muted-foreground">or</span>
            <span className="h-px flex-1 bg-border" />
          </div>

          {/* Video file upload */}
          <div>
            <label className={labelCls}>Upload Video File</label>
            {videoUrl ? (
              <div className="flex items-center gap-3 border border-border bg-muted/30 px-3 py-2">
                <Play className="h-4 w-4 shrink-0 text-primary" />
                <span className="label-mono flex-1 truncate text-xs text-foreground">
                  {videoUrl.split("/").pop()}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setVideoUrl("")
                    if (videoFileRef.current) videoFileRef.current.value = ""
                  }}
                  className="text-muted-foreground hover:text-foreground"
                  aria-label="Remove video"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <div>
                <button
                  type="button"
                  onClick={() => videoFileRef.current?.click()}
                  disabled={uploadingVideo}
                  className="label-mono flex w-full items-center justify-center gap-2 border border-dashed border-border bg-muted/20 px-4 py-6 text-sm text-muted-foreground transition-colors hover:border-primary hover:text-foreground disabled:opacity-50"
                >
                  {uploadingVideo ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4" />
                      Choose video file (mp4, webm, mov — max 500 MB)
                    </>
                  )}
                </button>
                <input
                  ref={videoFileRef}
                  type="file"
                  accept="video/mp4,video/webm,video/quicktime,.mov"
                  className="sr-only"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) handleVideoUpload(file)
                  }}
                />
              </div>
            )}
            {videoUploadError && (
              <p className="label-mono mt-1 text-xs text-destructive">{videoUploadError}</p>
            )}
          </div>
        </div>
      </div>

      {/* Thumbnail */}
      <div className="border border-border bg-card">
        <div className="border-b border-border px-4 py-3">
          <p className="stencil text-sm text-foreground">Thumbnail</p>
          <p className="label-mono mt-0.5 text-xs text-muted-foreground">
            Optional. Displayed on the video card on the public /videos page.
          </p>
        </div>
        <div className="p-4">
          {thumbnailUrl ? (
            <div className="flex items-start gap-4">
              {/* Preview */}
              <div className="relative aspect-video w-40 overflow-hidden border border-border bg-muted shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={thumbnailUrl}
                  alt="Thumbnail preview"
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="flex flex-col gap-2">
                <p className="label-mono text-xs text-foreground truncate max-w-xs">
                  {thumbnailUrl.split("/").pop()}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setThumbnailUrl("")
                    if (thumbFileRef.current) thumbFileRef.current.value = ""
                  }}
                  className="label-mono flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                >
                  <X className="h-3.5 w-3.5" />
                  Remove
                </button>
              </div>
            </div>
          ) : (
            <div>
              <button
                type="button"
                onClick={() => thumbFileRef.current?.click()}
                disabled={uploadingThumb}
                className="label-mono flex w-full items-center justify-center gap-2 border border-dashed border-border bg-muted/20 px-4 py-6 text-sm text-muted-foreground transition-colors hover:border-primary hover:text-foreground disabled:opacity-50"
              >
                {uploadingThumb ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <ImageIcon className="h-4 w-4" />
                    Choose thumbnail (jpg, png, webp — max 10 MB)
                  </>
                )}
              </button>
              <input
                ref={thumbFileRef}
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp"
                className="sr-only"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) handleThumbnailUpload(file)
                }}
              />
            </div>
          )}
          {thumbUploadError && (
            <p className="label-mono mt-1 text-xs text-destructive">{thumbUploadError}</p>
          )}
        </div>
      </div>

      {/* Publish toggle + submit */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <label className="flex cursor-pointer items-center gap-3">
          <div
            role="checkbox"
            aria-checked={published}
            tabIndex={0}
            onClick={() => setPublished((p) => !p)}
            onKeyDown={(e) => e.key === " " && setPublished((p) => !p)}
            className={`relative inline-flex h-5 w-9 items-center rounded-full border transition-colors ${
              published ? "border-primary bg-primary" : "border-border bg-muted"
            }`}
          >
            <span
              className={`absolute left-0.5 h-4 w-4 rounded-full bg-background transition-transform ${
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
            disabled={saving}
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
