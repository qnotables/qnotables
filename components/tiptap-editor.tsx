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
  Loader2,
  X,
  Eye,
  Pencil,
  Minus,
  AlignLeft,
  AlignCenter,
  AlignRight,
  CheckCircle2,
  Clock,
  Film,
  ExternalLink,
  Video,
} from "lucide-react"
import { detectEmbedUrl, type EmbedData } from "@/lib/tiptap-embed-utils"
import {
  ALLOWED_IMAGE_TYPES,
  ALLOWED_VIDEO_TYPES,
  MAX_IMAGES,
  MAX_VIDEO_BYTES,
  UploadedMedia,
  uploadMediaFile,
  validateMediaFile,
  iframeToMarkdownComment,
} from "@/lib/media-utils"
import {
  MediaUploadButton,
  MediaPreviewGrid,
} from "@/components/editor/MediaUploadButton"
import { EmbedMediaModal } from "@/components/editor/EmbedMediaModal"

// ─── Constants ────────────────────────────────────────────────────────────────

const MAX_TIPTAP_IMAGES = 10 // blog editor allows more
const MAX_IMAGE_BYTES_TIPTAP = 10 * 1024 * 1024 // 10 MB for blog

// ─── Types ────────────────────────────────────────────────────────────────────

export interface TiptapEditorProps {
  name: string
  id?: string
  defaultValue?: string
  placeholder?: string
  required?: boolean
  uploadFolder?: "forum" | "blog"
  isSignedIn?: boolean
  onChange?: (json: string) => void
}

// ─── EmbedBlock Node ──────────────────────────────────────────────────────────

