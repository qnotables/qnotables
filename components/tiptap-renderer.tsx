/**
 * TiptapRenderer
 *
 * Safely renders Tiptap JSON document nodes as React components.
 * No dangerouslySetInnerHTML — every node type is handled explicitly.
 * Script tags and unsafe protocols are never rendered.
 */

import type { ReactNode } from "react"
import { ForumImage } from "@/components/forum-image"
import { Markdown } from "@/components/markdown"

// ─── Types ────────────────────────────────────────────────────────────────────

interface TiptapMark {
  type: string
  attrs?: Record<string, string | number | boolean | null>
}

interface TiptapNode {
  type: string
  attrs?: Record<string, string | number | boolean | null>
  content?: TiptapNode[]
  marks?: TiptapMark[]
  text?: string
}

interface TiptapDoc {
  type: "doc"
  content?: TiptapNode[]
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function isSafeUrl(url: string | null | undefined): boolean {
  if (!url || typeof url !== "string") return false
  return /^https?:\/\//i.test(url.trim())
}

/** Apply marks to a text run */
function applyMarks(text: string, marks: TiptapMark[] | undefined, key: string): ReactNode {
  if (!marks || marks.length === 0) return text

  let node: ReactNode = text

  for (const mark of marks) {
    switch (mark.type) {
      case "bold":
        node = <strong key={key + "-bold"} className="font-semibold text-foreground">{node}</strong>
        break
      case "italic":
        node = <em key={key + "-italic"} className="italic">{node}</em>
        break
      case "underline":
        node = <u key={key + "-underline"} className="underline underline-offset-2">{node}</u>
        break
      case "code":
        node = <code key={key + "-code"} className="label-mono bg-card px-1.5 py-0.5 text-primary">{node}</code>
        break
      case "strike":
        node = <s key={key + "-strike"} className="line-through text-muted-foreground">{node}</s>
        break
      case "link": {
        const href = typeof mark.attrs?.href === "string" ? mark.attrs.href : ""
        if (isSafeUrl(href)) {
          node = (
            <a
              key={key + "-link"}
              href={href}
              target="_blank"
              rel="noopener noreferrer nofollow"
              className="break-all text-primary underline-offset-4 hover:underline"
            >
              {node}
            </a>
          )
        }
        break
      }
      default:
        break
    }
  }

  return node
}

/** Render inline content array (text nodes + marks) */
function renderInline(content: TiptapNode[] | undefined, prefix: string): ReactNode[] {
  if (!content) return []
  return content.map((node, i) => {
    const key = `${prefix}-${i}`
    if (node.type === "text") {
      return applyMarks(node.text ?? "", node.marks, key)
    }
    if (node.type === "hardBreak") {
      return <br key={key} />
    }
    // Inline image
    if (node.type === "image") {
      const src = typeof node.attrs?.src === "string" ? node.attrs.src : ""
      const alt = typeof node.attrs?.alt === "string" ? node.attrs.alt : ""
      if (isSafeUrl(src)) {
        return <ForumImage key={key} src={src} alt={alt} />
      }
      return null
    }
    return null
  })
}

/** Render a single block node */
function renderNode(node: TiptapNode, index: number): ReactNode {
  const key = `node-${index}`

  switch (node.type) {
    case "paragraph": {
      const textAlign = typeof node.attrs?.textAlign === "string" ? node.attrs.textAlign : undefined
      const alignClass =
        textAlign === "center" ? "text-center" :
        textAlign === "right" ? "text-right" :
        textAlign === "justify" ? "text-justify" : ""
      return (
        <p key={key} className={`text-pretty leading-relaxed ${alignClass}`.trim()}>
          {renderInline(node.content, key)}
        </p>
      )
    }

    case "heading": {
      const level = typeof node.attrs?.level === "number" ? node.attrs.level : 2
      const textAlign = typeof node.attrs?.textAlign === "string" ? node.attrs.textAlign : undefined
      const alignClass =
        textAlign === "center" ? "text-center" :
        textAlign === "right" ? "text-right" : ""
      const inner = renderInline(node.content, key)
      if (level === 1) return <h1 key={key} className={`stencil mt-5 text-3xl text-foreground ${alignClass}`}>{inner}</h1>
      if (level === 2) return <h2 key={key} className={`stencil mt-4 text-2xl text-foreground ${alignClass}`}>{inner}</h2>
      return <h3 key={key} className={`stencil mt-3 text-xl text-foreground ${alignClass}`}>{inner}</h3>
    }

    case "bulletList":
      return (
        <ul key={key} className="flex list-disc flex-col gap-2 pl-6 marker:text-primary">
          {node.content?.map((li, i) => renderNode(li, i))}
        </ul>
      )

    case "orderedList":
      return (
        <ol key={key} className="flex list-decimal flex-col gap-2 pl-6 marker:text-primary">
          {node.content?.map((li, i) => renderNode(li, i))}
        </ol>
      )

    case "listItem":
      return (
        <li key={key} className="leading-relaxed">
          {node.content?.map((child, i) => {
            // ListItem content is usually a paragraph; unwrap it
            if (child.type === "paragraph") return renderInline(child.content, `${key}-p${i}`)
            return renderNode(child, i)
          })}
        </li>
      )

    case "blockquote":
      return (
        <blockquote key={key} className="border-l-2 border-primary bg-card py-2 pl-4 italic text-muted-foreground">
          {node.content?.map((child, i) => renderNode(child, i))}
        </blockquote>
      )

    case "codeBlock": {
      const lang = typeof node.attrs?.language === "string" ? node.attrs.language : ""
      const code = node.content?.map((n) => n.text ?? "").join("") ?? ""
      return (
        <pre key={key} className="overflow-x-auto border border-border bg-muted">
          <code className={`block w-full whitespace-pre p-4 font-mono text-sm leading-relaxed text-foreground ${lang ? `language-${lang}` : ""}`}>
            {code}
          </code>
        </pre>
      )
    }

    case "horizontalRule":
      return <hr key={key} className="border-border" />

    case "image": {
      const src = typeof node.attrs?.src === "string" ? node.attrs.src : ""
      const alt = typeof node.attrs?.alt === "string" ? node.attrs.alt : ""
      if (!isSafeUrl(src)) return null
      return (
        <figure key={key} className="my-2">
          <ForumImage src={src} alt={alt} />
          {alt && <figcaption className="label-mono mt-1 text-center text-xs text-muted-foreground">{alt}</figcaption>}
        </figure>
      )
    }

    case "embedBlock": {
      const provider = typeof node.attrs?.provider === "string" ? node.attrs.provider : ""
      const embedUrl = typeof node.attrs?.embedUrl === "string" ? node.attrs.embedUrl : ""
      const originalUrl = typeof node.attrs?.originalUrl === "string" ? node.attrs.originalUrl : ""
      const title = typeof node.attrs?.title === "string" ? node.attrs.title : ""

      if (!embedUrl) return null

      const isX = provider === "x"

      return (
        <div key={key} className="my-4 overflow-hidden border border-border bg-card">
          {/* Provider label */}
          <div className="border-b border-border bg-muted/60 px-3 py-1.5">
            <span className="label-mono text-xs text-muted-foreground">
              {provider.toUpperCase()} EMBED
            </span>
            {title && <span className="label-mono ml-2 text-xs text-foreground">{title}</span>}
          </div>

          {isX ? (
            <div className="flex flex-col items-center gap-3 px-6 py-6">
              <p className="label-mono text-sm text-muted-foreground">X / Twitter post</p>
              {isSafeUrl(originalUrl) && (
                <a
                  href={originalUrl}
                  target="_blank"
                  rel="noopener noreferrer nofollow"
                  className="label-mono inline-flex items-center gap-2 border border-border px-4 py-2 text-sm text-foreground hover:border-primary transition-colors"
                >
                  View on X
                </a>
              )}
            </div>
          ) : (
            isSafeUrl(embedUrl) && (
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
            )
          )}
        </div>
      )
    }

    default:
      // Unknown node — skip silently
      return null
  }
}

// ─── Public API ───────────────────────────────────────────────────────────────

interface TiptapRendererProps {
  /** Serialized Tiptap JSON string (from editor.getJSON()) */
  content: string
}

export function TiptapRenderer({ content }: TiptapRendererProps) {
  // Parse the JSON document
  let doc: TiptapDoc | null = null
  try {
    const parsed = JSON.parse(content)
    if (parsed?.type === "doc") doc = parsed as TiptapDoc
  } catch {
    // Fall back to rendering as plain text if content is not valid JSON
  }

  // Legacy Markdown fallback — if not a JSON doc, delegate to Markdown component
  if (!doc) {
    return <Markdown content={content} />
  }

  const nodes = doc.content ?? []

  return (
    <div className="flex flex-col gap-4 leading-relaxed text-foreground/90">
      {nodes.map((node, i) => renderNode(node, i))}
    </div>
  )
}

/**
 * Detect whether a string is a Tiptap JSON doc (vs. legacy Markdown).
 */
export function isTiptapJson(content: string): boolean {
  if (!content || typeof content !== "string") return false
  try {
    const parsed = JSON.parse(content.trim())
    return parsed?.type === "doc"
  } catch {
    return false
  }
}
