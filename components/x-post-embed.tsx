"use client"

import { useEffect, useRef } from "react"
import { ExternalLink } from "lucide-react"

interface XPostEmbedProps {
  url: string
  compact?: boolean
}

type TwitterWidgets = {
  widgets?: {
    load: (element?: HTMLElement) => Promise<unknown> | void
  }
}

declare global {
  interface Window {
    twttr?: TwitterWidgets
  }
}

let widgetScriptPromise: Promise<void> | null = null

function loadTwitterWidgets(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve()
  if (window.twttr?.widgets) return Promise.resolve()
  if (widgetScriptPromise) return widgetScriptPromise

  widgetScriptPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(
      'script[src="https://platform.twitter.com/widgets.js"]',
    )
    if (existing) {
      existing.addEventListener("load", () => resolve(), { once: true })
      existing.addEventListener("error", () => reject(new Error("X widget script failed to load")), { once: true })
      return
    }

    const script = document.createElement("script")
    script.src = "https://platform.twitter.com/widgets.js"
    script.async = true
    script.charset = "utf-8"
    script.onload = () => resolve()
    script.onerror = () => reject(new Error("X widget script failed to load"))
    document.head.appendChild(script)
  })

  return widgetScriptPromise
}

export function XPostEmbed({ url, compact = false }: XPostEmbedProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let cancelled = false

    loadTwitterWidgets()
      .then(() => {
        if (!cancelled && containerRef.current && window.twttr?.widgets) {
          void window.twttr.widgets.load(containerRef.current)
        }
      })
      .catch(() => {
        // The external widget is optional; the accessible fallback remains available.
      })

    return () => {
      cancelled = true
    }
  }, [url])

  return (
    <div
      ref={containerRef}
      className={compact ? "flex flex-col items-center gap-3 px-4 py-4" : "px-4 py-5 sm:px-6"}
    >
      <blockquote className="twitter-tweet" data-dnt="true">
        <a href={url} target="_blank" rel="noopener noreferrer nofollow">
          View this post on X
        </a>
      </blockquote>
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer nofollow"
        className="label-mono inline-flex items-center gap-2 border border-border px-4 py-2 text-sm text-foreground transition-colors hover:border-primary"
      >
        <ExternalLink className="size-3.5" />
        View on X
      </a>
    </div>
  )
}
