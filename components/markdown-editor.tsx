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
  Eye,
  Pencil,
  Clock,
} from "lucide-react"
import { Markdown } from "@/components/markdown"
import { detectEmbedUrl } from "@/lib/tiptap-embed-utils"
import {
  ALLOWED_IMAGE_TYPES,
  ALLOWED_VIDEO_TYPES,
  MAX_IMAGES,
  MAX_VIDEOS,
  UploadedMedia,
  uploadMediaFile,
  validateMediaFile,
  embedToMarkdownComment,
  iframeToMarkdownComment,
} from "@/lib/media-utils"
import {
  MediaUploadButton,
  MediaPreviewGrid,
} from "@/components/editor/MediaUploadButton"
import { EmbedMediaModal } from "@/components/editor/EmbedMediaModal"

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

// ─── Props ────────────────────────────────────────────────────────────────────

interface MarkdownEditorProps {
  name: string
  id?: string
  defaultValue?: string
  placeholder?: string
  rows?: number
  required?: boolean
  uploadFolder?: "forum" | "blog"
  isSignedIn?: boolean
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
  const [media, setMedia] = useState<UploadedMedia[]>([])
  const [dragOver, setDragOver] = useState(false)
  const stats = calculateStats(value)
  const taRef = useRef<HTMLTextAreaElement>(null)
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

  // ─── Upload logic (inline — manages media[] state and inserts markdown) ───

  const imageDone = media.filter((m) => m.kind === "image" && m.status === "done").length
  const videoDone = media.filter((m) => m.kind === "video" && m.status === "done").length

