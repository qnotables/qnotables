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
  latestReply?: { body: string; authorName: string; createdAt: string } | null
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
  postType?: string
  priority?: string
  featured?: boolean
  coverImage?: string | null
  sourceName?: string
  date: string
  readMinutes?: number
  /** Raw Tiptap JSON string — used to extract inline videos for the card preview */
  content?: string
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

/** Extract the first https image URL from markdown body text. */
function firstImageInBody(body: string): string | null {
  // Markdown image: ![alt](url)
  const mdMatch = body.match(/!\[[^\]]*\]\((https?:\/\/[^)\s]+)\)/)
  if (mdMatch) return mdMatch[1]
  // Plain URL ending in common image extension
  const plainMatch = body.match(/https?:\/\/\S+\.(?:png|jpg|jpeg|gif|webp)(?:\?\S*)?/i)
  if (plainMatch) return plainMatch[0]
  return null
}

// ─── Video extraction from Tiptap JSON ───────────────────────────────────────

interface TiptapNode {
  type?: string
  attrs?: Record<string, string>
  content?: TiptapNode[]
}

interface ExtractedVideo {
  kind: "upload" | "embed"
  src: string   // direct URL for uploads; iframe embed URL for embeds
  title?: string
}

function extractFirstVideo(content?: string): ExtractedVideo | null {
  if (!content) return null
  let doc: TiptapNode
  try {
    doc = JSON.parse(content)
  } catch {
    return null
  }

  function walk(nodes?: TiptapNode[]): ExtractedVideo | null {
    if (!nodes) return null
    for (const node of nodes) {
      if (node.type === "videoBlock" && node.attrs?.src) {
        return { kind: "upload", src: node.attrs.src, title: node.attrs.title }
      }
      if (node.type === "embedBlock" && node.attrs?.src) {
        return { kind: "embed", src: node.attrs.src, title: node.attrs.title }
      }
      const found = walk(node.content)
      if (found) return found
    }
    return null
  }

  return walk(doc.content)
}

// ─── Shared thumbnail component ───────────────────────────────────────────────

interface ThumbnailProps {
  src?: string | null
  alt: string
  label?: string
  badge?: React.ReactNode
}

