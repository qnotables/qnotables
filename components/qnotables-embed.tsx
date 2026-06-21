"use client"

import { ExternalLink, NotebookPen } from "lucide-react"

/**
 * Change EMBED_URL to swap which website is displayed.
 * It must allow embedding via iframe (no X-Frame-Options: DENY).
 */
const EMBED_URL = "https://8kun.top/qresearch/res/24671999.html#bottom"
const EMBED_LABEL = "Qnotables"

export function QnotablesEmbed() {
  return (
    <div className="flex flex-col gap-0 border border-border bg-card">
      {/* Embed header bar */}
      <div className="flex items-center justify-between border-b border-border bg-muted/60 px-4 py-2.5">
        <div className="flex items-center gap-2">
          <NotebookPen className="h-4 w-4 text-primary" aria-hidden="true" />
          <span className="label-mono text-sm font-semibold text-foreground">{EMBED_LABEL}</span>
          <span className="label-mono hidden text-xs text-muted-foreground sm:inline">
            // EMBEDDED RESOURCE
          </span>
        </div>
        <a
          href={EMBED_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 label-mono text-xs text-muted-foreground transition-colors hover:text-primary"
          aria-label={`Open ${EMBED_LABEL} in a new tab`}
        >
          <ExternalLink className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">OPEN IN NEW TAB</span>
        </a>
      </div>

      {/* Full-width iframe */}
      <div className="relative w-full" style={{ height: "80vh", minHeight: "600px" }}>
        <iframe
          src={EMBED_URL}
          title={EMBED_LABEL}
          className="absolute inset-0 h-full w-full border-0"
          loading="lazy"
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox"
        />
      </div>

      {/* Footer attribution */}
      <div className="flex items-center justify-between border-t border-border bg-muted/40 px-4 py-2">
        <span className="label-mono text-xs text-muted-foreground">
          SOURCE // {EMBED_URL}
        </span>
        <a
          href={EMBED_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="label-mono text-xs text-primary hover:underline"
        >
          {EMBED_URL} →
        </a>
      </div>
    </div>
  )
}
