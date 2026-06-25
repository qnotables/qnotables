"use client"

import { useState, useMemo, useEffect } from "react"
import { useSearchParams, useRouter, usePathname } from "next/navigation"
import Link from "next/link"
import {
  MessageSquare,
  Clock,
  Pin,
  Star,
  Lock,
  Image as ImageIcon,
  Link2,
  Video,
  Search,
  ChevronDown,
  Activity,
  Play,
} from "lucide-react"
import { timeAgo } from "@/lib/time"
import {
  FORUM_CATEGORIES,
  SORT_OPTIONS,
  type SortOption,
  type VideoEmbed,
  buildExcerpt,
  detectMediaBadges,
  extractFirstImage,
  extractFirstVideo,
  normalizeCategoryName,
} from "@/lib/forum-utils"

export interface ThreadListItem {
  id: string
  title: string
  body: string
  category: string | null
  tags: string | null
  created_at: string
  last_activity_at?: string
  author_id: string
  authorName: string
  replyCount: number
  is_pinned: boolean
  is_locked: boolean
  is_featured: boolean
  is_soft_deleted: boolean
}

interface ForumListProps {
  threads: ThreadListItem[]
  isSignedIn: boolean
}

const PAGE_SIZE = 15

function CategoryBadge({ category }: { category: string | null }) {
  if (!category) return null
  const label = normalizeCategoryName(category) ?? category
  return (
    <span className="label-mono inline-block border border-primary/40 bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold text-primary">
      {label.toUpperCase()}
    </span>
  )
}

function MediaBadgeRow({ body }: { body: string }) {
  const badges = detectMediaBadges(body)
  if (!badges.hasImages && !badges.hasLinks && !badges.hasSocialLinks && !badges.hasVideo) return null
  return (
    <div className="flex items-center gap-1.5">
      {badges.hasImages && (
        <span
          title="Contains images"
          className="flex items-center gap-0.5 label-mono text-[10px] text-muted-foreground border border-border px-1 py-0.5"
        >
          <ImageIcon className="h-2.5 w-2.5" /> IMG
        </span>
      )}
      {badges.hasVideo && (
        <span
          title="Contains video"
          className="flex items-center gap-0.5 label-mono text-[10px] text-muted-foreground border border-border px-1 py-0.5"
        >
          <Video className="h-2.5 w-2.5" /> VID
        </span>
      )}
      {badges.hasLinks && (
        <span
          title="Contains links"
          className="flex items-center gap-0.5 label-mono text-[10px] text-muted-foreground border border-border px-1 py-0.5"
        >
          <Link2 className="h-2.5 w-2.5" /> SRC
        </span>
      )}
    </div>
  )
}

function getEmbedSrc(video: VideoEmbed): string | null {
  switch (video.type) {
    case "youtube":
      return `https://www.youtube.com/embed/${video.videoId}?autoplay=1&rel=0`
    case "rumble":
      // Rumble share slugs start with "v"; embed endpoint differs from share URL
      return `https://rumble.com/embed/${video.embedId}/?pub=4`
    case "odysee":
      return `https://odysee.com/$/embed/${video.path}`
    case "direct":
      return null // rendered as <video> element, not iframe
  }
}

