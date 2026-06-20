"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { useEditor, EditorContent, NodeViewWrapper, ReactNodeViewRenderer } from "@tiptap/react"
import { Node as TiptapNode, mergeAttributes } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import Image from "@tiptap/extension-image"
import Link from "@tiptap/extension-link"
import Placeholder from "@tiptap/extension-placeholder"
import Underline from "@tiptap/extension-underline"
import TextAlign from "@tiptap/extension-text-align"
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Code2,
  Link2,
  ImageIcon,
  Upload,
  Loader2,
  X,
  Eye,
  Pencil,
  Minus,
  AlignLeft,
  AlignCenter,
  AlignRight,
  CheckCircle2,
  AlertCircle,
  Clock,
  Film,
  ExternalLink,
} from "lucide-react"
import { detectEmbedUrl, type EmbedData } from "@/lib/tiptap-embed-utils"

// ─── Constants ────────────────────────────────────────────────────────────────

const MAX_IMAGES = 10
const MAX_BYTES = 10 * 1024 * 1024
const ALLOWED_IMAGE_TYPES = new Set(["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"])

// ─── Types ────────────────────────────────────────────────────────────────────

interface UploadedImage {
  id: string
  url: string
  filename: string
  status: "uploading" | "done" | "error"
  error?: string
}

export interface TiptapEditorProps {
  /** Hidden input name — serialized JSON is posted under this key */
  name: string
  id?: string
  defaultValue?: string
  placeholder?: string
  required?: boolean
  uploadFolder?: "forum" | "blog"
  isSignedIn?: boolean
  /** Called whenever editor content changes (JSON string) */
  onChange?: (json: string) => void
}

// ─── EmbedBlock Node ──────────────────────────────────────────────────────────

function EmbedBlockView({ node, deleteNode }: {
  node: { attrs: { provider: string; embedUrl: string; title: string; originalUrl: string } }
  deleteNode: () => void
}) {
  const { provider, embedUrl, title, originalUrl } = node.attrs
  const isX = provider === "x"
  const isInstagram = provider === "instagram"

  return (
    <NodeViewWrapper className="embed-block-wrapper my-4 select-none" contentEditable={false}>
      <div className="relative overflow-hidden border border-border bg-card">
        {/* Header bar */}
        <div className="flex items-center justify-between border-b border-border bg-muted/60 px-3 py-1.5">
          <div className="flex items-center gap-2">
            <Film className="h-3.5 w-3.5 text-primary" />
            <span className="label-mono text-xs text-muted-foreground">
              {provider.toUpperCase()} EMBED
            </span>
            {title && <span className="label-mono truncate text-xs text-foreground">{title}</span>}
          </div>
          <div className="flex items-center gap-1">
            <a
              href={originalUrl}
              target="_blank"
              rel="noopener noreferrer nofollow"
              onClick={(e) => e.stopPropagation()}
              className="inline-flex items-center gap-1 px-1.5 py-0.5 text-muted-foreground hover:text-foreground transition-colors"
              title="Open original"
            >
              <ExternalLink className="h-3 w-3" />
            </a>
            <button
              type="button"
              onClick={deleteNode}
              className="inline-flex items-center gap-1 px-1.5 py-0.5 text-muted-foreground hover:text-destructive transition-colors"
              title="Remove embed"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        </div>

        {/* X / Twitter — no iframe support; show link card */}
        {isX ? (
          <div className="flex flex-col items-center gap-3 px-6 py-6">
            <p className="label-mono text-sm text-muted-foreground">X / Twitter post</p>
            <a
              href={originalUrl}
              target="_blank"
              rel="noopener noreferrer nofollow"
              className="label-mono inline-flex items-center gap-2 border border-border px-4 py-2 text-sm text-foreground hover:border-primary transition-colors"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              View on X
            </a>
          </div>
        ) : (
          /* All other providers — render iframe */
          <div className="relative w-full" style={{ paddingBottom: "56.25%" }}>
            <iframe
              src={embedUrl}
              title={title || `${provider} embed`}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              sandbox="allow-presentation allow-same-origin allow-scripts allow-forms"
              allowFullScreen
              className="absolute inset-0 h-full w-full border-0"
            />
          </div>
        )}
      </div>
    </NodeViewWrapper>
  )
}

