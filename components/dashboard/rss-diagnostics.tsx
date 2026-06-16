"use client"

import { useState } from "react"
import { Copy, Check, ExternalLink, FileCode, ListChecks, Eye } from "lucide-react"

export function RssDiagnostics({ feedUrl }: { feedUrl: string }) {
  const [copied, setCopied] = useState(false)

  async function copy() {
    try {
      await navigator.clipboard.writeText(feedUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error("[v0] copy feed url failed:", err)
    }
  }

  const links = [
    { href: "/feed.xml", label: "Open /feed.xml", icon: FileCode },
    { href: "/api/rss/validate", label: "Run validation", icon: ListChecks },
    { href: "/api/rss/preview", label: "Preview items", icon: Eye },
  ]

  return (
    <div className="flex flex-col gap-4 border border-border bg-card p-4">
      <div className="flex flex-col gap-2">
        <span className="label-mono text-[11px] uppercase text-muted-foreground">Public Feed URL</span>
        <div className="flex items-center gap-2">
          <code className="flex-1 truncate border border-border bg-background px-3 py-2 text-sm text-foreground">
            {feedUrl}
          </code>
          <button
            type="button"
            onClick={copy}
            className="label-mono inline-flex items-center gap-2 border border-border bg-background px-3 py-2 text-sm text-muted-foreground transition-colors hover:border-primary hover:text-primary"
            title="Copy feed URL"
          >
            {copied ? <Check className="h-4 w-4 text-primary" /> : <Copy className="h-4 w-4" />}
            {copied ? "Copied" : "Copy"}
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {links.map(({ href, label, icon: Icon }) => (
          <a
            key={href}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="label-mono inline-flex items-center gap-2 border border-border bg-background px-3 py-2 text-sm text-muted-foreground transition-colors hover:border-primary hover:text-primary"
          >
            <Icon className="h-4 w-4" /> {label}
            <ExternalLink className="h-3 w-3" />
          </a>
        ))}
      </div>
    </div>
  )
}
