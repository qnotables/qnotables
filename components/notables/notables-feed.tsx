"use client"

import { useState, useTransition, useCallback } from "react"
import Image from "next/image"
import {
  Search,
  Calendar,
  Tag,
  ExternalLink,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Copy,
  Check,
  Share2,
} from "lucide-react"
import { getNotables, type NotablesPost } from "@/app/actions/notables-actions"

interface Props {
  initialItems: NotablesPost[]
  initialTotal: number
  boards: string[]
}

const PAGE_SIZE = 20

// Format a date as a stable YYYY-MM-DD string (no locale, no timezone shift)
function formatDate(iso: string | null): string {
  if (!iso) return "—"
  try {
    return iso.slice(0, 10) // "2026-06-24"
  } catch {
    return iso
  }
}

// Sanitize HTML client-side only (DOMPurify requires DOM)
function safeHtml(raw: string | null): string {
  if (!raw || typeof window === "undefined") return raw ?? ""
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const DOMPurify = require("dompurify")
    return DOMPurify.sanitize(raw, {
      ALLOWED_TAGS: ["b", "i", "em", "strong", "a", "br", "p", "ul", "li", "ol", "span"],
      ALLOWED_ATTR: ["href", "class", "target", "rel"],
    })
  } catch {
    return raw
  }
}

// Extract plain text excerpt from Tiptap JSON body (falls back to excerpt field)
function extractExcerpt(body: string | null, excerpt: string | null): string {
  if (excerpt) return excerpt
  if (!body) return ""
  try {
    const doc = JSON.parse(body)
    const texts: string[] = []
    function walk(node: { type?: string; text?: string; content?: unknown[] }) {
      if (node.text) texts.push(node.text)
      if (node.content) (node.content as typeof node[]).forEach(walk)
    }
    walk(doc)
    return texts.join(" ").slice(0, 300)
  } catch {
    // body might be raw HTML
    return body.replace(/<[^>]+>/g, " ").slice(0, 300)
  }
}

// Extract Rumble embed URL from Tiptap JSON body
function extractRumbleEmbed(body: string | null): string | null {
  if (!body) return null
  try {
    const doc = JSON.parse(body)
    function findEmbed(node: { type?: string; attrs?: Record<string, unknown>; content?: unknown[] }): string | null {
      if (
        node.type === "embedBlock" &&
        node.attrs?.url &&
        typeof node.attrs.url === "string" &&
        node.attrs.url.includes("rumble.com")
      ) {
        // Convert watch URL to embed URL: https://rumble.com/v... -> https://rumble.com/embed/v...
        const url = node.attrs.url as string
        const match = url.match(/rumble\.com\/([a-zA-Z0-9_-]+)\.html/) ?? url.match(/rumble\.com\/embed\/([a-zA-Z0-9_-]+)/)
        if (match) return `https://rumble.com/embed/${match[1]}/`
        // If already an embed URL
        if (url.includes("/embed/")) return url
      }
      if (node.content) {
        for (const child of node.content as typeof node[]) {
          const found = findEmbed(child)
          if (found) return found
        }
      }
      return null
    }
    return findEmbed(doc)
  } catch {
    return null
  }
}