// Build the Tiptap Node extension for embeds
function createEmbedBlockExtension() {
  return TiptapNode.create({
    name: "embedBlock",
    group: "block",
    atom: true,
    draggable: true,
    selectable: true,

    addAttributes() {
      return {
        provider: { default: "" },
        originalUrl: { default: "" },
        embedUrl: { default: "" },
        title: { default: "" },
      }
    },

    parseHTML() {
      return [{ tag: 'div[data-type="embed-block"]' }]
    },

    renderHTML({ HTMLAttributes }: { HTMLAttributes: Record<string, unknown> }) {
      return ["div", mergeAttributes(HTMLAttributes as Record<string, string>, { "data-type": "embed-block" })]
    },

    addNodeView() {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return ReactNodeViewRenderer(EmbedBlockView as any)
    },
  })
}

// ─── Toolbar Button ───────────────────────────────────────────────────────────

function ToolBtn({
  title,
  active,
  disabled,
  onClick,
  children,
}: {
  title: string
  active?: boolean
  disabled?: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      title={title}
      disabled={disabled}
      onClick={onClick}
      className={`flex items-center justify-center p-1.5 transition-colors ${
        active
          ? "bg-primary/20 text-primary"
          : "text-muted-foreground hover:bg-muted hover:text-foreground"
      } disabled:cursor-not-allowed disabled:opacity-40`}
    >
      {children}
    </button>
  )
}