  async function doUpload(file: File, kind: "image" | "video") {
    const validationError = validateMediaFile(file, kind)
    const errId = crypto.randomUUID()

    if (validationError) {
      setMedia((prev) => [
        ...prev,
        { id: errId, url: "", filename: file.name, size: file.size, kind, status: "error", error: validationError },
      ])
      setTimeout(() => setMedia((prev) => prev.filter((m) => m.id !== errId)), 4000)
      return
    }

    const tempId = crypto.randomUUID()
    setMedia((prev) => [
      ...prev,
      { id: tempId, url: "", filename: file.name, size: file.size, kind, status: "uploading" },
    ])

    try {
      const result = await uploadMediaFile(file, uploadFolder)
      setMedia((prev) =>
        prev.map((m) =>
          m.id === tempId ? { ...m, url: result.url, filename: result.filename, status: "done" } : m,
        ),
      )
      if (kind === "image") {
        insertAtCaret(`\n![uploaded image](${result.url})\n`)
      } else {
        insertAtCaret(`\n![uploaded video](${result.url})\n`)
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : `${kind} upload failed.`
      setMedia((prev) =>
        prev.map((m) => (m.id === tempId ? { ...m, status: "error", error: msg } : m)),
      )
    }
  }

  function handleFiles(files: File[]) {
    for (const file of files) {
      const kind: "image" | "video" = ALLOWED_IMAGE_TYPES.has(file.type) ? "image" : "video"
      if (kind === "image" && imageDone >= MAX_IMAGES) continue
      if (kind === "video" && videoDone >= MAX_VIDEOS) continue
      doUpload(file, kind)
    }
  }

  // Paste images from clipboard
  function onPaste(e: React.ClipboardEvent<HTMLTextAreaElement>) {
    const items = e.clipboardData?.items
    if (!items) return
    const imageFiles: File[] = []
    for (let i = 0; i < items.length; i++) {
      const item = items[i]
      if (item.kind === "file" && item.type.startsWith("image/")) {
        const file = item.getAsFile()
        if (file) imageFiles.push(file)
      }
    }
    if (imageFiles.length > 0) {
      e.preventDefault()
      if (isSignedIn) handleFiles(imageFiles)
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
      if (!isSignedIn) return
      const files = Array.from(e.dataTransfer.files).filter(
        (f) => ALLOWED_IMAGE_TYPES.has(f.type) || ALLOWED_VIDEO_TYPES.has(f.type),
      )
      handleFiles(files)
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [isSignedIn, imageDone, videoDone],
  )

  function removeMedia(id: string) {
    setMedia((prev) => {
      const item = prev.find((m) => m.id === id)
      if (item?.url) {
        setValue((v) =>
          v
            .replace(`\n![uploaded image](${item.url})\n`, "")
            .replace(`![uploaded image](${item.url})`, "")
            .replace(`\n![uploaded video](${item.url})\n`, "")
            .replace(`![uploaded video](${item.url})`, ""),
        )
      }
      return prev.filter((m) => m.id !== id)
    })
  }

  // ─── MediaUploadButton callbacks ──────────────────────────────────────────

  function onImageUploaded(url: string, filename: string) {
    setMedia((prev) => {
      // Mark any uploading entry with this filename as done, or add if missing
      const existing = prev.find((m) => m.filename === filename && m.status === "uploading")
      if (existing) {
        return prev.map((m) =>
          m.id === existing.id ? { ...m, url, status: "done" } : m,
        )
      }
      return [
        ...prev,
        { id: crypto.randomUUID(), url, filename, size: 0, kind: "image", status: "done" },
      ]
    })
    insertAtCaret(`\n![uploaded image](${url})\n`)
  }

  function onVideoUploaded(url: string, filename: string) {
    setMedia((prev) => {
      const existing = prev.find((m) => m.filename === filename && m.status === "uploading")
      if (existing) {
        return prev.map((m) =>
          m.id === existing.id ? { ...m, url, status: "done" } : m,
        )
      }
      return [
        ...prev,
        { id: crypto.randomUUID(), url, filename, size: 0, kind: "video", status: "done" },
      ]
    })
    insertAtCaret(`\n![uploaded video](${url})\n`)
  }

  // ─── EmbedMediaModal callbacks ────────────────────────────────────────────

  function onEmbedImageUrl(url: string) {
    insertAtCaret(`![image](${url})`)
  }

  function onEmbedUrl(embed: ReturnType<typeof detectEmbedUrl>) {
    if (!embed) return
    insertAtCaret(embedToMarkdownComment(embed))
  }

  function onIframeCode(src: string, title: string) {
    insertAtCaret(iframeToMarkdownComment(src, title))
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

  const anyUploading = media.some((m) => m.status === "uploading")

  return (
    <div
      className={`flex flex-col gap-0 border border-border focus-within:border-primary transition-colors ${
        dragOver ? "border-primary bg-primary/5" : ""
      }`}
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
          <div className="flex flex-wrap items-center gap-0 py-1">
            {/* Formatting buttons */}
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

            {/* Divider */}
            <div className="mx-1 h-4 w-px bg-border" />

            {/* Upload Media — single button */}
            <MediaUploadButton
              uploadFolder={uploadFolder}
              isSignedIn={isSignedIn}
              onImageUploaded={onImageUploaded}
              onVideoUploaded={onVideoUploaded}
              media={media}
            />

            {/* Embed Media — single dropdown */}
            <EmbedMediaModal
              onImageUrl={onEmbedImageUrl}
              onEmbedUrl={onEmbedUrl}
              onIframeCode={onIframeCode}
            />
          </div>
        )}
      </div>

      {/* Write area */}
      <div className={tab === "write" ? "relative block" : "hidden"}>
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

      {/* Media thumbnail grid */}
      <MediaPreviewGrid media={media} onRemove={removeMedia} />

      {/* Hint row */}
      {tab === "write" && isSignedIn && !anyUploading && media.length === 0 && (
        <p className="label-mono border-t border-border bg-muted/20 px-4 py-1.5 text-[11px] text-muted-foreground">
          Drag & drop images or videos, paste from clipboard, or use Upload / Embed above.
        </p>
      )}
      {tab === "write" && !isSignedIn && (
        <p className="label-mono border-t border-border bg-muted/20 px-4 py-1.5 text-[11px] text-muted-foreground">
          Sign in to upload images and videos.
        </p>
      )}
    </div>
  )
}