function EmbedBlockView({
  node,
  deleteNode,
}: {
  node: { attrs: { provider: string; embedUrl: string; title: string; originalUrl: string } }
  deleteNode: () => void
}) {
  const { provider, embedUrl, title, originalUrl } = node.attrs
  const isX = provider === "x"

  return (
    <NodeViewWrapper className="embed-block-wrapper my-4 select-none" contentEditable={false}>
      <div className="relative overflow-hidden border border-border bg-card">
        <div className="flex items-center justify-between border-b border-border bg-muted/60 px-3 py-1.5">
          <div className="flex items-center gap-2">
            <Film className="h-3.5 w-3.5 text-primary" />
            <span className="label-mono text-xs text-muted-foreground">
              {provider.toUpperCase()} EMBED
            </span>
            {title && (
              <span className="label-mono truncate text-xs text-foreground">{title}</span>
            )}
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

// ─── VideoBlock Node ──────────────────────────────────────────────────────────

function VideoBlockView({
  node,
  deleteNode,
}: {
  node: { attrs: { src: string; title: string } }
  deleteNode: () => void
}) {
  const { src, title } = node.attrs
  return (
    <NodeViewWrapper className="video-block-wrapper my-4 select-none" contentEditable={false}>
      <div className="relative overflow-hidden border border-border bg-card">
        <div className="flex items-center justify-between border-b border-border bg-muted/60 px-3 py-1.5">
          <div className="flex items-center gap-2">
            <Video className="h-3.5 w-3.5 text-primary" />
            <span className="label-mono text-xs text-muted-foreground">UPLOADED VIDEO</span>
            {title && (
              <span className="label-mono truncate text-xs text-foreground">{title}</span>
            )}
          </div>
          <button
            type="button"
            onClick={deleteNode}
            className="inline-flex items-center gap-1 px-1.5 py-0.5 text-muted-foreground hover:text-destructive transition-colors"
            title="Remove video"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
        <video
          src={src}
          controls
          playsInline
          className="w-full max-h-[480px] bg-black"
          title={title}
        />
      </div>
    </NodeViewWrapper>
  )
}

function createVideoBlockExtension() {
  return TiptapNode.create({
    name: "videoBlock",
    group: "block",
    atom: true,
    draggable: true,
    selectable: true,
    addAttributes() {
      return {
        src: { default: "" },
        title: { default: "" },
      }
    },
    parseHTML() {
      return [{ tag: 'div[data-type="video-block"]' }]
    },
    renderHTML({ HTMLAttributes }: { HTMLAttributes: Record<string, unknown> }) {
      return ["div", mergeAttributes(HTMLAttributes as Record<string, string>, { "data-type": "video-block" })]
    },
    addNodeView() {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return ReactNodeViewRenderer(VideoBlockView as any)
    },
  })
}

// ─── Toolbar helpers ──────────────────────────────────────────────────────────

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
  const [media, setMedia] = useState<UploadedMedia[]>([])
  const [dragOver, setDragOver] = useState(false)
  const [pendingEmbed, setPendingEmbed] = useState<EmbedData | null>(null)
  const [jsonValue, setJsonValue] = useState<string>("")
  const [previewText, setPreviewText] = useState<string>("")

  const imageDone = media.filter((m) => m.kind === "image" && m.status === "done").length
  const canUpload = isSignedIn && imageDone < MAX_TIPTAP_IMAGES

  // Keep a stable ref for use inside Tiptap's handleDrop closure
  const uploadVideoFileRef = useRef<(file: File) => void>(() => {})

  const getInitialContent = () => {
    if (!defaultValue || defaultValue.trim() === "") return ""
    try {
      const parsed = JSON.parse(defaultValue)
      if (parsed?.type === "doc") return parsed
    } catch {
      // legacy markdown / plain text
    }
    return defaultValue
  }

  const EmbedBlock = useRef(createEmbedBlockExtension()).current
  const VideoBlock = useRef(createVideoBlockExtension()).current

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        blockquote: {},
        codeBlock: {},
        heading: { levels: [1, 2, 3] },
      }),
      Underline,
      Image.configure({
        inline: false,
        allowBase64: false,
        HTMLAttributes: {
          class: "blog-image",
        },
      }).extend({
        addAttributes() {
          return {
            ...this.parent?.(),
            align: {
              default: "center",
              parseHTML: element => element.getAttribute("data-align") || "center",
              renderHTML: attributes => ({
                "data-align": attributes.align,
              }),
            },
          }
        },
        addCommands() {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          return {
            ...this.parent?.(),
            setImageAlignment: (align: string) => ({ commands }: any) => {
              return commands.updateAttributes("image", { align })
            },
          }
        },
      }),
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
      VideoBlock,
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
          const allFiles = Array.from(files)
          const imageFiles = allFiles.filter((f) => ALLOWED_IMAGE_TYPES.has(f.type))
          const videoFiles = allFiles.filter((f) => ALLOWED_VIDEO_TYPES.has(f.type))
          if (imageFiles.length > 0 && canUpload) {
            event.preventDefault()
            imageFiles.slice(0, MAX_TIPTAP_IMAGES - imageDone).forEach(uploadImageFile)
            return true
          }
          if (videoFiles.length > 0 && uploadFolder === "blog") {
            event.preventDefault()
            uploadVideoFileRef.current(videoFiles[0])
            return true
          }
        }
        return false
      },
    },
  })

  useEffect(() => {
    if (editor && jsonValue === "") {
      setJsonValue(JSON.stringify(editor.getJSON()))
    }
  }, [editor, jsonValue])

  const stats = calculateStats(previewText)

  // ─── Image upload ──────────────────────────────────────────────────────────

  const uploadImageFile = useCallback(
    async (file: File) => {
      const err = validateMediaFile(file, "image")
      if (err || file.size > MAX_IMAGE_BYTES_TIPTAP || !canUpload) return
      const tempId = crypto.randomUUID()
      setMedia((prev) => [
        ...prev,
        { id: tempId, url: "", filename: file.name, size: file.size, kind: "image", status: "uploading" },
      ])
      try {
        const result = await uploadMediaFile(file, uploadFolder)
        setMedia((prev) =>
          prev.map((m) =>
            m.id === tempId ? { ...m, url: result.url, filename: result.filename, status: "done" } : m,
          ),
        )
        editor?.chain().focus().setImage({ src: result.url, alt: file.name }).run()
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Upload failed"
        setMedia((prev) =>
          prev.map((m) => (m.id === tempId ? { ...m, status: "error", error: msg } : m)),
        )
      }
    },
    [canUpload, editor, uploadFolder, imageDone],
  )

  function removeMedia(id: string) {
    setMedia((prev) => prev.filter((m) => m.id !== id))
  }

  // ─── Video upload ──────────────────────────────────────────────────────────

  const uploadVideoFile = useCallback(
    async (file: File) => {
      if (!ALLOWED_VIDEO_TYPES.has(file.type)) return
      if (file.size > MAX_VIDEO_BYTES) return
      if (uploadFolder !== "blog") return

      const tempId = crypto.randomUUID()
      setMedia((prev) => [
        ...prev,
        { id: tempId, url: "", filename: file.name, size: file.size, kind: "video", status: "uploading" },
      ])

      try {
        const result = await uploadMediaFile(file, uploadFolder)
        setMedia((prev) =>
          prev.map((m) =>
            m.id === tempId ? { ...m, url: result.url, filename: result.filename, status: "done" } : m,
          ),
        )
        editor?.chain().focus().insertContent({
          type: "videoBlock",
          attrs: { src: result.url, title: file.name },
        }).run()
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Video upload failed"
        setMedia((prev) =>
          prev.map((m) => (m.id === tempId ? { ...m, status: "error", error: msg } : m)),
        )
      }
    },
    [editor, uploadFolder],
  )

  uploadVideoFileRef.current = uploadVideoFile

  // ─── MediaUploadButton callbacks ──────────────────────────────────────────

  function onImageUploaded(url: string, filename: string) {
    setMedia((prev) => {
      const existing = prev.find((m) => m.filename === filename && m.status === "uploading")
      if (existing) return prev.map((m) => (m.id === existing.id ? { ...m, url, status: "done" } : m))
      return [...prev, { id: crypto.randomUUID(), url, filename, size: 0, kind: "image", status: "done" }]
    })
    editor?.chain().focus().setImage({ src: url, alt: filename }).run()
  }

  function onVideoUploaded(url: string, filename: string) {
    setMedia((prev) => {
      const existing = prev.find((m) => m.filename === filename && m.status === "uploading")
      if (existing) return prev.map((m) => (m.id === existing.id ? { ...m, url, status: "done" } : m))
      return [...prev, { id: crypto.randomUUID(), url, filename, size: 0, kind: "video", status: "done" }]
    })
    editor?.chain().focus().insertContent({
      type: "videoBlock",
      attrs: { src: url, title: filename },
    }).run()
  }

  // ─── EmbedMediaModal callbacks ────────────────────────────────────────────

  function onEmbedImageUrl(url: string) {
    editor?.chain().focus().setImage({ src: url }).run()
  }

  function onEmbedUrl(embed: EmbedData) {
    editor?.chain().focus().insertContent({
      type: "embedBlock",
      attrs: {
        provider: embed.provider,
        originalUrl: embed.originalUrl,
        embedUrl: embed.embedUrl,
        title: embed.title,
      },
    }).run()
    setPendingEmbed(null)
  }

  function onIframeCode(src: string, title: string) {
    // For Tiptap, insert as embedBlock using direct src
    editor?.chain().focus().insertContent({
      type: "embedBlock",
      attrs: {
        provider: "iframe",
        originalUrl: src,
        embedUrl: src,
        title,
      },
    }).run()
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

  // ─── Pending embed banner (from paste detection) ──────────────────────────

  function confirmEmbed(embed: EmbedData) {
    onEmbedUrl(embed)
  }

  function dismissEmbed() {
    if (pendingEmbed) {
      editor
        ?.chain()
        .focus()
        .insertContent(
          `<a href="${pendingEmbed.originalUrl}" target="_blank" rel="noopener noreferrer nofollow">${pendingEmbed.originalUrl}</a>`,
        )
        .run()
    }
    setPendingEmbed(null)
  }

  if (!editor) return null

  // ─── Toolbar ───────────────────────────────────────────────────────────────

  const toolbar = (
    <div className="flex flex-wrap items-center gap-0.5 border-b border-border bg-muted/40 px-1 py-1">
      {/* Headings */}
      <ToolBtn
        title="Heading 1"
        active={editor.isActive("heading", { level: 1 })}
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
      >
        <Heading1 className="h-3.5 w-3.5" />
      </ToolBtn>
      <ToolBtn
        title="Heading 2"
        active={editor.isActive("heading", { level: 2 })}
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
      >
        <Heading2 className="h-3.5 w-3.5" />
      </ToolBtn>
      <ToolBtn
        title="Heading 3"
        active={editor.isActive("heading", { level: 3 })}
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
      >
        <Heading3 className="h-3.5 w-3.5" />
      </ToolBtn>

      <Divider />

      {/* Inline formatting */}
      <ToolBtn
        title="Bold"
        active={editor.isActive("bold")}
        onClick={() => editor.chain().focus().toggleBold().run()}
      >
        <Bold className="h-3.5 w-3.5" />
      </ToolBtn>
      <ToolBtn
        title="Italic"
        active={editor.isActive("italic")}
        onClick={() => editor.chain().focus().toggleItalic().run()}
      >
        <Italic className="h-3.5 w-3.5" />
      </ToolBtn>
      <ToolBtn
        title="Underline"
        active={editor.isActive("underline")}
        onClick={() => editor.chain().focus().toggleUnderline().run()}
      >
        <UnderlineIcon className="h-3.5 w-3.5" />
      </ToolBtn>
      <ToolBtn
        title="Inline code"
        active={editor.isActive("code")}
        onClick={() => editor.chain().focus().toggleCode().run()}
      >
        <Code2 className="h-3.5 w-3.5" />
      </ToolBtn>

      <Divider />

      {/* Lists */}
      <ToolBtn
        title="Bullet list"
        active={editor.isActive("bulletList")}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
      >
        <List className="h-3.5 w-3.5" />
      </ToolBtn>
      <ToolBtn
        title="Numbered list"
        active={editor.isActive("orderedList")}
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
      >
        <ListOrdered className="h-3.5 w-3.5" />
      </ToolBtn>

      <Divider />

      {/* Block elements */}
      <ToolBtn
        title="Blockquote"
        active={editor.isActive("blockquote")}
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
      >
        <Quote className="h-3.5 w-3.5" />
      </ToolBtn>
      <ToolBtn
        title="Code block"
        active={editor.isActive("codeBlock")}
        onClick={() => editor.chain().focus().toggleCodeBlock().run()}
      >
        <Code2 className="h-3.5 w-3.5" />
      </ToolBtn>
      <ToolBtn
        title="Horizontal rule"
        onClick={() => editor.chain().focus().setHorizontalRule().run()}
      >
        <Minus className="h-3.5 w-3.5" />
      </ToolBtn>

      <Divider />

      {/* Alignment */}
      <ToolBtn
        title="Align left"
        active={editor.isActive({ textAlign: "left" })}
        onClick={() => editor.chain().focus().setTextAlign("left").run()}
      >
        <AlignLeft className="h-3.5 w-3.5" />
      </ToolBtn>
      <ToolBtn
        title="Align center"
        active={editor.isActive({ textAlign: "center" })}
        onClick={() => editor.chain().focus().setTextAlign("center").run()}
      >
        <AlignCenter className="h-3.5 w-3.5" />
      </ToolBtn>
      <ToolBtn
        title="Align right"
        active={editor.isActive({ textAlign: "right" })}
        onClick={() => editor.chain().focus().setTextAlign("right").run()}
      >
        <AlignRight className="h-3.5 w-3.5" />
      </ToolBtn>

      <Divider />

      {/* Image Alignment — only show when image is selected */}
      {editor.isActive("image") && (
        <>
          <ToolBtn
            title="Float image left"
            active={editor.getAttributes("image").align === "left"}
            onClick={() => {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              (editor.chain().focus() as any).setImageAlignment("left").run()
            }}
          >
            <AlignLeft className="h-3.5 w-3.5" />
          </ToolBtn>
          <ToolBtn
            title="Center image"
            active={editor.getAttributes("image").align === "center"}
            onClick={() => {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              (editor.chain().focus() as any).setImageAlignment("center").run()
            }}
          >
            <AlignCenter className="h-3.5 w-3.5" />
          </ToolBtn>
          <ToolBtn
            title="Float image right"
            active={editor.getAttributes("image").align === "right"}
            onClick={() => {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              (editor.chain().focus() as any).setImageAlignment("right").run()
            }}
          >
            <AlignRight className="h-3.5 w-3.5" />
          </ToolBtn>
          <ToolBtn
            title="Full width image"
            active={editor.getAttributes("image").align === "full"}
            onClick={() => {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              (editor.chain().focus() as any).setImageAlignment("full").run()
            }}
          >
            <Minus className="h-3.5 w-3.5" />
          </ToolBtn>
          <Divider />
        </>
      )}

      {/* Link */}
      <ToolBtn title="Insert link" active={editor.isActive("link")} onClick={insertLink}>
        <Link2 className="h-3.5 w-3.5" />
      </ToolBtn>

      <Divider />

      {/* Upload Media — single unified button */}
      <MediaUploadButton
        uploadFolder={uploadFolder}
        isSignedIn={isSignedIn}
        onImageUploaded={onImageUploaded}
        onVideoUploaded={onVideoUploaded}
        media={media}
      />

      {/* Embed Media — single unified dropdown */}
      <EmbedMediaModal
        onImageUrl={onEmbedImageUrl}
        onEmbedUrl={onEmbedUrl}
        onIframeCode={onIframeCode}
      />
    </div>
  )

  return (
    <div
      className={`flex flex-col border border-border transition-colors focus-within:border-primary ${
        dragOver ? "border-primary bg-primary/5" : ""
      }`}
      onDragOver={(e) => {
        e.preventDefault()
        setDragOver(true)
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => {
        e.preventDefault()
        setDragOver(false)
        if (!canUpload) return
        Array.from(e.dataTransfer.files)
          .filter((f) => ALLOWED_IMAGE_TYPES.has(f.type))
          .slice(0, MAX_TIPTAP_IMAGES - imageDone)
          .forEach(uploadImageFile)
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
              <Clock className="h-3 w-3" />
              {stats.readingTime}min
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
              <p className="label-mono text-sm font-semibold text-primary">
                Drop image or video to upload
              </p>
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

      {/* Pending embed banner (pasted URL auto-detected) */}
      {pendingEmbed && (
        <EmbedConfirmBanner
          embed={pendingEmbed}
          onConfirm={confirmEmbed}
          onDismiss={dismissEmbed}
        />
      )}

      {/* Media thumbnail grid */}
      <MediaPreviewGrid media={media} onRemove={removeMedia} />

      {/* Serialized JSON for form submission */}
      <input type="hidden" name={name} id={id} value={jsonValue} required={required} />
    </div>
  )
}

// ─── Inline preview ────────────────────────────────────────────────────────────

function TiptapPreview({ editor }: { editor: ReturnType<typeof useEditor> }) {
  const html = editor?.getHTML() ?? ""
  return (
    <div
      className="tiptap-preview-prose leading-relaxed text-foreground/90"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}

// ─── Embed confirm banner ──────────────────────────────────────────────────────

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
        <span className="label-mono truncate text-xs text-muted-foreground">
          {embed.originalUrl}
        </span>
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
