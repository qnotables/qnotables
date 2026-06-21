"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import {
  Bold,
  Italic,
  Heading2,
  List,
  ListOrdered,
  Quote,
  Code,
  Link2,
  Image,
  Upload,
  Eye,
  Pencil,
  Loader2,
  Clock,
  X,
  CheckCircle2,
  AlertCircle,
  ChevronDown,
  Video,
} from "lucide-react"
import { Markdown } from "@/components/markdown"

// ─── Constants ────────────────────────────────────────────────────────────────

const MAX_IMAGES = 5
const MAX_BYTES = 5 * 1024 * 1024 // 5 MB for images
const MAX_VIDEOS = 3
const MAX_VIDEO_BYTES = 500 * 1024 * 1024 // 500 MB for videos
const ALLOWED_IMAGE_TYPES = new Set(["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"])
const ALLOWED_VIDEO_TYPES = new Set(["video/mp4", "video/webm", "video/quicktime", "video/mov"])
const ALLOWED_IMAGE_EXTS = /\.(jpg|jpeg|png|webp|gif)$/i
const ALLOWED_VIDEO_EXTS = /\.(mp4|webm|mov)$/i

// ─── Types ────────────────────────────────────────────────────────────────────

interface UploadedImage {
  id: string
  url: string
  filename: string
  size: number
  status: "uploading" | "done" | "error"
  error?: string
}

interface UploadedVideo {
  id: string
  url: string
  filename: string
  size: number
  status: "uploading" | "done" | "error"
  error?: string
}

interface MarkdownEditorProps {
  name: string
  id?: string
  defaultValue?: string
  placeholder?: string
  rows?: number
  required?: boolean
  uploadFolder?: "forum" | "blog"
  /** Pass false when the user is not signed in to disable image uploads. */
  isSignedIn?: boolean
}

// ─── Stats ────────────────────────────────────────────────────────────────────

function calculateStats(text: string) {
  const trimmed = text.trim()
  const words = trimmed.length === 0 ? 0 : trimmed.split(/\s+/).length
  return {
    words,
    characters: trimmed.length,
    readingTime: Math.max(1, Math.round(words / 180)),
  }
}

// ─── Edit helpers ─────────────────────────────────────────────────────────────

type EditResult = { value: string; selectionStart: number; selectionEnd: number }

function wrapText(
  value: string,
  start: number,
  end: number,
  before: string,
  after: string,
  placeholder = "",
): EditResult {
  const selected = value.slice(start, end) || placeholder
  const next = value.slice(0, start) + before + selected + after + value.slice(end)
  return {
    value: next,
    selectionStart: start + before.length,
    selectionEnd: start + before.length + selected.length,
  }
}

function prefixLine(value: string, start: number, prefix: string): EditResult {
  const lineStart = value.lastIndexOf("\n", start - 1) + 1
  const next = value.slice(0, lineStart) + prefix + value.slice(lineStart)
  const caret = start + prefix.length
  return { value: next, selectionStart: caret, selectionEnd: caret }
}

function insertText(value: string, start: number, end: number, text: string): EditResult {
  const next = value.slice(0, start) + text + value.slice(end)
  const caret = start + text.length
  return { value: next, selectionStart: caret, selectionEnd: caret }
}

// ─── Validation ───────────────────────────────────────────────────────────────

function validateFile(file: File, type: "image" | "video"): string | null {
  if (type === "image") {
    if (!ALLOWED_IMAGE_TYPES.has(file.type)) return "Only JPG, PNG, WEBP, and GIF images are allowed."
    if (file.size > MAX_BYTES) return "Image must be 5 MB or smaller."
    const ext = "." + (file.name.split(".").pop() ?? "")
    if (!ALLOWED_IMAGE_EXTS.test(ext)) return "Only JPG, PNG, WEBP, and GIF images are allowed."
  } else {
    if (!ALLOWED_VIDEO_TYPES.has(file.type)) return "Only MP4, WEBM, and MOV videos are allowed."
    if (file.size > MAX_VIDEO_BYTES) return "Video must be 500 MB or smaller."
    const ext = "." + (file.name.split(".").pop() ?? "")
    if (!ALLOWED_VIDEO_EXTS.test(ext)) return "Only MP4, WEBM, and MOV videos are allowed."
  }
  return null
}