// Share button component
function ShareButtons({ url, title }: { url: string; title: string }) {
  const [copied, setCopied] = useState(false)
  const encoded = encodeURIComponent(url)
  const encodedTitle = encodeURIComponent(title)

  const shareLinks = [
    {
      label: "X",
      href: `https://x.com/intent/tweet?text=${encodedTitle}&url=${encoded}`,
      icon: (
        <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 fill-current" aria-hidden="true">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      ),
    },
    {
      label: "Facebook",
      href: `https://www.facebook.com/sharer/sharer.php?u=${encoded}`,
      icon: (
        <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 fill-current" aria-hidden="true">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
        </svg>
      ),
    },
    {
      label: "Telegram",
      href: `https://t.me/share/url?url=${encoded}&text=${encodedTitle}`,
      icon: (
        <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 fill-current" aria-hidden="true">
          <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.96 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
        </svg>
      ),
    },
    {
      label: "Truth",
      href: `https://truthsocial.com/share?title=${encodedTitle}&url=${encoded}`,
      icon: (
        <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 fill-current" aria-hidden="true">
          <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.5 7h-3v1.5h3V7zm-3 3h-5V8.5h5V10zm-6.5 0H6V8.5h2V10zm6.5 2h-5v-1.5h5V12zm-6.5 0H6V10.5h2V12zm1.5 4.5v-3h5v3h-5zm-3-3h2v3H9v-3z" />
        </svg>
      ),
    },
    {
      label: "Rumble",
      href: `https://rumble.com/`,
      icon: (
        <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 fill-current" aria-hidden="true">
          <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm-2 16.5v-9l7 4.5-7 4.5z" />
        </svg>
      ),
    },
  ]

  function handleCopy() {
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <div className="flex items-center gap-1.5" aria-label="Share buttons">
      <Share2 className="h-3 w-3 shrink-0 text-muted-foreground" aria-hidden="true" />
      {shareLinks.map((s) => (
        <a
          key={s.label}
          href={s.href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Share on ${s.label}`}
          className="flex h-6 w-6 items-center justify-center border border-border text-muted-foreground transition-colors hover:border-primary hover:text-primary"
        >
          {s.icon}
        </a>
      ))}
      <button
        onClick={handleCopy}
        aria-label="Copy link"
        className="flex h-6 w-6 items-center justify-center border border-border text-muted-foreground transition-colors hover:border-primary hover:text-primary"
      >
        {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
      </button>
    </div>
  )
}

function NotablesCard({ item }: { item: NotablesPost }) {
  const [imgError, setImgError] = useState(false)
  const coverImage = item.cover_image ?? item.og_image_url
  const rumbleEmbed = extractRumbleEmbed(item.body)
  const excerptText = extractExcerpt(item.body, item.excerpt)
  const postUrl = item.source_url ?? `https://qnotables.com`

  return (
    <article className="border border-border bg-card overflow-hidden transition-colors hover:bg-muted/40">
      {/* Cover image */}
      {coverImage && !imgError && (
        <div className="relative w-full aspect-video bg-muted">
          <Image
            src={coverImage}
            alt={item.title}
            fill
            sizes="(max-width: 768px) 100vw, 800px"
            className="object-cover"
            onError={() => setImgError(true)}
            crossOrigin="anonymous"
          />
        </div>
      )}

      {/* Rumble embed (only if no cover image or after it) */}
      {rumbleEmbed && (
        <div className="relative w-full aspect-video bg-black">
          <iframe
            src={rumbleEmbed}
            title={item.title}
            className="absolute inset-0 h-full w-full"
            frameBorder="0"
            allowFullScreen
            loading="lazy"
          />
        </div>
      )}

      <div className="p-4">
        {/* Header row */}
        <div className="mb-2 flex flex-wrap items-start justify-between gap-2">
          {item.tag && (
            <span className="label-mono inline-flex items-center gap-1 border border-border bg-muted/40 px-2 py-0.5 text-[10px] uppercase text-muted-foreground">
              <Tag className="h-3 w-3" aria-hidden="true" />
              {item.tag}
            </span>
          )}
          <span
            className="label-mono ml-auto text-[10px] text-muted-foreground"
            suppressHydrationWarning
          >
            {formatDate(item.published_at ?? item.created_at)}
          </span>
        </div>

        {/* Title */}
        <h2 className="stencil mb-2 text-sm leading-snug text-foreground">{item.title}</h2>

        {/* Excerpt */}
        {excerptText && (
          <p className="mb-3 line-clamp-4 text-xs leading-relaxed text-muted-foreground">
            {excerptText}
          </p>
        )}

        {/* Footer: share + source */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-3">
          <ShareButtons url={postUrl} title={item.title} />
          {item.source_url && (
            <a
              href={item.source_url}
              target="_blank"
              rel="noopener noreferrer"
              className="label-mono flex items-center gap-1 text-[10px] text-primary hover:underline"
            >
              Source
              <ExternalLink className="h-3 w-3" aria-hidden="true" />
            </a>
          )}
        </div>
      </div>
    </article>
  )
}

export function NotablesFeed({ initialItems, initialTotal, boards }: Props) {
  const [items, setItems] = useState<NotablesPost[]>(initialItems)
  const [total, setTotal] = useState(initialTotal)
  const [search, setSearch] = useState("")
  const [board, setBoard] = useState("all")
  const [dateFrom, setDateFrom] = useState("")
  const [dateTo, setDateTo] = useState("")
  const [page, setPage] = useState(1)
  const [isPending, startTransition] = useTransition()

  const totalPages = Math.ceil(total / PAGE_SIZE)

  const fetchData = useCallback(
    (overrides?: { search?: string; board?: string; dateFrom?: string; dateTo?: string; page?: number }) => {
      startTransition(async () => {
        const s = overrides?.search ?? search
        const b = overrides?.board ?? board
        const df = overrides?.dateFrom ?? dateFrom
        const dt = overrides?.dateTo ?? dateTo
        const p = overrides?.page ?? page

        const result = await getNotables({
          search: s || undefined,
          tag: b !== "all" ? b : undefined,
          dateFrom: df || undefined,
          dateTo: dt || undefined,
          page: p,
          pageSize: PAGE_SIZE,
        })
        setItems(result.items)
        setTotal(result.total)
      })
    },
    [search, board, dateFrom, dateTo, page],
  )

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    setPage(1)
    fetchData({ page: 1 })
  }

  function handleBoardChange(val: string) {
    setBoard(val)
    setPage(1)
    fetchData({ board: val, page: 1 })
  }

  function handleDateFromChange(val: string) {
    setDateFrom(val)
    setPage(1)
    fetchData({ dateFrom: val, page: 1 })
  }

  function handleDateToChange(val: string) {
    setDateTo(val)
    setPage(1)
    fetchData({ dateTo: val, page: 1 })
  }

  function handleReset() {
    setSearch("")
    setBoard("all")
    setDateFrom("")
    setDateTo("")
    setPage(1)
    startTransition(async () => {
      const result = await getNotables({ page: 1, pageSize: PAGE_SIZE })
      setItems(result.items)
      setTotal(result.total)
    })
  }

  function handlePageChange(p: number) {
    setPage(p)
    fetchData({ page: p })
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Filters */}
      <div className="border border-border bg-card p-4">
        <form onSubmit={handleSearch} className="flex flex-wrap gap-3">
          <div className="relative min-w-[200px] flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search notables..."
              className="label-mono w-full border border-border bg-background py-2 pl-9 pr-3 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>

          <select
            value={board}
            onChange={(e) => handleBoardChange(e.target.value)}
            className="label-mono border border-border bg-background px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          >
            <option value="all">All Tags</option>
            {boards.map((b) => (
              <option key={b} value={b}>{b}</option>
            ))}
          </select>

          <div className="flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => handleDateFromChange(e.target.value)}
              className="label-mono border border-border bg-background px-2 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            />
            <span className="label-mono text-xs text-muted-foreground">to</span>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => handleDateToChange(e.target.value)}
              className="label-mono border border-border bg-background px-2 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>

          <button
            type="submit"
            className="label-mono border border-primary bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground transition-opacity hover:opacity-90"
          >
            SEARCH
          </button>
          <button
            type="button"
            onClick={handleReset}
            className="label-mono border border-border px-3 py-2 text-xs text-muted-foreground transition-colors hover:bg-muted/40"
          >
            RESET
          </button>
        </form>
      </div>

      {/* Count */}
      <div className="flex items-center justify-between">
        <p className="label-mono text-xs text-muted-foreground">
          {isPending ? "Loading…" : `${total.toLocaleString()} notable${total !== 1 ? "s" : ""}`}
          {total > 0 && !isPending && (
            <span className="ml-2 text-muted-foreground/60">
              — page {page} of {totalPages}
            </span>
          )}
        </p>
        {isPending && <RefreshCw className="h-4 w-4 animate-spin text-muted-foreground" aria-hidden="true" />}
      </div>

      {/* Items */}
      {items.length === 0 && !isPending ? (
        <div className="border border-dashed border-border bg-card px-6 py-12 text-center">
          <p className="label-mono text-sm text-muted-foreground">No notables found.</p>
          {(search || board !== "all" || dateFrom || dateTo) && (
            <button onClick={handleReset} className="label-mono mt-3 text-xs text-primary hover:underline">
              Clear filters
            </button>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {items.map((item) => (
            <NotablesCard key={item.id} item={item} />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <nav className="flex items-center justify-center gap-2" aria-label="Pagination">
          <button
            onClick={() => handlePageChange(page - 1)}
            disabled={page <= 1 || isPending}
            className="label-mono flex items-center gap-1 border border-border px-3 py-2 text-xs text-muted-foreground transition-colors hover:bg-muted/40 disabled:pointer-events-none disabled:opacity-40"
          >
            <ChevronLeft className="h-3.5 w-3.5" aria-hidden="true" />
            Prev
          </button>
          <span className="label-mono text-xs text-muted-foreground">{page} / {totalPages}</span>
          <button
            onClick={() => handlePageChange(page + 1)}
            disabled={page >= totalPages || isPending}
            className="label-mono flex items-center gap-1 border border-border px-3 py-2 text-xs text-muted-foreground transition-colors hover:bg-muted/40 disabled:pointer-events-none disabled:opacity-40"
          >
            Next
            <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
          </button>
        </nav>
      )}
    </div>
  )
}