function Divider() {
  return <div className="mx-0.5 h-5 w-px bg-border" />
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
    <div className="flex flex-wrap gap-2 border-t border-border bg-muted/30 p-2">
      {images.map((img) => (
        <div
          key={img.id}
          className="group relative h-14 w-14 flex-shrink-0 overflow-hidden border border-border bg-background"
        >
          {img.status === "uploading" ? (
            <div className="flex h-full w-full items-center justify-center">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            </div>
          ) : img.status === "error" ? (
            <div className="flex h-full w-full flex-col items-center justify-center px-1">
              <AlertCircle className="h-3.5 w-3.5 text-destructive" />
            </div>
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={img.url} alt={img.filename} className="h-full w-full object-cover" />
          )}
          {img.status === "done" && (
            <div className="absolute bottom-0.5 right-0.5">
              <CheckCircle2 className="h-3 w-3 text-green-400 drop-shadow" />
            </div>
          )}
          <button
            type="button"
            onClick={() => onRemove(img.id)}
            className="absolute right-0 top-0 hidden p-0.5 bg-background/80 hover:bg-destructive hover:text-white text-muted-foreground group-hover:block transition-colors"
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

// ─── Stats ────────────────────────────────────────────────────────────────────

function calculateStats(text: string) {
  const trimmed = text.trim()
  const words = trimmed.length === 0 ? 0 : trimmed.split(/\s+/).length
  return {
    words,
    readingTime: Math.max(1, Math.round(words / 180)),
  }
}

// ─── Main Editor ──────────────────────────────────────────────────────────────

export function TiptapEditor({
  name,
  id,
  defaultValue = "",
  placeholder = "Write your post…",
  required,
  uploadFolder = "blog",
  isSignedIn = true,
  onChange,
}: TiptapEditorProps) {
  const [tab, setTab] = useState<"write" | "preview">("write")
  const [images, setImages] = useState<UploadedImage[]>([])
  const [dragOver, setDragOver] = useState(false)
  const [pendingEmbed, setPendingEmbed] = useState<EmbedData | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const [jsonValue, setJsonValue] = useState<string>("")
  const [previewText, setPreviewText] = useState<string>("")

  const doneCount = images.filter((i) => i.status === "done").length
  const canUpload = isSignedIn && doneCount < MAX_IMAGES

  // Parse defaultValue – could be JSON or legacy Markdown string
  const getInitialContent = () => {
    if (!defaultValue || defaultValue.trim() === "") return ""
    try {
      const parsed = JSON.parse(defaultValue)
      if (parsed?.type === "doc") return parsed
    } catch {
      // legacy Markdown — convert to plain paragraph nodes
    }
    // Treat as plain text (basic conversion)
    return defaultValue
  }

  const EmbedBlock = useRef(createEmbedBlockExtension()).current

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        // Disable built-in blockquote/code/heading since we configure them separately
        blockquote: {},
        codeBlock: {},
        heading: { levels: [1, 2, 3] },
      }),
      Underline,
      Image.configure({ inline: false, allowBase64: false }),
      Link.configure({
        openOnClick: false,
        autolink: false,
        HTMLAttributes: {
          rel: "noopener noreferrer nofollow",
          target: "_blank",
        },
      }),
      Placeholder.configure({ placeholder }),
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      EmbedBlock,
    ],
    content: getInitialContent(),
    onUpdate({ editor }) {
      const json = JSON.stringify(editor.getJSON())
      setJsonValue(json)
      setPreviewText(editor.getText())
      onChange?.(json)
    },
    editorProps: {
      attributes: {
        class:
          "min-h-[320px] w-full bg-background px-5 py-4 text-foreground outline-none font-sans text-base leading-relaxed tiptap-prose",
        id: id ?? "",
      },
      handlePaste(view, event) {
        const text = event.clipboardData?.getData("text/plain")?.trim() ?? ""
        if (text) {
          const embed = detectEmbedUrl(text)
          if (embed) {
            event.preventDefault()
            setPendingEmbed(embed)
            return true
          }
        }
        return false
      },
      handleDrop(view, event) {
        const files = event.dataTransfer?.files
        if (files?.length) {
          const imageFiles = Array.from(files).filter((f) => ALLOWED_IMAGE_TYPES.has(f.type))
          if (imageFiles.length > 0 && canUpload) {
            event.preventDefault()
            imageFiles.slice(0, MAX_IMAGES - doneCount).forEach(uploadImageFile)
            return true
          }
        }
        return false
      },
    },
  })

  // Sync jsonValue on mount from editor
  useEffect(() => {
    if (editor && jsonValue === "") {
      const json = JSON.stringify(editor.getJSON())
      setJsonValue(json)
    }
  }, [editor, jsonValue])

  const stats = calculateStats(previewText)

  // ─── Image upload ──────────────────────────────────────────────────────────

  const uploadImageFile = useCallback(
    async (file: File) => {
      if (!ALLOWED_IMAGE_TYPES.has(file.type)) return
      if (file.size > MAX_BYTES) return
      if (!canUpload) return

      const tempId = crypto.randomUUID()
      setImages((prev) => [
        ...prev,
        { id: tempId, url: "", filename: file.name, status: "uploading" },
      ])

      try {
        const fd = new FormData()
        fd.append("file", file)
        fd.append("folder", uploadFolder)
        const res = await fetch("/api/upload", { method: "POST", body: fd })
        const json = await res.json()

        if (!res.ok || !json.success) throw new Error(json.error ?? "Upload failed")

        setImages((prev) =>
          prev.map((i) =>
            i.id === tempId ? { ...i, url: json.url, filename: json.filename, status: "done" } : i,
          ),
        )

        // Insert image into editor
        editor?.chain().focus().setImage({ src: json.url, alt: file.name }).run()
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Upload failed"
        setImages((prev) =>
          prev.map((i) => (i.id === tempId ? { ...i, status: "error", error: msg } : i)),
        )
      }
    },
    [canUpload, editor, uploadFolder, doneCount],
  )

  function removeImage(imgId: string) {
    setImages((prev) => prev.filter((i) => i.id !== imgId))
  }

  // ─── Embed insertion ───────────────────────────────────────────────────────

  function confirmEmbed(embed: EmbedData) {
    editor
      ?.chain()
      .focus()
      .insertContent({
        type: "embedBlock",
        attrs: {
          provider: embed.provider,
          originalUrl: embed.originalUrl,
          embedUrl: embed.embedUrl,
          title: embed.title,
        },
      })
      .run()
    setPendingEmbed(null)
  }

  function dismissEmbed() {
    // Insert raw link instead
    if (pendingEmbed) {
      editor
        ?.chain()
        .focus()
        .insertContent(`<a href="${pendingEmbed.originalUrl}" target="_blank" rel="noopener noreferrer nofollow">${pendingEmbed.originalUrl}</a>`)
        .run()
    }
    setPendingEmbed(null)
  }

  // ─── Link insertion ────────────────────────────────────────────────────────

  function insertLink() {
    const url = prompt("Link URL:")
    if (!url) return
    if (!/^https?:\/\//i.test(url.trim())) {
      alert("URL must start with http:// or https://")
      return
    }
    if (editor?.state.selection.empty) {
      editor.chain().focus().insertContent(`<a href="${url.trim()}">${url.trim()}</a>`).run()
    } else {
      editor?.chain().focus().setLink({ href: url.trim() }).run()
    }
  }

  // ─── Toolbar ───────────────────────────────────────────────────────────────

  if (!editor) return null

  const toolbar = (
    <div className="flex flex-wrap items-center gap-0.5 border-b border-border bg-muted/40 px-1 py-1">
      {/* Headings */}
      <ToolBtn title="Heading 1" active={editor.isActive("heading", { level: 1 })} onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}>
        <Heading1 className="h-3.5 w-3.5" />
      </ToolBtn>
      <ToolBtn title="Heading 2" active={editor.isActive("heading", { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>
        <Heading2 className="h-3.5 w-3.5" />
      </ToolBtn>
      <ToolBtn title="Heading 3" active={editor.isActive("heading", { level: 3 })} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}>
        <Heading3 className="h-3.5 w-3.5" />
      </ToolBtn>

      <Divider />

      {/* Inline formatting */}
      <ToolBtn title="Bold" active={editor.isActive("bold")} onClick={() => editor.chain().focus().toggleBold().run()}>
        <Bold className="h-3.5 w-3.5" />
      </ToolBtn>
      <ToolBtn title="Italic" active={editor.isActive("italic")} onClick={() => editor.chain().focus().toggleItalic().run()}>
        <Italic className="h-3.5 w-3.5" />
      </ToolBtn>
      <ToolBtn title="Underline" active={editor.isActive("underline")} onClick={() => editor.chain().focus().toggleUnderline().run()}>
        <UnderlineIcon className="h-3.5 w-3.5" />
      </ToolBtn>
      <ToolBtn title="Inline code" active={editor.isActive("code")} onClick={() => editor.chain().focus().toggleCode().run()}>
        <Code2 className="h-3.5 w-3.5" />
      </ToolBtn>

      <Divider />

      {/* Lists */}
      <ToolBtn title="Bullet list" active={editor.isActive("bulletList")} onClick={() => editor.chain().focus().toggleBulletList().run()}>
        <List className="h-3.5 w-3.5" />
      </ToolBtn>
      <ToolBtn title="Numbered list" active={editor.isActive("orderedList")} onClick={() => editor.chain().focus().toggleOrderedList().run()}>
        <ListOrdered className="h-3.5 w-3.5" />
      </ToolBtn>

      <Divider />

      {/* Block elements */}
      <ToolBtn title="Blockquote" active={editor.isActive("blockquote")} onClick={() => editor.chain().focus().toggleBlockquote().run()}>
        <Quote className="h-3.5 w-3.5" />
      </ToolBtn>
      <ToolBtn title="Code block" active={editor.isActive("codeBlock")} onClick={() => editor.chain().focus().toggleCodeBlock().run()}>
        <Code2 className="h-3.5 w-3.5" />
      </ToolBtn>
      <ToolBtn title="Horizontal rule" onClick={() => editor.chain().focus().setHorizontalRule().run()}>
        <Minus className="h-3.5 w-3.5" />
      </ToolBtn>

      <Divider />

      {/* Alignment */}
      <ToolBtn title="Align left" active={editor.isActive({ textAlign: "left" })} onClick={() => editor.chain().focus().setTextAlign("left").run()}>
        <AlignLeft className="h-3.5 w-3.5" />
      </ToolBtn>
      <ToolBtn title="Align center" active={editor.isActive({ textAlign: "center" })} onClick={() => editor.chain().focus().setTextAlign("center").run()}>
        <AlignCenter className="h-3.5 w-3.5" />
      </ToolBtn>
      <ToolBtn title="Align right" active={editor.isActive({ textAlign: "right" })} onClick={() => editor.chain().focus().setTextAlign("right").run()}>
        <AlignRight className="h-3.5 w-3.5" />
      </ToolBtn>

      <Divider />

      {/* Link */}
      <ToolBtn title="Insert link" active={editor.isActive("link")} onClick={insertLink}>
        <Link2 className="h-3.5 w-3.5" />
      </ToolBtn>

      {/* Image */}
      {isSignedIn && (
        <ToolBtn
          title={canUpload ? "Upload image" : `Image limit (${MAX_IMAGES})`}
          disabled={!canUpload}
          onClick={() => fileRef.current?.click()}
        >
          {images.some((i) => i.status === "uploading") ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <ImageIcon className="h-3.5 w-3.5" />
          )}
        </ToolBtn>
      )}
      <ToolBtn
        title="Insert image URL"
        onClick={() => {
          const url = prompt("Image URL:")
          if (url && /^https?:\/\//i.test(url.trim())) {
            editor.chain().focus().setImage({ src: url.trim() }).run()
          }
        }}
      >
        <Upload className="h-3.5 w-3.5" />
      </ToolBtn>
    </div>
  )

  return (
    <div
      className={`flex flex-col border border-border transition-colors focus-within:border-primary ${
        dragOver ? "border-primary bg-primary/5" : ""
      }`}
      onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => {
        e.preventDefault()
        setDragOver(false)
        if (!canUpload) return
        const files = e.dataTransfer.files
        if (files?.length) {
          Array.from(files)
            .filter((f) => ALLOWED_IMAGE_TYPES.has(f.type))
            .slice(0, MAX_IMAGES - doneCount)
            .forEach(uploadImageFile)
        }
      }}
    >
      {/* Tab bar + stats */}
      <div className="flex items-center justify-between border-b border-border bg-muted/40 px-2 py-1">
        <div className="flex items-center gap-0">
          {(["write", "preview"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`label-mono flex items-center gap-1.5 px-3 py-1.5 text-xs transition-colors ${
                tab === t
                  ? "border-b-2 border-primary text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {t === "write" ? <Pencil className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
              {t}
            </button>
          ))}
          <div className="label-mono ml-3 flex items-center gap-3 text-xs text-muted-foreground">
            <span>{stats.words}w</span>
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />{stats.readingTime}min
            </span>
          </div>
        </div>
      </div>

      {/* Toolbar (write mode only) */}
      {tab === "write" && toolbar}

      {/* Editor area */}
      {tab === "write" && (
        <div className="relative">
          {dragOver && (
            <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center border-2 border-dashed border-primary bg-primary/10">
              <p className="label-mono text-sm font-semibold text-primary">Drop image to upload</p>
            </div>
          )}
          <EditorContent editor={editor} />
        </div>
      )}

      {/* Preview area */}
      {tab === "preview" && (
        <div className="min-h-[200px] bg-background px-5 py-4">
          {previewText.trim() ? (
            <TiptapPreview editor={editor} />
          ) : (
            <p className="label-mono text-muted-foreground">Nothing to preview yet.</p>
          )}
        </div>
      )}

      {/* Embed confirmation prompt */}
      {pendingEmbed && (
        <EmbedConfirmBanner embed={pendingEmbed} onConfirm={confirmEmbed} onDismiss={dismissEmbed} />
      )}

      {/* Image previews */}
      <ImagePreviewGrid images={images} onRemove={removeImage} />

      {/* Hidden file input */}
      <input
        ref={fileRef}
        type="file"
        accept=".jpg,.jpeg,.png,.webp,.gif,image/jpeg,image/png,image/webp,image/gif"
        multiple
        className="hidden"
        onChange={(e) => {
          if (e.target.files) {
            Array.from(e.target.files)
              .slice(0, MAX_IMAGES - doneCount)
              .forEach(uploadImageFile)
          }
          e.target.value = ""
        }}
      />

      {/* Hidden input carrying the serialized JSON for form submission */}
      <input type="hidden" name={name} id={id} value={jsonValue} required={required} />
    </div>
  )
}

// ─── Inline preview using editor text ─────────────────────────────────────────

function TiptapPreview({ editor }: { editor: ReturnType<typeof useEditor> }) {
  // Simple text-based preview for now — TiptapRenderer handles full JSON rendering on publish
  const html = editor?.getHTML() ?? ""
  return (
    <div
      className="tiptap-preview-prose leading-relaxed text-foreground/90"
      // The HTML from Tiptap is generated by our own extensions — it's safe
      // (no user-raw HTML, no iframes, just semantic nodes from StarterKit + Image + Link)
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}

// ─── Embed confirm banner ─────────────────────────────────────────────────────

function EmbedConfirmBanner({
  embed,
  onConfirm,
  onDismiss,
}: {
  embed: EmbedData
  onConfirm: (e: EmbedData) => void
  onDismiss: () => void
}) {
  return (
    <div className="flex items-center justify-between gap-4 border-t border-primary/40 bg-primary/10 px-4 py-2.5">
      <div className="flex items-center gap-2 min-w-0">
        <Film className="h-4 w-4 flex-shrink-0 text-primary" />
        <span className="label-mono text-xs text-foreground">
          Embed {embed.provider.toUpperCase()} video?
        </span>
        <span className="label-mono truncate text-xs text-muted-foreground">{embed.originalUrl}</span>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <button
          type="button"
          onClick={() => onConfirm(embed)}
          className="label-mono inline-flex items-center gap-1 bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground hover:opacity-90 transition-opacity"
        >
          <CheckCircle2 className="h-3 w-3" /> Embed
        </button>
        <button
          type="button"
          onClick={onDismiss}
          className="label-mono inline-flex items-center gap-1 border border-border px-3 py-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <Link2 className="h-3 w-3" /> As Link
        </button>
      </div>
    </div>
  )
}
