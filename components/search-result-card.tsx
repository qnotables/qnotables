"use client"

import Link from "next/link"
import { ArrowUpRight, Bookmark, Check, Copy, ExternalLink, FileText, MessageSquare, Play, Share2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { getHighlightSegments, type SearchResult } from "@/lib/search-utils"

const typeLabels: Record<SearchResult["type"], string> = {
  archives: "ARCHIVE",
  documents: "DOCUMENT",
  media: "MEDIA",
  "town-hall": "TOWN HALL",
  news: "NEWS / RSS",
}

function HighlightedText({ text, query }: { text: string; query: string }) {
  return (
    <>
      {getHighlightSegments(text, query).map((part, index) =>
        part.match ? <mark key={`${part.text}-${index}`} className="bg-primary/30 text-foreground">{part.text}</mark> : part.text,
      )}
    </>
  )
}

function formatDate(value: string | null): string {
  if (!value) return "DATE UNKNOWN"
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? "DATE UNKNOWN" : date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }).toUpperCase()
}

interface SearchResultCardProps {
  result: SearchResult
  query: string
  saved: boolean
  copied: boolean
  onSave: () => void
  onCopy: () => void
  onShare: () => void
}

export function SearchResultCard({ result, query, saved, copied, onSave, onCopy, onShare }: SearchResultCardProps) {
  const Icon = result.type === "media" ? Play : result.type === "town-hall" ? MessageSquare : result.type === "documents" ? FileText : ArrowUpRight
  const target = result.external ? { target: "_blank", rel: "noopener noreferrer" } : {}

  return (
    <article className="group border border-border bg-card/70 transition-colors hover:border-primary/70">
      <div className="flex gap-4 p-4 md:p-5">
        <div className="hidden size-10 shrink-0 items-center justify-center border border-border bg-background text-primary sm:flex" aria-hidden="true">
          <Icon className="size-4" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className="label-mono rounded-none border-primary/50 text-primary">{typeLabels[result.type]}</Badge>
            {result.contentType && <span className="label-mono text-muted-foreground">{result.contentType}</span>}
            {result.primarySource && <span className="label-mono text-primary">PRIMARY SOURCE</span>}
            {result.external && <ExternalLink className="size-3.5 text-muted-foreground" aria-label="External source" />}
          </div>
          <Link href={result.href} {...target} className="mt-2 block text-pretty font-heading text-xl font-semibold leading-tight text-foreground transition-colors group-hover:text-primary md:text-2xl">
            <HighlightedText text={result.title} query={query} />
          </Link>
          <p className="mt-2 max-w-4xl text-sm leading-6 text-muted-foreground">
            <HighlightedText text={result.excerpt || "No public excerpt is available for this record."} query={query} />
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-2 text-xs text-muted-foreground">
            <span className="label-mono text-foreground/75">{result.source ?? "QNotables"}</span>
            <span aria-hidden="true">·</span>
            <span>{formatDate(result.date)}</span>
            {result.author && <><span aria-hidden="true">·</span><span>{result.author}</span></>}
            {result.replies !== null && <><span aria-hidden="true">·</span><span>{result.replies} replies</span></>}
            {result.readMinutes && <><span aria-hidden="true">·</span><span>{result.readMinutes} min read</span></>}
          </div>
          {result.tags.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {result.tags.slice(0, 5).map((tag) => <span key={tag} className="label-mono border border-border px-2 py-1 text-[10px] text-muted-foreground">{tag}</span>)}
            </div>
          )}
        </div>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border bg-background/35 px-4 py-2.5 md:px-5">
        <Link href={result.href} {...target} className="label-mono inline-flex items-center gap-2 text-primary transition-opacity hover:opacity-75">
          Open record <ArrowUpRight className="size-3.5" />
        </Link>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" onClick={onSave} aria-label={saved ? "Remove from research panel" : "Save to research panel"} className={cn("label-mono text-muted-foreground", saved && "text-primary")}>
            {saved ? <Check data-icon="inline-start" /> : <Bookmark data-icon="inline-start" />}{saved ? "Saved" : "Save"}
          </Button>
          <Button variant="ghost" size="sm" onClick={onCopy} aria-label="Copy record link" className="label-mono text-muted-foreground">
            {copied ? <Check data-icon="inline-start" /> : <Copy data-icon="inline-start" />}{copied ? "Copied" : "Copy"}
          </Button>
          <Button variant="ghost" size="icon-sm" onClick={onShare} aria-label="Share record" className="text-muted-foreground"><Share2 /></Button>
        </div>
      </div>
    </article>
  )
}
