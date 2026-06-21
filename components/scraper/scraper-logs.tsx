"use client"

import { useState } from "react"
import {
  CheckCircle,
  XCircle,
  ChevronDown,
  ChevronUp,
  Clock,
  Rss,
  Globe,
} from "lucide-react"
import type { ScrapeLog, SourceResult } from "@/lib/scraper/types"
import { cn } from "@/lib/utils"

function formatDate(iso: string | null) {
  if (!iso) return "—"
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

function durationMs(start: string, end: string | null) {
  if (!end) return null
  const ms = new Date(end).getTime() - new Date(start).getTime()
  if (ms < 1000) return `${ms}ms`
  return `${(ms / 1000).toFixed(1)}s`
}

function SourceRow({ source }: { source: SourceResult }) {
  return (
    <div
      className={cn(
        "flex flex-col gap-1 border-l-2 py-2 pl-4 pr-2 text-xs",
        source.success ? "border-green-600" : "border-destructive",
      )}
    >
      <div className="flex items-center gap-2">
        {source.sourceType === "rss" ? (
          <Rss className="h-3 w-3 shrink-0 text-primary" />
        ) : (
          <Globe className="h-3 w-3 shrink-0 text-primary" />
        )}
        <span className="font-medium text-foreground">{source.sourceName}</span>
        <span className="text-muted-foreground">{source.sourceUrl}</span>
        <span
          className={cn(
            "label-mono ml-auto shrink-0 px-1.5 py-0.5 text-[10px] uppercase",
            source.success
              ? "bg-green-600/10 text-green-600"
              : "bg-destructive/10 text-destructive",
          )}
        >
          {source.success ? "OK" : "FAIL"}
        </span>
      </div>

      <div className="label-mono flex flex-wrap items-center gap-x-4 gap-y-0.5 text-[11px] text-muted-foreground">
        <span>{source.itemsFound} found</span>
        <span className="text-green-600">+{source.newPosts} new</span>
        <span>{source.skippedDupes} dupes</span>
        {source.error && (
          <span className="text-destructive">Error: {source.error}</span>
        )}
      </div>
    </div>
  )
}

function LogRow({ log }: { log: ScrapeLog }) {
  const [expanded, setExpanded] = useState(false)
  const duration = durationMs(log.started_at, log.finished_at)
  const hasFailures = log.failed > 0

  return (
    <div className="border-b border-border last:border-0">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-center gap-4 px-4 py-3 text-left transition-colors hover:bg-muted/20"
        aria-expanded={expanded}
      >
        {/* Status icon */}
        <div className="shrink-0">
          {hasFailures ? (
            <XCircle className="h-4 w-4 text-destructive" />
          ) : (
            <CheckCircle className="h-4 w-4 text-green-600" />
          )}
        </div>

        {/* Date */}
        <span className="label-mono w-44 shrink-0 text-xs text-foreground">
          {formatDate(log.started_at)}
        </span>

        {/* Trigger */}
        <span
          className={cn(
            "label-mono shrink-0 border px-2 py-0.5 text-[10px] uppercase",
            log.triggered_by === "manual"
              ? "border-primary text-primary"
              : "border-border text-muted-foreground",
          )}
        >
          {log.triggered_by}
        </span>

        {/* Stats */}
        <div className="label-mono flex flex-1 flex-wrap items-center gap-x-4 gap-y-0.5 text-xs">
          <span className="text-muted-foreground">
            {log.total_sources} source{log.total_sources !== 1 ? "s" : ""}
          </span>
          <span className="text-green-600">+{log.new_posts} new</span>
          <span className="text-muted-foreground">{log.skipped_dupes} dupes</span>
          {log.failed > 0 && (
            <span className="text-destructive">{log.failed} failed</span>
          )}
          {duration && (
            <span className="ml-auto flex items-center gap-1 text-muted-foreground">
              <Clock className="h-3 w-3" />
              {duration}
            </span>
          )}
        </div>

        {/* Expand toggle */}
        <div className="shrink-0 text-muted-foreground">
          {expanded ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </div>
      </button>

      {/* Per-source details */}
      {expanded && log.details && log.details.length > 0 && (
        <div className="border-t border-border bg-muted/10 px-4 py-3">
          <div className="flex flex-col gap-2">
            {log.details.map((source, i) => (
              <SourceRow key={`${source.sourceUrl}-${i}`} source={source} />
            ))}
          </div>
        </div>
      )}

      {expanded && (!log.details || log.details.length === 0) && (
        <div className="border-t border-border px-8 py-3">
          <p className="label-mono text-xs text-muted-foreground">No source details recorded.</p>
        </div>
      )}
    </div>
  )
}

export function ScraperLogs({ logs }: { logs: ScrapeLog[] }) {
  if (logs.length === 0) {
    return (
      <div className="border border-border bg-muted/20 px-6 py-12 text-center">
        <p className="label-mono text-sm text-muted-foreground">No scrape runs yet.</p>
        <p className="label-mono mt-1 text-xs text-muted-foreground">
          Click &quot;Run Now&quot; or wait for the cron job (every 4 hours).
        </p>
      </div>
    )
  }

  return (
    <div className="divide-y-0 border border-border">
      {logs.map((log) => (
        <LogRow key={log.id} log={log} />
      ))}
    </div>
  )
}
