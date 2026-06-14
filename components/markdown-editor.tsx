"use client"

import { useEffect, useRef, useState } from "react"
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
} from "lucide-react"
import { Markdown } from "@/components/markdown"

interface MarkdownEditorProps {
  name: string
  id?: string
  defaultValue?: string
  placeholder?: string
  rows?: number
  required?: boolean
  // Blob folder for uploaded images ("forum" | "blog"). Defaults to "forum".
  uploadFolder?: "forum" | "blog"
}

// A transform reads the current value + selection and returns the next value
// plus the caret range to restore. All edits flow through React state so the
// controlled <textarea> stays in sync (direct DOM mutation is ignored by React).
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

export function MarkdownEditor({
  name,
  id,
  defaultValue = "",
  placeholder = "Write in Markdown…",
  rows = 8,
  required,
  uploadFolder = "forum",
}: MarkdownEditorProps) {
  const [value, setValue] = useState(defaultValue)
  const [tab, setTab] = useState<"write" | "preview">("write")
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const taRef = useRef<HTMLTextAreaElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  // Caret position to restore after a state-driven edit re-renders the textarea.
  const pendingSelection = useRef<{ start: number; end: number } | null>(null)

  // Restore the caret/selection after value updates from a toolbar or insert action.
  useEffect(() => {
    if (pendingSelection.current && taRef.current) {
      const { start, end } = pendingSelection.current
      taRef.current.focus()
      taRef.current.setSelectionRange(start, end)
      pendingSelection.current = null
    }
  }, [value])

  // Apply an edit transform using the textarea's live selection + current value.
  function applyEdit(fn: (value: string, start: number, end: number) => EditResult) {
    const ta = taRef.current
    const start = ta?.selectionStart ?? value.length
    const end = ta?.selectionEnd ?? value.length
    const result = fn(value, start, end)
    pendingSelection.current = { start: result.selectionStart, end: result.selectionEnd }
    setValue(result.value)
  }

  // Insert text at the current caret, even from async flows (upload/paste) where
  // the textarea may have lost focus. Falls back to appending at the end.
  function insertAtCaret(text: string) {
    const ta = taRef.current
    const start = ta?.selectionStart ?? value.length
    const end = ta?.selectionEnd ?? value.length
    const result = insertText(value, start, end, text)
    pendingSelection.current = { start: result.selectionStart, end: result.selectionEnd }
    setValue(result.value)
  }

  const toolbarActions = [
    { icon: <Bold className="h-3.5 w-3.5" />, label: "Bold", run: () => applyEdit((v, s, e) => wrapText(v, s, e, "**", "**", "bold text")) },
    { icon: <Italic className="h-3.5 w-3.5" />, label: "Italic", run: () => applyEdit((v, s, e) => wrapText(v, s, e, "_", "_", "italic text")) },
    { icon: <Heading2 className="h-3.5 w-3.5" />, label: "Heading", run: () => applyEdit((v, s) => prefixLine(v, s, "## ")) },
    { icon: <List className="h-3.5 w-3.5" />, label: "Bullet list", run: () => applyEdit((v, s) => prefixLine(v, s, "- ")) },
    { icon: <ListOrdered className="h-3.5 w-3.5" />, label: "Numbered list", run: () => applyEdit((v, s) => prefixLine(v, s, "1. ")) },
    { icon: <Quote className="h-3.5 w-3.5" />, label: "Blockquote", run: () => applyEdit((v, s) => prefixLine(v, s, "> ")) },
    { icon: <Code className="h-3.5 w-3.5" />, label: "Inline code", run: () => applyEdit((v, s, e) => wrapText(v, s, e, "`", "`", "code")) },
    { icon: <Link2 className="h-3.5 w-3.5" />, label: "Link", run: () => applyEdit((v, s, e) => wrapText(v, s, e, "[", "](https://)", "link title")) },
    {
      icon: <Image className="h-3.5 w-3.5" />,
      label: "Image URL",
      run: () => {
        const url = prompt("Image URL:")
        if (url) insertAtCaret(`![image](${url})`)
      },
    },
  ]

  async function handleFileUpload(file: File) {
    setUploadError(null)
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append("file", file)
      fd.append("folder", uploadFolder)
      const res = await fetch("/api/upload", { method: "POST", body: fd })
      const json = await res.json()
      if (!res.ok || json.error) throw new Error(json.error ?? "Upload failed")
      insertAtCaret(`![${file.name}](${json.url})`)
    } catch (err: unknown) {
      setUploadError(err instanceof Error ? err.message : "Upload failed")
    } finally {
      setUploading(false)
    }
  }

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) handleFileUpload(file)
    e.target.value = ""
  }

  // Paste-to-upload for images copied to the clipboard.
  function onPaste(e: React.ClipboardEvent<HTMLTextAreaElement>) {
    const items = e.clipboardData?.items
    if (!items) return
    for (let i = 0; i < items.length; i++) {
      const item = items[i]
      if (item.kind === "file" && item.type.startsWith("image/")) {
        e.preventDefault()
        const file = item.getAsFile()
        if (file) handleFileUpload(file)
        break
      }
    }
  }

  return (
    <div className="flex flex-col gap-0 border border-border focus-within:border-primary">
      {/* Tab bar + toolbar */}
      <div className="flex items-center justify-between border-b border-border bg-muted/40 px-1">
        <div className="flex">
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
            <button
              type="button"
              title="Upload image or video"
              disabled={uploading}
              onClick={() => fileRef.current?.click()}
              className="flex items-center justify-center p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-50"
            >
              {uploading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Upload className="h-3.5 w-3.5" />
              )}
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*,video/*"
              className="hidden"
              onChange={onFileChange}
            />
          </div>
        )}
      </div>

      {/* Write area — always mounted so the ref/selection persist across tab switches */}
      <div className={tab === "write" ? "block" : "hidden"}>
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

      {/* Upload progress / error */}
      {uploading ? (
        <p className="label-mono flex items-center gap-2 border-t border-border px-4 py-2 text-muted-foreground">
          <Loader2 className="h-3.5 w-3.5 animate-spin" /> Uploading…
        </p>
      ) : null}
      {uploadError ? (
        <p className="label-mono border-t border-destructive/40 px-4 py-2 text-destructive">
          {uploadError}
        </p>
      ) : null}
    </div>
  )
}