function Thumbnail({ src, alt, label, badge }: ThumbnailProps) {
  return (
    <div
      className="relative w-full overflow-hidden bg-muted/60 border-b border-border"
      style={{ aspectRatio: "16/7" }}
    >
      {src ? (
        <Image
          src={src}
          alt={alt}
          fill
          className="object-cover object-top opacity-90 transition-opacity duration-300"
          sizes="(max-width: 768px) 100vw, 640px"
        />
      ) : (
        /* Fallback: textured dark plate with category label */
        <div className="absolute inset-0 flex items-center justify-center bg-muted/40">
          {label && (
            <span className="label-mono text-[11px] font-semibold text-muted-foreground tracking-widest uppercase opacity-50">
              {label}
            </span>
          )}
        </div>
      )}
      {/* Gradient overlay so badges are readable over any image */}
      {src && (
        <div className="absolute inset-0 bg-gradient-to-t from-background/70 via-transparent to-transparent pointer-events-none" />
      )}
      {/* Optional badge slot (e.g. FEATURED) */}
      {badge && <div className="absolute left-2 top-2">{badge}</div>}
    </div>
  )
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
  const reply = item.latestReply
  // Prefer the latest reply body for the preview; fall back to the OP body
  const previewText = stripMarkdown(reply?.body ?? item.body).slice(0, 160)
  const thumbSrc = firstImageInBody(item.body)

  return (
    <div className="flex flex-col gap-3 h-full">
      <Thumbnail
        src={thumbSrc}
        alt={item.title}
        label={item.category ?? "FORUM"}
        badge={
          item.isFeatured ? (
            <span className="label-mono px-2 py-0.5 text-[10px] font-semibold bg-primary text-primary-foreground">
              FEATURED
            </span>
          ) : undefined
        }
      />

      {/* Label row */}
      <div className="flex items-center gap-2 px-4 pt-1">
        <span className="flex items-center gap-1.5 label-mono text-[11px] font-semibold text-primary">
          <Users className="h-3 w-3" />
          HOTTEST FORUM THREAD
        </span>
        {item.category && (
          <span className="label-mono px-1.5 py-0.5 text-[10px] bg-muted text-muted-foreground border border-border">
            {item.category.toUpperCase()}
          </span>
        )}
      </div>

      {/* Title */}
      <Link href={`/forum/${item.id}`}>
        <h3 className="stencil text-xl md:text-2xl leading-tight text-foreground line-clamp-3 px-4 hover:text-primary transition-colors cursor-pointer">
          {item.title}
        </h3>
      </Link>

      {/* Latest reply preview — labelled so it's clear it's a reply, not the OP */}
      {previewText && (
        <div className="mx-4 border-l-2 border-primary/40 pl-3">
          {reply && (
            <p className="label-mono text-[10px] text-primary mb-1">
              {reply.authorName.toUpperCase()} · {timeAgo(reply.createdAt)}
            </p>
          )}
          <p className="text-sm text-muted-foreground line-clamp-2">{previewText}</p>
        </div>
      )}

      {/* Meta row */}
      <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground label-mono mt-auto px-4">
        <span>{item.authorName}</span>
        <div className="flex items-center gap-1">
          <Clock className="h-3 w-3" />
          <span>{timeAgo(item.createdAt)}</span>
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
        className="label-mono mt-2 inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline px-4 pb-4"
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

  const video = extractFirstVideo(item.content)

  return (
    <div className="flex flex-col gap-3 h-full">
      {/* Video preview — shown instead of static thumbnail when post contains a video */}
      {video ? (
        <div
          className="relative w-full overflow-hidden bg-black border-b border-border"
          style={{ aspectRatio: "16/7" }}
        >
          {video.kind === "upload" ? (
            <video
              src={video.src}
              controls
              playsInline
              preload="metadata"
              className="w-full h-full object-contain"
              title={video.title ?? item.title}
            />
          ) : (
            <iframe
              src={video.src}
              title={video.title ?? item.title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="absolute inset-0 w-full h-full border-0"
            />
          )}
          {item.featured && (
            <span className="absolute left-2 top-2 label-mono px-2 py-0.5 text-[10px] font-semibold bg-primary text-primary-foreground">
              FEATURED
            </span>
          )}
        </div>
      ) : (
        <Thumbnail
          src={item.coverImage}
          alt={item.title}
          label={item.postType ?? item.category ?? "DISPATCH"}
          badge={
            item.featured ? (
              <span className="label-mono px-2 py-0.5 text-[10px] font-semibold bg-primary text-primary-foreground">
                FEATURED
              </span>
            ) : undefined
          }
        />
      )}

      {/* Label row */}
      <div className="flex items-center gap-2 flex-wrap px-4 pt-1">
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
      <Link href={`/blog/${item.slug}`}>
        <h3 className="stencil text-xl md:text-2xl leading-tight text-foreground line-clamp-3 px-4 hover:text-primary transition-colors cursor-pointer">
          {item.title}
        </h3>
      </Link>

      {/* Excerpt */}
      {item.excerpt && (
        <p className="text-sm text-muted-foreground line-clamp-2 flex-1 px-4">{item.excerpt}</p>
      )}

      {/* Tags */}
      {allTags.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-1 px-4">
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
      <div className="flex items-center gap-3 text-xs text-muted-foreground label-mono mt-auto px-4">
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
        className="label-mono mt-2 inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline px-4 pb-4"
      >
        <BookOpen className="h-3.5 w-3.5" />
        {video ? "WATCH DISPATCH →" : "READ DISPATCH →"}
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
      <Thumbnail
        src={item.coverImage}
        alt={item.title}
        label={item.postType ?? item.category ?? "ARCHIVE"}
        badge={
          item.featured ? (
            <span className="label-mono px-2 py-0.5 text-[10px] font-semibold bg-primary text-primary-foreground">
              FEATURED
            </span>
          ) : undefined
        }
      />

      {/* Label row */}
      <div className="flex items-center gap-2 flex-wrap px-4 pt-1">
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
      <Link href={`/archives/${item.slug}`}>
        <h3 className="stencil text-xl md:text-2xl leading-tight text-foreground line-clamp-3 px-4 hover:text-primary transition-colors cursor-pointer">
          {item.title}
        </h3>
      </Link>

      {/* Excerpt */}
      {item.excerpt && (
        <p className="text-sm text-muted-foreground line-clamp-2 flex-1 px-4">{item.excerpt}</p>
      )}

      {/* Meta */}
      <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground label-mono mt-auto px-4">
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
        className="label-mono mt-2 inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline px-4 pb-4"
      >
        <Archive className="h-3.5 w-3.5" />
        OPEN RECORD →
      </Link>
    </div>
  )
}

// ─── Empty state card ──�������─────────────────────────────────────────────────────

function EmptyCard({ label, icon: Icon }: { label: string; icon: React.ElementType }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 h-full py-12 px-4 text-muted-foreground">
      <Icon className="h-8 w-8 opacity-30" />
      <p className="label-mono text-xs text-center opacity-60">NO {label} AVAILABLE</p>
    </div>
  )
}

// ─── Inner story carousel (prev/next within a tab) ───────────────────────────

interface StoryCarouselProps {
  items: SituationItem[]
  emptyLabel: string
  emptyIcon: React.ElementType
}

function StoryCarousel({ items, emptyLabel, emptyIcon }: StoryCarouselProps) {
  const [idx, setIdx] = useState(0)

  // Reset when items change (tab switch)
  useEffect(() => { setIdx(0) }, [items])

  if (items.length === 0) return <EmptyCard label={emptyLabel} icon={emptyIcon} />

  const item = items[idx]
  const total = items.length

  function prev() { setIdx((i) => (i - 1 + total) % total) }
  function next() { setIdx((i) => (i + 1) % total) }

  return (
    <div className="flex flex-col">
      {/* Story card */}
      <div key={idx}>
        {item.type === "forum" ? (
          <ForumHotCard item={item as SituationForumItem} />
        ) : item.type === "blog" ? (
          <BlogHotCard item={item as SituationBlogItem} />
        ) : (
          <ArchiveHotCard item={item as SituationArchiveItem} />
        )}
      </div>

      {/* Story pagination — only shown when there are multiple items */}
      {total > 1 && (
        <div className="flex items-center justify-between border-t border-border px-4 py-2 bg-muted/30">
          <button
            onClick={prev}
            aria-label="Previous story"
            className="p-1 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>

          {/* Dot indicators */}
          <div className="flex items-center gap-1.5">
            {items.map((_, i) => (
              <button
                key={i}
                onClick={() => setIdx(i)}
                aria-label={`Story ${i + 1} of ${total}`}
                className={`h-1.5 rounded-full transition-all duration-200 ${
                  i === idx ? "w-4 bg-primary" : "w-1.5 bg-border hover:bg-muted-foreground"
                }`}
              />
            ))}
          </div>

          <button
            onClick={next}
            aria-label="Next story"
            className="p-1 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  )
}

// ─── Main cycle component ─────────────────────────────────────────────────────

interface SituationReportCycleProps {
  forumItems: SituationForumItem[]
  blogItems: SituationBlogItem[]
  archiveItems?: SituationArchiveItem[]
  /** @deprecated */
  forumItem?: SituationForumItem | null
  /** @deprecated */
  blogItem?: SituationBlogItem | null
  /** @deprecated */
  archiveItem?: SituationArchiveItem | null
}

const CYCLE_INTERVAL = 10000 // 10 seconds
const TABS = [
  { key: "forum", label: "FORUM", icon: Users },
  { key: "notables", label: "NOTABLES", icon: BookOpen },
] as const

type TabKey = (typeof TABS)[number]["key"]

export function SituationReportCycle({
  forumItems,
  blogItems,
  archiveItems = [],
  forumItem,
  blogItem,
  archiveItem,
}: SituationReportCycleProps) {
  // Merge blog + archive into a single "notables" list, interleaved by date
  const blogMapped: SituationBlogItem[] = blogItems.length ? blogItems : blogItem ? [blogItem] : []
  const archiveMapped: SituationArchiveItem[] = archiveItems.length ? archiveItems : archiveItem ? [archiveItem] : []

  const resolvedForum = forumItems.length ? forumItems : forumItem ? [forumItem] : []
  const resolvedNotables: (SituationBlogItem | SituationArchiveItem)[] = [
    ...blogMapped,
    ...archiveMapped,
  ]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 3)

  const [active, setActive] = useState<TabKey>("forum")
  const [isPaused, setIsPaused] = useState(false)
  const [reducedMotion, setReducedMotion] = useState(false)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

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

  const counts: Record<TabKey, number> = {
    forum: resolvedForum.length,
    notables: resolvedNotables.length,
  }

  function renderCarousel() {
    switch (active) {
      case "forum":
        return <StoryCarousel items={resolvedForum} emptyLabel="FORUM ACTIVITY" emptyIcon={Users} />
      case "notables":
        return <StoryCarousel items={resolvedNotables} emptyLabel="NOTABLES" emptyIcon={BookOpen} />
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
          const count = counts[tab.key]
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
              {count > 0 && (
                <span className={`ml-1 px-1 py-0.5 text-[9px] rounded-sm font-bold ${isActive ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"}`}>
                  {count}
                </span>
              )}
            </button>
          )
        })}

        {/* Spacer + tab nav arrows */}
        <div className="ml-auto flex items-center gap-1 px-2">
          <button
            onClick={retreat}
            aria-label="Previous tab"
            className="p-1.5 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>

          <div className="flex items-center gap-1 px-1">
            {TABS.map((_, i) => (
              <button
                key={i}
                onClick={() => setActive(TABS[i].key)}
                aria-label={`Go to tab ${i + 1}`}
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
            aria-label="Next tab"
            className="p-1.5 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Active tab carousel */}
      <div className="min-h-[320px]">{renderCarousel()}</div>

      {/* Progress bar (auto-cycle tab indicator) */}
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
