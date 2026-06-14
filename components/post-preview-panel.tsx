"use client"

import { useState, useEffect } from "react"
import { Eye, FileText } from "lucide-react"
import { Markdown } from "@/components/markdown"

interface PostPreviewPanelProps {
  /** Controlled from the parent form via event listeners on the named inputs */
  initialTitle?: string
  initialBody?: string
}

/**
 * Listens to input/textarea events bubbling from the form and renders a
 * live preview of the post without needing to lift state out of BlogPostForm.
 */
export function PostPreviewPanel({ initialTitle = "", initialBody = "" }: PostPreviewPanelProps) {
  const [title, setTitle] = useState(initialTitle)
  const [body, setBody] = useState(initialBody)
  const [tab, setTab] = useState<"preview" | "tips">("preview")

  useEffect(() => {
    function onInput(e: Event) {
      const el = e.target as HTMLInputElement | HTMLTextAreaElement
      if (el.name === "title") setTitle(el.value)
      if (el.name === "body") setBody(el.value)
    }
    document.addEventListener("input", onInput, true)
    return () => document.removeEventListener("input", onInput, true)
  }, [])

  return (
    <aside className="sticky top-6 flex flex-col gap-0 border border-border">
      {/* Tab bar */}
      <div className="flex items-center border-b border-border bg-muted/40 px-1">
        {(["preview", "tips"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`label-mono flex items-center gap-1.5 px-3 py-2 text-sm transition-colors ${
              tab === t
                ? "border-b-2 border-primary text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t === "preview" ? <Eye className="h-3.5 w-3.5" /> : <FileText className="h-3.5 w-3.5" />}
            {t === "preview" ? "Preview" : "Tips"}
          </button>
        ))}
      </div>

      {tab === "preview" ? (
        <div className="min-h-[420px] overflow-y-auto bg-background p-5">
          {title || body ? (
            <>
              {title && (
                <h1 className="stencil mb-4 text-2xl leading-tight text-foreground">{title}</h1>
              )}
              {body ? (
                <Markdown content={body} />
              ) : (
                <p className="label-mono text-muted-foreground">Start writing to see the preview…</p>
              )}
            </>
          ) : (
            <div className="flex h-full min-h-[380px] flex-col items-center justify-center gap-3 text-center">
              <Eye className="h-8 w-8 text-muted-foreground/40" />
              <p className="label-mono text-sm text-muted-foreground">
                Your post preview appears here as you write.
              </p>
            </div>
          )}
        </div>
      ) : (
        <div className="min-h-[420px] bg-background p-5">
          <h3 className="stencil mb-4 text-base text-foreground">Markdown Tips</h3>
          <div className="flex flex-col gap-3">
            {[
              ["**bold**", "Bold text"],
              ["_italic_", "Italic text"],
              ["## Heading", "Section heading"],
              ["> blockquote", "Pull quote"],
              ["- item", "Bullet list"],
              ["1. item", "Numbered list"],
              ["`code`", "Inline code"],
              ["[text](url)", "Hyperlink"],
              ["![alt](url)", "Image"],
              ["---", "Horizontal rule"],
            ].map(([syntax, label]) => (
              <div key={syntax} className="flex items-center gap-3">
                <code className="label-mono rounded border border-border bg-muted/40 px-2 py-0.5 text-xs text-foreground">
                  {syntax}
                </code>
                <span className="text-sm text-muted-foreground">{label}</span>
              </div>
            ))}
          </div>
          <p className="label-mono mt-6 text-xs text-muted-foreground">
            Use the Upload button in the editor toolbar to insert images from your device.
          </p>
        </div>
      )}
    </aside>
  )
}
