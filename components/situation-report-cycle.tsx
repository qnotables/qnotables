"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import Link from "next/link"
import Image from "next/image"
import {
  MessageSquare,
  MessageCircle,
  Clock,
  ChevronLeft,
  ChevronRight,
  FileText,
  Archive,
  BookOpen,
  Users,
  AlertTriangle,
} from "lucide-react"
import { timeAgo } from "@/lib/time"

// ─── Types ──────────────────────────────────────────────────────────────────

export interface SituationForumItem {
  type: "forum"
  id: string
  title: string
  body: string
  authorName: string
  createdAt: string
  replyCount: number
  category?: string
  isFeatured?: boolean
}

export interface SituationBlogItem {
  type: "blog"
  id?: string
  slug: string
  title: string
  excerpt: string
  category?: string
  tag?: string
  tags?: string[]
  coverImage?: string | null
  date: string
  readMinutes?: number
  featured?: boolean
  priority?: string
  postType?: string
  sourceName?: string
}

export interface SituationArchiveItem {
  type: "archive"
  id?: string
  slug: string
  title: string
  excerpt: string
  category?: string
  tag?: string
  postType?: string
  priority?: string
  featured?: boolean
  coverImage?: string | null
  sourceName?: string
  date: string
  readMinutes?: number
}

export type SituationItem = SituationForumItem | SituationBlogItem | SituationArchiveItem

// ─── Strip markdown ──────────────────────────────────────────────────────────