function VideoPreview({ video }: { video: VideoEmbed }) {
  const [active, setActive] = useState(false)

  if (!active) {
    return (
      <button
        onClick={(e) => { e.preventDefault(); setActive(true) }}
        className="group/play relative mt-3 flex w-full items-center justify-center overflow-hidden border border-border bg-black/60 transition-colors hover:border-primary"
        style={{ aspectRatio: "16/9" }}
        aria-label="Play video"
      >
        {/* Subtle grid overlay */}
        <div className="absolute inset-0 bg-[repeating-linear-gradient(0deg,transparent,transparent_23px,rgba(255,255,255,0.03)_24px),repeating-linear-gradient(90deg,transparent,transparent_23px,rgba(255,255,255,0.03)_24px)]" />
        {/* Label */}
        <span className="label-mono absolute left-3 top-2 text-[10px] text-muted-foreground opacity-70">
          {video.type === "youtube"
            ? "YOUTUBE"
            : video.type === "rumble"
            ? "RUMBLE"
            : video.type === "odysee"
            ? "ODYSEE"
            : "VIDEO"}
        </span>
        {/* Play button */}
        <span className="relative z-10 flex h-14 w-14 items-center justify-center border border-primary/60 bg-primary/20 transition-all group-hover/play:border-primary group-hover/play:bg-primary/40">
          <Play className="h-6 w-6 fill-primary text-primary" />
        </span>
        <span className="label-mono absolute bottom-2 right-3 text-[10px] text-muted-foreground opacity-70">
          CLICK TO PLAY
        </span>
      </button>
    )
  }

  if (video.type === "direct") {
    return (
      <div className="mt-3 w-full overflow-hidden border border-primary/40" style={{ aspectRatio: "16/9" }}>
        {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
        <video
          src={video.url}
          controls
          autoPlay
          className="h-full w-full bg-black"
          onClick={(e) => e.preventDefault()}
        />
      </div>
    )
  }

  const src = getEmbedSrc(video)
  if (!src) return null

  return (
    <div
      className="mt-3 w-full overflow-hidden border border-primary/40"
      style={{ aspectRatio: "16/9" }}
      onClick={(e) => e.preventDefault()}
    >
      <iframe
        src={src}
        className="h-full w-full"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        title="Embedded video"
        loading="lazy"
      />
    </div>
  )
}

function ThreadCard({ t }: { t: ThreadListItem }) {
  const excerpt = buildExcerpt(t.body, 160)
  const thumb = extractFirstImage(t.body)
  const video = extractFirstVideo(t.body)
  const tags = t.tags ? t.tags.split(/[,\s]+/).filter(Boolean).slice(0, 4) : []
  const categoryName = normalizeCategoryName(t.category)

  return (
    <div
      className={`group relative flex gap-0 border bg-card transition-colors hover:border-primary ${
        t.is_pinned ? "border-primary/60" : "border-border"
      }`}
    >
      {/* Thumbnail strip */}
      {thumb && (
        <div className="w-28 flex-shrink-0 overflow-hidden sm:w-44 md:w-52">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={thumb}
            alt=""
            className="h-full min-h-[7rem] w-full object-cover opacity-80 transition-opacity group-hover:opacity-100"
            loading="lazy"
          />
        </div>
      )}

      {/* Reply count column */}
      <div className="flex w-14 flex-shrink-0 flex-col items-center justify-center gap-0.5 border-r border-border bg-muted/30 px-2 py-4 text-center">
        <span className="stencil text-lg leading-none text-primary">{t.replyCount}</span>
        <span className="label-mono text-[9px] text-muted-foreground">
          {t.replyCount === 1 ? "REPLY" : "REPLIES"}
        </span>
      </div>

      {/* Main content */}
      <div className="min-w-0 flex-1 p-4">
        {/* Status badges row */}
        <div className="mb-1.5 flex flex-wrap items-center gap-1.5">
          {t.is_pinned && (
            <span className="label-mono flex items-center gap-0.5 border border-primary/40 bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold text-primary">
              <Pin className="h-2.5 w-2.5" /> PINNED
            </span>
          )}
          {t.is_featured && (
            <span className="label-mono flex items-center gap-0.5 border border-amber-500/40 bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-amber-400">
              <Star className="h-2.5 w-2.5" /> FEATURED
            </span>
          )}
          {t.is_locked && (
            <span className="label-mono flex items-center gap-0.5 border border-border bg-muted/40 px-1.5 py-0.5 text-[10px] text-muted-foreground">
              <Lock className="h-2.5 w-2.5" /> LOCKED
            </span>
          )}
          <CategoryBadge category={categoryName} />
          <MediaBadgeRow body={t.body} />
        </div>

        {/* Title */}
        <Link href={`/forum/${t.id}`} className="block">
          <h2 className="stencil text-balance text-base leading-snug text-foreground transition-colors group-hover:text-primary md:text-lg">
            {t.title}
          </h2>
        </Link>

        {/* Excerpt */}
        {excerpt && (
          <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
            {excerpt}
          </p>
        )}

        {/* Video preview */}
        {video && <VideoPreview video={video} />}

        {/* Tags */}
        {tags.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {tags.map((tag) => (
              <span
                key={tag}
                className="label-mono border border-border px-1.5 py-0.5 text-[10px] text-muted-foreground"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* Meta row */}
        <div className="label-mono mt-2.5 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
          <span className="font-semibold text-foreground">{t.authorName}</span>
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {timeAgo(t.created_at)}
          </span>
          {t.replyCount > 0 && t.last_activity_at && t.last_activity_at !== t.created_at && (
            <span className="flex items-center gap-1 text-primary/80">
              <Activity className="h-3 w-3" />
              active {timeAgo(t.last_activity_at)}
            </span>
          )}
        </div>
      </div>

      {/* Open thread arrow */}
      <div className="flex flex-shrink-0 items-center pr-3">
        <Link
          href={`/forum/${t.id}`}
          className="label-mono hidden border border-border px-3 py-1.5 text-[10px] text-muted-foreground transition-colors hover:border-primary hover:text-primary sm:block"
          aria-label={`Open thread: ${t.title}`}
        >
          OPEN →
        </Link>
      </div>
    </div>
  )
}

export function ForumList({ threads, isSignedIn }: ForumListProps) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  const [query, setQuery] = useState("")
  const [sort, setSort] = useState<SortOption>("latest")
  // Category is owned by the URL — sidebar links and the dropdown stay in sync
  const filterCategory = searchParams.get("category") ?? ""
  const [filterTag, setFilterTag] = useState("")
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)

  function setFilterCategory(value: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (value) {
      params.set("category", value)
    } else {
      params.delete("category")
    }
    router.replace(`${pathname}?${params.toString()}`, { scroll: false })
  }

  // Effective "last activity" timestamp for a thread (falls back to creation).
  const activityTime = (t: ThreadListItem) =>
    new Date(t.last_activity_at ?? t.created_at).getTime()

  const filtered = useMemo(() => {
    let rows = [...threads]

    // Search
    const q = query.trim().toLowerCase()
    if (q) {
      rows = rows.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          t.body.toLowerCase().includes(q) ||
          (t.tags ?? "").toLowerCase().includes(q) ||
          (t.category ?? "").toLowerCase().includes(q) ||
          t.authorName.toLowerCase().includes(q),
      )
    }

    // Category filter
    if (filterCategory) {
      rows = rows.filter(
        (t) =>
          t.category?.toLowerCase() === filterCategory.toLowerCase() ||
          normalizeCategoryName(t.category)?.toLowerCase() === filterCategory.toLowerCase(),
      )
    }

    // Tag filter
    if (filterTag) {
      const ft = filterTag.toLowerCase()
      rows = rows.filter((t) => (t.tags ?? "").toLowerCase().includes(ft))
    }

    // Sort: pinned always first, then apply sort
    const pinned = rows.filter((t) => t.is_pinned)
    const rest = rows.filter((t) => !t.is_pinned)

    const sortFn = (a: ThreadListItem, b: ThreadListItem): number => {
      switch (sort) {
        case "most-replies":
          return b.replyCount - a.replyCount
        case "featured":
          return (b.is_featured ? 1 : 0) - (a.is_featured ? 1 : 0) || activityTime(b) - activityTime(a)
        case "pinned":
          return (b.is_pinned ? 1 : 0) - (a.is_pinned ? 1 : 0) || activityTime(b) - activityTime(a)
        case "newest":
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        case "latest":
        default:
          // Latest activity: most recent reply (or creation) first
          return activityTime(b) - activityTime(a)
      }
    }

    return [...pinned.sort(sortFn), ...rest.sort(sortFn)]
  }, [threads, query, sort, filterCategory, filterTag])

  // Reset visible window whenever the result set changes
  useEffect(() => {
    setVisibleCount(PAGE_SIZE)
  }, [query, sort, filterCategory, filterTag])

  const visible = filtered.slice(0, visibleCount)
  const hasMore = filtered.length > visibleCount

  const isEmpty = threads.length === 0
  const noResults = !isEmpty && filtered.length === 0

  return (
    <div className="flex flex-col gap-4">
      {/* Controls bar */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Search */}
        <div className="relative flex-1 min-w-48">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search threads, tags, authors…"
            className="label-mono w-full border border-border bg-background py-2 pl-9 pr-3 text-sm text-foreground outline-none transition-colors focus:border-primary placeholder:text-muted-foreground/60"
          />
        </div>

        {/* Category filter */}
        <div className="relative">
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="label-mono appearance-none border border-border bg-background py-2 pl-3 pr-8 text-sm text-foreground outline-none transition-colors focus:border-primary"
          >
            <option value="">All Categories</option>
            {FORUM_CATEGORIES.map((c) => (
              <option key={c.slug} value={c.slug}>
                {c.name}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
        </div>

        {/* Sort */}
        <div className="relative">
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortOption)}
            className="label-mono appearance-none border border-border bg-background py-2 pl-3 pr-8 text-sm text-foreground outline-none transition-colors focus:border-primary"
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
        </div>
      </div>

      {/* Results count */}
      {!isEmpty && (
        <p className="label-mono text-xs text-muted-foreground">
          {filtered.length === threads.length
            ? `${threads.length} thread${threads.length !== 1 ? "s" : ""}`
            : `${filtered.length} of ${threads.length} threads`}
        </p>
      )}

      {/* Empty state */}
      {isEmpty && (
        <div className="corner-frame border border-border bg-card p-12 text-center">
          <MessageSquare className="mx-auto h-8 w-8 text-muted-foreground opacity-40" />
          <p className="stencil mt-4 text-xl text-foreground">The Town Hall is quiet.</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Start the first discussion.
          </p>
          {!isSignedIn && (
            <Link
              href="/auth/login?next=/forum/new"
              className="label-mono mt-4 inline-block border border-primary px-4 py-2 text-sm text-primary transition-colors hover:bg-primary hover:text-primary-foreground"
            >
              Sign in to post
            </Link>
          )}
        </div>
      )}

      {/* No results */}
      {noResults && (
        <div className="border border-border bg-card p-8 text-center">
          <p className="stencil text-lg text-foreground">No threads matched your filters.</p>
          <button
            onClick={() => { setQuery(""); setFilterTag(""); setFilterCategory("") }}
            className="label-mono mt-3 text-sm text-primary hover:underline"
          >
            Clear filters
          </button>
        </div>
      )}

      {/* Thread list */}
      {filtered.length > 0 && (
        <div className="flex flex-col gap-2">
          {visible.map((t) => (
            <ThreadCard key={t.id} t={t} />
          ))}
        </div>
      )}

      {/* Load more */}
      {hasMore && (
        <div className="flex flex-col items-center gap-2 pt-2">
          <button
            onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
            className="label-mono w-full border border-border bg-card py-3 text-sm text-foreground transition-colors hover:border-primary hover:text-primary sm:w-auto sm:px-8"
          >
            Load more threads
          </button>
          <span className="label-mono text-[10px] text-muted-foreground">
            Showing {visible.length} of {filtered.length}
          </span>
        </div>
      )}
    </div>
  )
}
