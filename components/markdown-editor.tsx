"use client"

import { useRef, useState } from "react"
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
}

type ToolbarAction = {
  icon: React.ReactNode
  label: string
  action: (textarea: HTMLTextAreaElement) => void
}

function wrap(ta: HTMLTextAreaElement, before: string, after: string, placeholder = "") {
  const { selectionStart: s, selectionEnd: e, value } = ta
  const selected = value.slice(s, e) || placeholder
  const next = value.slice(0, s) + before + selected + after + value.slice(e)
  ta.value = next
  ta.selectionStart = s + before.length
  ta.selectionEnd = s + before.length + selected.length
  ta.focus()
  ta.dispatchEvent(new Event("input", { bubbles: true }))
}

function insertLine(ta: HTMLTextAreaElement, prefix: string) {
  const { selectionStart: s, value } = ta
  const lineStart = value.lastIndexOf("\n", s - 1) + 1
  const before = value.slice(0, lineStart)
  const after = value.slice(lineStart)
  ta.value = before + prefix + after
  ta.selectionStart = ta.selectionEnd = lineStart + prefix.length + (s - lineStart)
  ta.focus()
  ta.dispatchEvent(new Event("input", { bubbles: true }))
}

function insertAtCursor(ta: HTMLTextAreaElement, text: string) {
  const { selectionStart: s, value } = ta
  ta.value = value.slice(0, s) + text + value.slice(s)
  ta.selectionStart = ta.selectionEnd = s + text.length
  ta.focus()
  ta.dispatchEvent(new Event("input", { bubbles: true }))
}

export function MarkdownEditor({
  name,
  id,
  defaultValue = "",
  placeholder = "Write in Markdown…",
  rows = 8,
  required,
}: MarkdownEditorProps) {
  const [value, setValue] = useState(defaultValue)
  const [tab, setTab] = useState<"write" | "preview">("write")
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const taRef = useRef<HTMLTextAreaElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const toolbarActions: ToolbarAction[] = [
    {
      icon: <Bold className="h-3.5 w-3.5" />,
      label: "Bold",
      action: (ta) => wrap(ta, "**", "**", "bold text"),
    },
    {
      icon: <Italic className="h-3.5 w-3.5" />,
      label: "Italic",
      action: (ta) => wrap(ta, "_", "_", "italic text"),
    },
    {
      icon: <Heading2 className="h-3.5 w-3.5" />,
      label: "Heading",
      action: (ta) => insertLine(ta, "## "),
    },
    {
      icon: <List className="h-3.5 w-3.5" />,
      label: "Bullet list",
      action: (ta) => insertLine(ta, "- "),
    },
    {
      icon: <ListOrdered className="h-3.5 w-3.5" />,
      label: "Numbered list",
      action: (ta) => insertLine(ta, "1. "),
    },
    {
      icon: <Quote className="h-3.5 w-3.5" />,
      label: "Blockquote",
      action: (ta) => insertLine(ta, "> "),
    },
    {
      icon: <Code className="h-3.5 w-3.5" />,
      label: "Inline code",
      action: (ta) => wrap(ta, "`", "`", "code"),
    },
    {
      icon: <Link2 className="h-3.5 w-3.5" />,
      label: "Link",
      action: (ta) => wrap(ta, "[", "](https://)", "link title"),
    },
    {
      icon: <Image className="h-3.5 w-3.5" />,
      label: "Image URL",
      action: (ta) => {
        const url = prompt("Image URL:")
        if (url) insertAtCursor(ta, `![image](${url})`)
      },
    },
  ]

  async function handleFileUpload(file: File) {
    setUploadError(null)
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append("file", file)
      const res = await fetch("/api/upload", { method: "POST", body: fd })
      const json = await res.json()
      if (!res.ok || json.error) throw new Error(json.error ?? "Upload failed")
      if (taRef.current) {
        insertAtCursor(taRef.current, `![${file.name}](${json.url})`)
      }
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

  // Allow paste-to-upload for images
  function onPaste(e: React.ClipboardEvent<HTMLTextAreaElement>) {
    const items = e.clipboardData?.items
    if (!items) return
    
    for (let i = 0; i < items.length; i++) {
      const item = items[i]
      
      // Skip non-file items
      if (item.kind !== "file") continue
      
      // Check if it's an image
      if (item.type.startsWith("image/")) {
        e.preventDefault()
        try {
          const file = item.getAsFile()
          if (file) {
            handleFileUpload(file)
          }
        } catch (err) {
          setUploadError("Failed to access pasted image")
        }
        break
      }
    }
  }

  return (
    <div className="flex flex-col gap-0 border border-border focus-within:border-primary">
      {/* Tab bar + toolbar */}
      <div className="flex items-center justify-between border-b border-border bg-muted/40 px-1">
        {/* Write / Preview tabs */}
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

        {/* Toolbar (only in write mode) */}
        {tab === "write" && (
          <div className="flex flex-wrap items-center gap-0.5 py-1">
            {toolbarActions.map((a) => (
              <button
                key={a.label}
                type="button"
                title={a.label}
                onClick={() => taRef.current && a.action(taRef.current)}
                className="flex items-center justify-center p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                {a.icon}
              </button>
            ))}
            {/* Upload image from device */}
            <button
              type="button"
              title="Upload image"
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
              accept="image/*"
              className="hidden"
              onChange={onFileChange}
            />
          </div>
        )}
      </div>

      {/* Write area */}
      {tab === "write" ? (
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
      ) : (
        /* Preview area */
        <div className="min-h-[120px] bg-background px-4 py-3">
          {value.trim() ? (
            <Markdown content={value} />
          ) : (
            <p className="label-mono text-muted-foreground">Nothing to preview yet.</p>
          )}
        </div>
      )}

      {/* Upload error */}
      {uploadError ? (
        <p className="label-mono border-t border-destructive/40 px-4 py-2 text-destructive">
          {uploadError}
        </p>
      ) : null}

      {/* Hidden textarea carries value when using preview tab (for form submission) */}
      {tab === "preview" && (
        <textarea name={name} required={required} value={value} readOnly className="hidden" />
      )}
      
      {/* Hidden input ensures value is always available in form data on write tab */}
      {tab === "write" && (
        <input type="hidden" name={name} value={value} />
      )}
    </div>
  )
}