// ─── Image Preview Grid ───────────────────────────────────────────────────────

function ImagePreviewGrid({
  images,
  onRemove,
}: {
  images: UploadedImage[]
  onRemove: (id: string) => void
}) {
  if (images.length === 0) return null

  return (
    <div className="flex flex-wrap gap-2 border-t border-border bg-muted/30 p-3">
      {images.map((img) => (
        <div
          key={img.id}
          className="group relative h-16 w-16 flex-shrink-0 overflow-hidden border border-border bg-background"
        >
          {img.status === "uploading" ? (
            <div className="flex h-full w-full items-center justify-center">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : img.status === "error" ? (
            <div className="flex h-full w-full flex-col items-center justify-center gap-1 px-1">
              <AlertCircle className="h-4 w-4 flex-shrink-0 text-destructive" />
              <span className="label-mono text-center text-[9px] leading-tight text-destructive">
                {img.error ?? "Error"}
              </span>
            </div>
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={img.url}
              alt={img.filename}
              className="h-full w-full object-cover opacity-90 group-hover:opacity-100"
            />
          )}

          {/* Status overlay for done */}
          {img.status === "done" && (
            <div className="absolute bottom-0.5 right-0.5">
              <CheckCircle2 className="h-3 w-3 text-green-400 drop-shadow" />
            </div>
          )}

          {/* Remove button */}
          <button
            type="button"
            onClick={() => onRemove(img.id)}
            className="absolute right-0 top-0 hidden p-0.5 group-hover:block bg-background/80 hover:bg-destructive hover:text-white text-muted-foreground transition-colors"
            aria-label="Remove image"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      ))}

      <span className="label-mono self-end text-[10px] text-muted-foreground">
        {images.filter((i) => i.status === "done").length}/{MAX_IMAGES} images
      </span>
    </div>
  )
}

// ─── Video Preview Grid ───────────────────────────────────────────────────

function VideoPreviewGrid({
  videos,
  onRemove,
}: {
  videos: UploadedVideo[]
  onRemove: (id: string) => void
}) {
  if (videos.length === 0) return null

  return (
    <div className="flex flex-wrap gap-2 border-t border-border bg-muted/30 p-3">
      {videos.map((vid) => (
        <div
          key={vid.id}
          className="group relative h-16 w-16 flex-shrink-0 overflow-hidden border border-border bg-background flex items-center justify-center"
        >
          {vid.status === "uploading" ? (
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          ) : vid.status === "error" ? (
            <div className="flex h-full w-full flex-col items-center justify-center gap-1 px-1">
              <AlertCircle className="h-4 w-4 flex-shrink-0 text-destructive" />
              <span className="label-mono text-center text-[9px] leading-tight text-destructive">
                {vid.error ?? "Error"}
              </span>
            </div>
          ) : (
            <div className="flex items-center justify-center gap-1">
              <Video className="h-4 w-4 text-muted-foreground" />
            </div>
          )}

          {/* Status overlay for done */}
          {vid.status === "done" && (
            <div className="absolute bottom-0.5 right-0.5">
              <CheckCircle2 className="h-3 w-3 text-green-400 drop-shadow" />
            </div>
          )}

          {/* Remove button */}
          <button
            type="button"
            onClick={() => onRemove(vid.id)}
            className="absolute right-0 top-0 hidden p-0.5 group-hover:block bg-background/80 hover:bg-destructive hover:text-white text-muted-foreground transition-colors"
            aria-label="Remove video"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      ))}

      <span className="label-mono self-end text-[10px] text-muted-foreground">
        {videos.filter((v) => v.status === "done").length}/{MAX_VIDEOS} videos
      </span>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function MarkdownEditor({
  name,
  id,
  defaultValue = "",
  placeholder = "Write in Markdown…",
  rows = 8,
  required,
  uploadFolder = "forum",
  isSignedIn = true,
}: MarkdownEditorProps) {
  const [value, setValue] = useState(defaultValue)
  const [tab, setTab] = useState<"write" | "preview">("write")
  const [images, setImages] = useState<UploadedImage[]>([])
  const [videos, setVideos] = useState<UploadedVideo[]>([])
  const [dragOver, setDragOver] = useState(false)
  const [showImageMenu, setShowImageMenu] = useState(false)
  const stats = calculateStats(value)
  const taRef = useRef<HTMLTextAreaElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const videoFileRef = useRef<HTMLInputElement>(null)
  const imageMenuRef = useRef<HTMLDivElement>(null)
  const pendingSelection = useRef<{ start: number; end: number } | null>(null)

  // Restore caret after React re-render from state-driven edits
  useEffect(() => {
    if (pendingSelection.current && taRef.current) {
      const { start, end } = pendingSelection.current
      taRef.current.focus()
      taRef.current.setSelectionRange(start, end)
      pendingSelection.current = null
    }
  }, [value])

  // Close image menu on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (imageMenuRef.current && !imageMenuRef.current.contains(e.target as Node)) {
        setShowImageMenu(false)
      }
    }
    if (showImageMenu) document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [showImageMenu])

  function applyEdit(fn: (value: string, start: number, end: number) => EditResult) {
    const ta = taRef.current
    const start = ta?.selectionStart ?? value.length
    const end = ta?.selectionEnd ?? value.length
    const result = fn(value, start, end)
    pendingSelection.current = { start: result.selectionStart, end: result.selectionEnd }
    setValue(result.value)
  }

  function insertAtCaret(text: string) {
    const ta = taRef.current
    const start = ta?.selectionStart ?? value.length
    const end = ta?.selectionEnd ?? value.length
    const result = insertText(value, start, end, text)
    pendingSelection.current = { start: result.selectionStart, end: result.selectionEnd }
    setValue(result.value)
  }

  // ─── Upload logic ─────────────────────────────────────────────────────────

  const doneImageCount = images.filter((i) => i.status === "done").length
  const doneVideoCount = videos.filter((v) => v.status === "done").length
  const canUploadImage = isSignedIn && doneImageCount < MAX_IMAGES
  const canUploadVideo = isSignedIn && doneVideoCount < MAX_VIDEOS

  async function uploadFile(file: File, type: "image" | "video") {
    const validationError = validateFile(file, type)
    if (validationError) {
      const errId = crypto.randomUUID()
      if (type === "image") {
        setImages((prev) => [...prev, { id: errId, url: "", filename: file.name, size: file.size, status: "error", error: validationError }])
      } else {
        setVideos((prev) => [...prev, { id: errId, url: "", filename: file.name, size: file.size, status: "error", error: validationError }])
      }
      setTimeout(() => {
        if (type === "image") {
          setImages((prev) => prev.filter((i) => i.id !== errId))
        } else {
          setVideos((prev) => prev.filter((v) => v.id !== errId))
        }
      }, 4000)
      return
    }

    const tempId = crypto.randomUUID()
    if (type === "image" && doneImageCount >= MAX_IMAGES) return
    if (type === "video" && doneVideoCount >= MAX_VIDEOS) return

    if (type === "image") {
      setImages((prev) => [...prev, { id: tempId, url: "", filename: file.name, size: file.size, status: "uploading" }])
    } else {
      setVideos((prev) => [...prev, { id: tempId, url: "", filename: file.name, size: file.size, status: "uploading" }])
    }

    try {
      const fd = new FormData()
      fd.append("file", file)
      fd.append("folder", uploadFolder)
      const res = await fetch("/api/upload", { method: "POST", body: fd })
      const json = await res.json()

      if (!res.ok || !json.success) {
        throw new Error(json.error ?? `${type} upload failed.`)
      }

      if (type === "image") {
        setImages((prev) => prev.map((i) => (i.id === tempId ? { ...i, url: json.url, filename: json.filename, status: "done" } : i)))
        insertAtCaret(`\n![uploaded image](${json.url})\n`)
      } else {
        setVideos((prev) => prev.map((v) => (v.id === tempId ? { ...v, url: json.url, filename: json.filename, status: "done" } : v)))
        insertAtCaret(`\n![uploaded video](${json.url})\n`)
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : `${type} upload failed.`
      if (type === "image") {
        setImages((prev) => prev.map((i) => (i.id === tempId ? { ...i, status: "error", error: msg } : i)))
      } else {
        setVideos((prev) => prev.map((v) => (v.id === tempId ? { ...v, status: "error", error: msg } : v)))
      }
    }
  }

  function handleImageFiles(files: FileList | File[]) {
    const arr = Array.from(files).filter((f) => ALLOWED_IMAGE_TYPES.has(f.type))
    const remaining = MAX_IMAGES - doneImageCount
    arr.slice(0, remaining).forEach((f) => uploadFile(f, "image"))
  }

  function handleVideoFiles(files: FileList | File[]) {
    const arr = Array.from(files).filter((f) => ALLOWED_VIDEO_TYPES.has(f.type))
    const remaining = MAX_VIDEOS - doneVideoCount
    arr.slice(0, remaining).forEach((f) => uploadFile(f, "video"))
  }

  function onImageFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files) handleImageFiles(e.target.files)
    e.target.value = ""
  }

  function onVideoFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files) handleVideoFiles(e.target.files)
    e.target.value = ""
  }

  // Paste images from clipboard
  function onPaste(e: React.ClipboardEvent<HTMLTextAreaElement>) {
    const items = e.clipboardData?.items
    if (!items) return
    for (let i = 0; i < items.length; i++) {
      const item = items[i]
      if (item.kind === "file" && item.type.startsWith("image/")) {
        e.preventDefault()
        const file = item.getAsFile()
        if (file && canUploadImage) uploadFile(file, "image")
        break
      }
    }
  }

  // Drag-and-drop
  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(true)
  }, [])

  const onDragLeave = useCallback(() => setDragOver(false), [])

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setDragOver(false)
      const files = e.dataTransfer.files
      if (!files.length) return
      const imageFiles = Array.from(files).filter((f) => ALLOWED_IMAGE_TYPES.has(f.type))
      const videoFiles = Array.from(files).filter((f) => ALLOWED_VIDEO_TYPES.has(f.type))
      if (imageFiles.length && canUploadImage) handleImageFiles(imageFiles)
      if (videoFiles.length && canUploadVideo) handleVideoFiles(videoFiles)
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [canUploadImage, canUploadVideo, doneImageCount, doneVideoCount],
  )

  function removeImage(imgId: string) {
    setImages((prev) => {
      const img = prev.find((i) => i.id === imgId)
      if (img?.url) {
        setValue((v) => v.replace(`\n![uploaded image](${img.url})\n`, "").replace(`![uploaded image](${img.url})`, ""))
      }
      return prev.filter((i) => i.id !== imgId)
    })
  }

  function removeVideo(vidId: string) {
    setVideos((prev) => {
      const vid = prev.find((v) => v.id === vidId)
      if (vid?.url) {
        setValue((v) => v.replace(`\n![uploaded video](${vid.url})\n`, "").replace(`![uploaded video](${vid.url})`, ""))
      }
      return prev.filter((v) => v.id !== vidId)
    })
  }

  // ─── Image button handler ─────────────────────────────────────────────────

  function handleImageUrlPaste() {
    setShowImageMenu(false)
    const url = prompt("Image URL (must end in .jpg, .jpeg, .png, .webp, or .gif):")
    if (!url) return
    const trimmed = url.trim()
    if (!/^https?:\/\//i.test(trimmed)) {
      alert("URL must start with http:// or https://")
      return
    }
    if (!/\.(jpg|jpeg|png|webp|gif)(\?.*)?$/i.test(trimmed)) {
      alert("URL must end in .jpg, .jpeg, .png, .webp, or .gif")
      return
    }
    insertAtCaret(`![image](${trimmed})`)
  }

  // ─── Toolbar actions ──────────────────────────────────────────────────────

  const toolbarActions = [
    {
      icon: <Bold className="h-3.5 w-3.5" />,
      label: "Bold",
      run: () => applyEdit((v, s, e) => wrapText(v, s, e, "**", "**", "bold text")),
    },
    {
      icon: <Italic className="h-3.5 w-3.5" />,
      label: "Italic",
      run: () => applyEdit((v, s, e) => wrapText(v, s, e, "_", "_", "italic text")),
    },
    {
      icon: <Heading2 className="h-3.5 w-3.5" />,
      label: "Heading",
      run: () => applyEdit((v, s) => prefixLine(v, s, "## ")),
    },
    {
      icon: <List className="h-3.5 w-3.5" />,
      label: "Bullet list",
      run: () => applyEdit((v, s) => prefixLine(v, s, "- ")),
    },
    {
      icon: <ListOrdered className="h-3.5 w-3.5" />,
      label: "Numbered list",
      run: () => applyEdit((v, s) => prefixLine(v, s, "1. ")),
    },
    {
      icon: <Quote className="h-3.5 w-3.5" />,
      label: "Blockquote",
      run: () => applyEdit((v, s) => prefixLine(v, s, "> ")),
    },
    {
      icon: <Code className="h-3.5 w-3.5" />,
      label: "Inline code",
      run: () => applyEdit((v, s, e) => wrapText(v, s, e, "`", "`", "code")),
    },
    {
      icon: <Link2 className="h-3.5 w-3.5" />,
      label: "Link",
      run: () => {
        const url = prompt("Link URL (e.g. https://example.com):")
        if (url) applyEdit((v, s, e) => wrapText(v, s, e, "[", `](${url})`, "link text"))
      },
    },
  ]

  const anyUploading = images.some((i) => i.status === "uploading")

  return (
    <div
      className={`flex flex-col gap-0 border border-border focus-within:border-primary transition-colors ${dragOver ? "border-primary bg-primary/5" : ""}`}
      onDragOver={tab === "write" ? onDragOver : undefined}
      onDragLeave={tab === "write" ? onDragLeave : undefined}
      onDrop={tab === "write" ? onDrop : undefined}
    >
      {/* Tab bar + toolbar */}
      <div className="flex items-center justify-between border-b border-border bg-muted/40 px-1">
        <div className="flex items-center gap-0">
          {(["write", "preview"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`label-mono flex items-center gap-1.5 px-3 py-2 transition-colors ${
                tab === t
                  ? "border-b-2 border-primary text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {t === "write" ? <Pencil className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
              {t}
            </button>
          ))}
          {/* Stats */}
          <div className="label-mono ml-2 flex items-center gap-3 px-3 py-2 text-xs text-muted-foreground">
            <span title="Word count">{stats.words}w</span>
            <span className="flex items-center gap-1" title="Reading time">
              <Clock className="h-3 w-3" /> {stats.readingTime}min
            </span>
          </div>
        </div>

        {tab === "write" && (
          <div className="flex flex-wrap items-center gap-0.5 py-1">
            {toolbarActions.map((a) => (
              <button
                key={a.label}
                type="button"
                title={a.label}
                onClick={a.run}
                className="flex items-center justify-center p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                {a.icon}
              </button>
            ))}

            {/* Image button with sub-menu */}
            <div className="relative" ref={imageMenuRef}>
              <button
                type="button"
                title="Image"
                onClick={() => setShowImageMenu((v) => !v)}
                className="flex items-center gap-0.5 p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <Image className="h-3.5 w-3.5" />
                <ChevronDown className="h-2.5 w-2.5" />
              </button>

              {showImageMenu && (
                <div className="absolute right-0 top-full z-50 mt-1 w-44 border border-border bg-background shadow-lg">
                  {/* Upload option */}
                  {isSignedIn ? (
                    <button
                      type="button"
                      disabled={!canUpload || anyUploading}
                      onClick={() => { setShowImageMenu(false); fileRef.current?.click() }}
                      className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <Upload className="h-3.5 w-3.5" />
                      {canUpload ? `Upload image (${doneCount}/${MAX_IMAGES})` : "Limit reached"}
                    </button>
                  ) : (
                    <div className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground">
                      <Upload className="h-3.5 w-3.5" />
                      Sign in to upload
                    </div>
                  )}

                  <div className="h-px bg-border" />

                  {/* Paste URL option */}
                  <button
                    type="button"
                    onClick={handleImageUrlPaste}
                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-foreground transition-colors hover:bg-muted"
                  >
                    <Link2 className="h-3.5 w-3.5" />
                    Paste image URL
                  </button>
                </div>
              )}
            </div>

            {/* Direct image upload button */}
            {isSignedIn && (
              <button
                type="button"
                title={canUploadImage ? "Upload image" : `Image limit reached (${MAX_IMAGES})`}
                disabled={!canUploadImage || anyUploading}
                onClick={() => fileRef.current?.click()}
                className="flex items-center justify-center p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40"
              >
                {anyUploading ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Upload className="h-3.5 w-3.5" />
                )}
              </button>
            )}

            {/* Video upload button */}
            {isSignedIn && (
              <button
                type="button"
                title={canUploadVideo ? "Upload video" : `Video limit reached (${MAX_VIDEOS})`}
                disabled={!canUploadVideo || anyUploading}
                onClick={() => videoFileRef.current?.click()}
                className="flex items-center justify-center p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Video className="h-3.5 w-3.5" />
              </button>
            )}

            <input
              ref={fileRef}
              type="file"
              accept=".jpg,.jpeg,.png,.webp,.gif,image/jpeg,image/png,image/webp,image/gif"
              multiple
              className="hidden"
              onChange={onImageFileChange}
            />

            <input
              ref={videoFileRef}
              type="file"
              accept=".mp4,.webm,.mov,video/mp4,video/webm,video/quicktime"
              className="hidden"
              onChange={onVideoFileChange}
            />
          </div>
        )}
      </div>

      {/* Write area */}
      <div className={tab === "write" ? "relative block" : "hidden"}>
        {/* Drag-over overlay */}
        {dragOver && (
          <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center border-2 border-dashed border-primary bg-primary/10">
            <p className="label-mono text-sm font-semibold text-primary">Drop image or video to upload</p>
          </div>
        )}
        <textarea
          ref={taRef}
          id={id}
          name={name}
          required={required}
          value={value}
          rows={rows}
          placeholder={placeholder}
          onChange={(e) => setValue(e.target.value)}
          onPaste={onPaste}
          className="w-full resize-y bg-background px-4 py-3 font-mono text-sm leading-relaxed text-foreground outline-none placeholder:text-muted-foreground"
        />
      </div>

      {/* Preview area */}
      {tab === "preview" && (
        <div className="min-h-[120px] bg-background px-4 py-3">
          {value.trim() ? (
            <Markdown content={value} />
          ) : (
            <p className="label-mono text-muted-foreground">Nothing to preview yet.</p>
          )}
        </div>
      )}

      {/* Uploaded image preview grid */}
      <ImagePreviewGrid images={images} onRemove={removeImage} />

      {/* Uploaded video preview grid */}
      <VideoPreviewGrid videos={videos} onRemove={removeVideo} />

      {/* Drag hint when empty and signed in */}
      {tab === "write" && isSignedIn && canUpload && images.length === 0 && (
        <p className="label-mono border-t border-border bg-muted/20 px-4 py-1.5 text-[11px] text-muted-foreground">
          Drag and drop images here, or use the upload button. Max {MAX_IMAGES} images, 5 MB each.
        </p>
      )}

      {/* Not signed in hint */}
      {tab === "write" && !isSignedIn && (
        <p className="label-mono border-t border-border bg-muted/20 px-4 py-1.5 text-[11px] text-muted-foreground">
          Sign in to upload images.
        </p>
      )}
    </div>
  )
}