function stripMarkdown(md: string): string {
  return md
    .replace(/\[([^\]]+)\]\([^\)]*\)/g, "$1")
    .replace(/!\[[^\]]*\]\([^\)]*\)/g, "")
    .replace(/[*_`~#>]/g, "")
    .replace(/\s+/g, " ")
    .trim()
}

// ─── Priority badge ──────────────────────────────────────────────────────────

function PriorityBadge({ priority }: { priority?: string }) {
  if (!priority || priority === "low" || priority === "medium") return null
  const label = priority === "critical" ? "CRITICAL" : "HIGH"
  const cls =
    priority === "critical"
      ? "bg-destructive/15 text-destructive border border-destructive/30"
      : "bg-primary/10 text-primary border border-primary/30"
  return (
    <span className={`label-mono px-1.5 py-0.5 text-[10px] font-semibold ${cls}`}>
      {label}
    </span>
  )
}

// ─── Forum card ──────────────────────────────────────────────────────────────

function ForumHotCard({ item }: { item: SituationForumItem }) {
  const preview = stripMarkdown(item.body).slice(0, 140)
  return (
    <div className="flex flex-col gap-3 h-full">
      {/* Label row */}
      <div className="flex items-center gap-2">
        <span className="flex items-center gap-1.5 label-mono text-[11px] font-semibold text-primary">
          <Users className="h-3 w-3" />
          HOTTEST FORUM THREAD
        </span>
        {item.isFeatured && (
          <span className="label-mono px-1.5 py-0.5 text-[10px] font-semibold bg-primary/10 text-primary border border-primary/30">
            FEATURED
          </span>
        )}
        {item.category && (
          <span className="label-mono px-1.5 py-0.5 text-[10px] bg-muted text-muted-foreground border border-border">
            {item.category.toUpperCase()}
          </span>
        )}
      </div>

      {/* Title */}
      <h3 className="stencil text-xl md:text-2xl leading-tight text-foreground line-clamp-3">
        {item.title}
      </h3>

      {/* Body preview */}
      {preview && (
        <p className="text-sm text-muted-foreground line-clamp-2 flex-1">{preview}</p>
      )}

      {/* Meta row */}
      <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground label-mono mt-auto">
        <span>{item.authorName}</span>
        <div className="flex items-center gap-1">
          <Clock className="h-3 w-3" />
          <span>{timeAgo(new Date(item.createdAt))}</span>
        </div>
        <div className="flex items-center gap-1">
          <MessageCircle className="h-3 w-3" />
          <span>
            {item.replyCount} {item.replyCount === 1 ? "reply" : "replies"}
          </span>
        </div>
      </div>

      {/* CTA */}
      <Link
        href={`/forum/${item.id}`}
        className="label-mono mt-2 inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline"
      >
        <MessageSquare className="h-3.5 w-3.5" />
        JOIN DISCUSSION →
      </Link>
    </div>
  )
}

// ─── Blog card ───────────────────────────────────────────────────────────────

function BlogHotCard({ item }: { item: SituationBlogItem }) {
  const allTags = [
    ...(item.tag ? [item.tag] : []),
    ...(item.tags?.filter((t) => t !== item.tag) ?? []),
  ].slice(0, 3)

  return (
    <div className="flex flex-col gap-3 h-full">
      {/* Cover image */}
      {item.coverImage && (
        <div className="relative w-full overflow-hidden bg-muted" style={{ aspectRatio: "16/7" }}>
          <Image
            src={item.coverImage}
            alt={item.title}
            fill
            className="object-cover opacity-90"
            sizes="(max-width: 768px) 100vw, 640px"
          />
          {item.featured && (
            <span className="absolute left-2 top-2 label-mono px-2 py-0.5 text-[10px] font-semibold bg-primary text-primary-foreground">
              FEATURED
            </span>
          )}
        </div>
      )}

      {/* Label row */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="flex items-center gap-1.5 label-mono text-[11px] font-semibold text-primary">
          <BookOpen className="h-3 w-3" />
          HOTTEST BLOG DISPATCH
        </span>
        {item.postType && (
          <span className="label-mono px-1.5 py-0.5 text-[10px] bg-muted text-muted-foreground border border-border">
            {item.postType.toUpperCase()}
          </span>
        )}
        <PriorityBadge priority={item.priority} />
      </div>

      {/* Title */}
      <h3 className="stencil text-xl md:text-2xl leading-tight text-foreground line-clamp-3">
        {item.title}
      </h3>

      {/* Excerpt */}
      {item.excerpt && (
        <p className="text-sm text-muted-foreground line-clamp-2 flex-1">{item.excerpt}</p>
      )}

      {/* Tags */}
      {allTags.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-1">
          {allTags.map((t) => (
            <span
              key={t}
              className="label-mono px-1.5 py-0.5 text-[10px] bg-muted text-muted-foreground border border-border"
            >
              {t.toUpperCase()}
            </span>
          ))}
        </div>
      )}

      {/* Meta */}
      <div className="flex items-center gap-3 text-xs text-muted-foreground label-mono mt-auto">
        <div className="flex items-center gap-1">
          <Clock className="h-3 w-3" />
          <span>
            {new Date(item.date).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </span>
        </div>
        {item.readMinutes && (
          <>
            <span className="text-border">•</span>
            <span>{item.readMinutes} MIN</span>
          </>
        )}
        {item.sourceName && (
          <>
            <span className="text-border">•</span>
            <span>{item.sourceName}</span>
          </>
        )}
      </div>

      {/* CTA */}
      <Link
        href={`/blog/${item.slug}`}
        className="label-mono mt-2 inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline"
      >
        <BookOpen className="h-3.5 w-3.5" />
        READ DISPATCH →
      </Link>
    </div>
  )
}

// ─── Archive card ────────────────────────────────────────────────────────────

function ArchiveHotCard({ item }: { item: SituationArchiveItem }) {
  const isFieldNote = item.postType === "Field Note"
  const label = isFieldNote ? "FEATURED FIELD NOTE" : "FEATURED ARCHIVE RECORD"
  const Icon = isFieldNote ? FileText : Archive

  return (
    <div className="flex flex-col gap-3 h-full">
      {/* Cover image */}
      {item.coverImage && (
        <div className="relative w-full overflow-hidden bg-muted" style={{ aspectRatio: "16/7" }}>
          <Image
            src={item.coverImage}
            alt={item.title}
            fill
            className="object-cover opacity-90"
            sizes="(max-width: 768px) 100vw, 640px"
          />
          {item.featured && (
            <span className="absolute left-2 top-2 label-mono px-2 py-0.5 text-[10px] font-semibold bg-primary text-primary-foreground">
              FEATURED
            </span>
          )}
        </div>
      )}

      {/* Label row */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="flex items-center gap-1.5 label-mono text-[11px] font-semibold text-primary">
          <Icon className="h-3 w-3" />
          {label}
        </span>
        {item.postType && (
          <span className="label-mono px-1.5 py-0.5 text-[10px] bg-muted text-muted-foreground border border-border">
            {item.postType.toUpperCase()}
          </span>
        )}
        <PriorityBadge priority={item.priority} />
      </div>

      {/* Title */}
      <h3 className="stencil text-xl md:text-2xl leading-tight text-foreground line-clamp-3">
        {item.title}
      </h3>

      {/* Excerpt */}
      {item.excerpt && (
        <p className="text-sm text-muted-foreground line-clamp-2 flex-1">{item.excerpt}</p>
      )}

      {/* Meta */}
      <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground label-mono mt-auto">
        <div className="flex items-center gap-1">
          <Clock className="h-3 w-3" />
          <span>
            {new Date(item.date).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </span>
        </div>
        {item.category && (
          <>
            <span className="text-border">•</span>
            <span>{item.category.toUpperCase()}</span>
          </>
        )}
        {item.sourceName && (
          <>
            <span className="text-border">•</span>
            <span>{item.sourceName}</span>
          </>
        )}
      </div>

      {/* CTA */}
      <Link
        href={`/archives/${item.slug}`}
        className="label-mono mt-2 inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline"
      >
        <Archive className="h-3.5 w-3.5" />
        OPEN RECORD →
      </Link>
    </div>
  )
}

// ─── Empty state card ────────────────────────────────────────────────────────

function EmptyCard({ label, icon: Icon }: { label: string; icon: React.ElementType }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 h-full py-8 text-muted-foreground">
      <Icon className="h-8 w-8 opacity-30" />
      <p className="label-mono text-xs text-center opacity-60">NO {label} AVAILABLE</p>
    </div>
  )
}

// ─── Main cycle component ────────────────────────────────────────────────────

interface SituationReportCycleProps {
  forumItem: SituationForumItem | null
  blogItem: SituationBlogItem | null
  archiveItem: SituationArchiveItem | null
}

const CYCLE_INTERVAL = 10000 // 10 seconds
const TABS = [
  { key: "forum", label: "FORUM", icon: Users },
  { key: "blog", label: "DISPATCH", icon: BookOpen },
  { key: "archive", label: "ARCHIVE", icon: Archive },
] as const

type TabKey = (typeof TABS)[number]["key"]

export function SituationReportCycle({
  forumItem,
  blogItem,
  archiveItem,
}: SituationReportCycleProps) {
  const [active, setActive] = useState<TabKey>("forum")
  const [isPaused, setIsPaused] = useState(false)
  const [reducedMotion, setReducedMotion] = useState(false)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Detect reduced-motion preference
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)")
    setReducedMotion(mq.matches)
    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches)
    mq.addEventListener("change", handler)
    return () => mq.removeEventListener("change", handler)
  }, [])

  const advance = useCallback(() => {
    setActive((prev) => {
      const idx = TABS.findIndex((t) => t.key === prev)
      return TABS[(idx + 1) % TABS.length].key
    })
  }, [])

  const retreat = useCallback(() => {
    setActive((prev) => {
      const idx = TABS.findIndex((t) => t.key === prev)
      return TABS[(idx - 1 + TABS.length) % TABS.length].key
    })
  }, [])

  // Auto-cycle (disabled for reduced-motion)
  useEffect(() => {
    if (reducedMotion || isPaused) {
      if (timerRef.current) clearInterval(timerRef.current)
      return
    }
    timerRef.current = setInterval(advance, CYCLE_INTERVAL)
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [advance, isPaused, reducedMotion])

  const activeIdx = TABS.findIndex((t) => t.key === active)

  function renderCard() {
    switch (active) {
      case "forum":
        return forumItem ? (
          <ForumHotCard item={forumItem} />
        ) : (
          <EmptyCard label="FORUM ACTIVITY" icon={Users} />
        )
      case "blog":
        return blogItem ? (
          <BlogHotCard item={blogItem} />
        ) : (
          <EmptyCard label="BLOG DISPATCH" icon={BookOpen} />
        )
      case "archive":
        return archiveItem ? (
          <ArchiveHotCard item={archiveItem} />
        ) : (
          <EmptyCard label="ARCHIVE RECORD" icon={Archive} />
        )
    }
  }

  return (
    <div
      className="border border-border bg-card overflow-hidden"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Tab bar */}
      <div className="flex items-center border-b border-border">
        {TABS.map((tab) => {
          const Icon = tab.icon
          const isActive = active === tab.key
          return (
            <button
              key={tab.key}
              onClick={() => setActive(tab.key)}
              className={`flex items-center gap-1.5 px-4 py-2.5 label-mono text-[11px] font-semibold transition-colors border-r border-border last:border-r-0 ${
                isActive
                  ? "bg-primary/10 text-primary border-b-2 border-b-primary -mb-px"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              }`}
              aria-selected={isActive}
              aria-label={`Show ${tab.label}`}
            >
              <Icon className="h-3 w-3" />
              {tab.label}
            </button>
          )
        })}

        {/* Spacer + controls */}
        <div className="ml-auto flex items-center gap-1 px-2">
          <button
            onClick={retreat}
            aria-label="Previous"
            className="p-1.5 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>

          {/* Dot indicators */}
          <div className="flex items-center gap-1 px-1">
            {TABS.map((_, i) => (
              <button
                key={i}
                onClick={() => setActive(TABS[i].key)}
                aria-label={`Go to slide ${i + 1}`}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i === activeIdx
                    ? "w-4 bg-primary"
                    : "w-1.5 bg-border hover:bg-muted-foreground"
                }`}
              />
            ))}
          </div>

          <button
            onClick={advance}
            aria-label="Next"
            className="p-1.5 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Card content */}
      <div className="p-4 md:p-6 min-h-[260px]">{renderCard()}</div>

      {/* Progress bar (auto-cycle indicator) */}
      {!reducedMotion && !isPaused && (
        <div className="h-px bg-border">
          <div
            key={active}
            className="h-full bg-primary/60 animate-[shrink_10s_linear_forwards]"
            style={{ width: "100%" }}
          />
        </div>
      )}
    </div>
  )
}
