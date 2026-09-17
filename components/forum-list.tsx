"use client"

import Link from "next/link"
import useSWR from "swr"
import { useEffect, useMemo, useState } from "react"
import {
  Activity,
  ChevronDown,
  Clock,
  Image as ImageIcon,
  Link2,
  Lock,
  MessageSquare,
  Pin,
  Play,
  Search,
  Star,
  Video,
} from "lucide-react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { ShareButtons } from "@/components/share-buttons"
import { ForumThreadUpvote } from "@/components/forum-thread-upvote"
import { timeAgo } from "@/lib/time"
import {
  FORUM_CATEGORIES,
  FORUM_DESKS,
  SORT_OPTIONS,
  buildExcerpt,
  normalizeCategoryName,
  type SortOption,
} from "@/lib/forum-utils"
import { resolveFirstPostMedia, type PostMedia } from "@/lib/post-media"
import type { ForumQueryResult, ForumThreadRecord } from "@/lib/forum"

export type ThreadListItem = ForumThreadRecord

interface ForumListProps {
  initialResult: ForumQueryResult
  isSignedIn: boolean
}

const fetcher = async (url: string): Promise<ForumQueryResult> => {
  const response = await fetch(url)
  if (!response.ok) throw new Error("Unable to load forum threads")
  return response.json() as Promise<ForumQueryResult>
}

function SelectControl({
  label,
  value,
  onChange,
  children,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  children: React.ReactNode
}) {
  return (
    <label className="relative flex min-w-0 w-full flex-1 flex-col gap-1 lg:w-auto lg:flex-none">
      <span className="sr-only">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="label-mono min-h-11 w-full min-w-0 appearance-none border border-border bg-background px-3 py-2.5 pr-8 text-xs text-foreground outline-none transition-colors focus:border-primary lg:min-w-36"
      >
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 mt-1 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
    </label>
  )
}

function MediaBadges({ thread }: { thread: ThreadListItem }) {
  const badges = [
    thread.media.hasImages ? { label: "IMG", icon: ImageIcon, title: "Contains images" } : null,
    thread.media.hasVideo ? { label: "VID", icon: Video, title: "Contains video" } : null,
    thread.media.hasLinks ? { label: "SRC", icon: Link2, title: "Contains links" } : null,
  ].filter(Boolean) as Array<{ label: string; icon: typeof ImageIcon; title: string }>

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {badges.map(({ label, icon: Icon, title }) => (
        <span key={label} title={title} className="label-mono inline-flex items-center gap-1 border border-border px-1.5 py-0.5 text-[10px] text-muted-foreground">
          <Icon className="h-2.5 w-2.5" /> {label}
        </span>
      ))}
    </div>
  )
}

function StructuredMediaPreview({ media }: { media: PostMedia }) {
  const [active, setActive] = useState(false)
  const [failed, setFailed] = useState(false)

  if (media.kind === "image") {
    if (failed) return <a href={media.src} target="_blank" rel="noopener noreferrer nofollow" className="label-mono flex min-h-24 w-full shrink-0 items-center justify-center border-b border-border bg-muted/30 px-2 text-center text-[10px] text-primary hover:underline md:w-64 md:border-b-0 md:border-r lg:w-80">Open image</a>
    return (
      <div className="aspect-video w-full shrink-0 overflow-hidden border-b border-border md:w-64 md:border-b-0 md:border-r lg:w-80">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={media.src} alt={media.alt ?? "Thread preview"} className="h-full w-full object-cover opacity-80 transition-opacity group-hover:opacity-100" loading="lazy" onError={() => setFailed(true)} />
      </div>
    )
  }

  if (media.kind === "video") {
    return (
      <div className="mt-3 aspect-video w-full overflow-hidden border border-primary/40" onClick={(event) => event.preventDefault()}>
        {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
        <video src={media.src} poster={media.poster} controls preload="metadata" className="h-full w-full bg-background" />
      </div>
    )
  }

  if (!active) {
    return (
      <button type="button" onClick={(event) => { event.preventDefault(); setActive(true) }} className="group/play relative mt-3 flex aspect-video w-full items-center justify-center overflow-hidden border border-border bg-muted/40 transition-colors hover:border-primary" aria-label={`Play ${media.title ?? "embedded video"}`}>
        {media.poster && !failed && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={media.poster} alt="" className="absolute inset-0 h-full w-full object-cover opacity-60" onError={() => setFailed(true)} />
        )}
        <span className="relative z-10 flex h-12 w-12 items-center justify-center border border-primary/60 bg-background/80"><Play className="h-5 w-5 fill-primary text-primary" /></span>
        <span className="label-mono absolute bottom-2 right-3 z-10 text-[10px] text-foreground">CLICK TO PLAY</span>
      </button>
    )
  }

  return (
    <div className="mt-3 aspect-video w-full overflow-hidden border border-primary/40" onClick={(event) => event.preventDefault()}>
      <iframe src={media.src} className="h-full w-full" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen title={media.title ?? "Embedded video"} loading="lazy" />
    </div>
  )
}

function ThreadCard({ thread, isSignedIn }: { thread: ThreadListItem; isSignedIn: boolean }) {
  const media = resolveFirstPostMedia(thread.body)
  const href = `/forum/${thread.slug || thread.id}`
  const excerpt = thread.excerpt || buildExcerpt(thread.body)
  const tags = thread.tags ? thread.tags.split(/[,\s]+/).filter(Boolean).slice(0, 3) : []
  const categoryName = normalizeCategoryName(thread.category)
  const desk = FORUM_DESKS.find((item) => item.slug === (thread.desk ?? "other"))

  return (
    <article className={`group flex min-w-0 flex-col gap-0 border bg-card transition-colors hover:border-primary md:flex-row ${thread.is_pinned ? "border-primary/60" : "border-border"}`}>
      {media?.kind === "image" && <StructuredMediaPreview media={media} />}
      <div className="flex w-full shrink-0 flex-row items-center justify-start gap-2 border-b border-border bg-muted/30 px-3 py-2 text-left md:w-14 md:flex-col md:justify-center md:gap-1 md:border-b-0 md:border-r md:px-2 md:py-4 md:text-center">
        <span className="stencil text-lg leading-none text-primary">{thread.replyCount}</span>
        <span className="label-mono text-[9px] text-muted-foreground">{thread.replyCount === 1 ? "REPLY" : "REPLIES"}</span>
      </div>
      <div className="min-w-0 flex-1 p-4 md:p-5">

        <div className="flex flex-wrap items-center gap-1.5">
          {thread.is_pinned && <span className="label-mono inline-flex items-center gap-1 border border-primary/40 bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold text-primary"><Pin className="h-2.5 w-2.5" /> PINNED</span>}
          {thread.is_featured && <span className="label-mono inline-flex items-center gap-1 border border-amber-500/40 bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-amber-400"><Star className="h-2.5 w-2.5" /> FEATURED</span>}
          {thread.is_locked && <span className="label-mono inline-flex items-center gap-1 border border-border px-1.5 py-0.5 text-[10px] text-muted-foreground"><Lock className="h-2.5 w-2.5" /> LOCKED</span>}
          <span className="label-mono border border-border/70 px-1.5 py-0.5 text-[10px] text-muted-foreground">{categoryName.toUpperCase()}</span>
          {desk && desk.slug !== "other" && <span className="label-mono border border-border/70 px-1.5 py-0.5 text-[10px] text-muted-foreground">{desk.label.toUpperCase()}</span>}
          <span className="label-mono border border-border/70 px-1.5 py-0.5 text-[10px] text-muted-foreground">{thread.origin === "primary-source" ? "PRIMARY SOURCE" : "COMMUNITY"}</span>
          <MediaBadges thread={thread} />
        </div>
        <Link href={href} className="mt-2 block">
          <h3 className="stencil break-words text-balance text-lg leading-snug text-foreground transition-colors group-hover:text-primary md:text-xl">{thread.title}</h3>
        </Link>
        {excerpt && <p className="mt-2 line-clamp-2 text-sm leading-6 text-muted-foreground">{excerpt}</p>}
        {media && media.kind !== "image" && <StructuredMediaPreview media={media} />}
        {thread.sourceUrl && <a href={thread.sourceUrl} target="_blank" rel="noopener noreferrer nofollow" className="label-mono mt-3 inline-flex max-w-full items-start gap-1 break-words text-[10px] text-primary hover:underline" onClick={(event) => event.stopPropagation()}><Link2 className="mt-0.5 h-3 w-3 shrink-0" /> <span className="break-words">Open primary source</span></a>}
        {tags.length > 0 && <div className="mt-3 flex flex-wrap gap-1">{tags.map((tag) => <span key={tag} className="label-mono border border-border px-1.5 py-0.5 text-[10px] text-muted-foreground">#{tag}</span>)}</div>}
        <div className="mt-4 flex min-w-0 flex-wrap items-center gap-3 border-t border-border pt-3">
          <ShareButtons title={thread.title} url={href} excerpt={excerpt} />
          {isSignedIn && <ForumThreadUpvote threadId={thread.id} initialUpVotes={thread.upVoteCount} userVote={thread.userVote} />}
          <div className="label-mono flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
            <span className="font-semibold text-foreground">{thread.authorName}</span>
            <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {timeAgo(thread.created_at)}</span>
            {thread.replyCount > 0 && thread.last_activity_at !== thread.created_at && <span className="flex items-center gap-1 text-primary/80"><Activity className="h-3 w-3" /> active {timeAgo(thread.last_activity_at)}</span>}
          </div>
        </div>
        <Link href={href} className="label-mono mt-3 flex min-h-11 w-full items-center justify-center border border-border px-3 py-2 text-[10px] text-muted-foreground transition-colors hover:border-primary hover:text-primary md:hidden" aria-label={`Open thread: ${thread.title}`}>OPEN THREAD →</Link>
      </div>
      <div className="hidden shrink-0 items-center pr-4 md:flex"><Link href={href} className="label-mono border border-border px-3 py-1.5 text-[10px] text-muted-foreground transition-colors hover:border-primary hover:text-primary" aria-label={`Open thread: ${thread.title}`}>OPEN →</Link></div>
    </article>
  )
}

export function ForumList({ initialResult, isSignedIn }: ForumListProps) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  const urlQuery = searchParams.get("q") ?? ""
  const category = searchParams.get("category") ?? ""
  const desk = searchParams.get("desk") ?? ""
  const origin = searchParams.get("origin") ?? ""
  const media = searchParams.get("media") ?? ""
  const sort = (searchParams.get("sort") as SortOption | null) ?? "latest"
  const [query, setQuery] = useState(urlQuery)
  const [extraThreads, setExtraThreads] = useState<ThreadListItem[]>([])
  const [loadedPage, setLoadedPage] = useState(initialResult.page)
  const [hasMore, setHasMore] = useState(initialResult.hasMore)
  const [loadingMore, setLoadingMore] = useState(false)
  const [loadMoreError, setLoadMoreError] = useState(false)

  const requestParams = useMemo(() => {
    const params = new URLSearchParams(searchParams.toString())
    params.delete("page")
    return params
  }, [searchParams])
  const requestKey = `/api/forum/threads${requestParams.toString() ? `?${requestParams.toString()}` : ""}`
  const { data, error, isLoading } = useSWR<ForumQueryResult>(requestKey, fetcher, { fallbackData: initialResult, keepPreviousData: true, revalidateOnFocus: false })
  const result = data ?? initialResult
  const threads = [...result.threads, ...extraThreads]

  useEffect(() => setQuery(urlQuery), [urlQuery])
  useEffect(() => {
    const timeout = window.setTimeout(() => {
      if (query.trim() === urlQuery.trim()) return
      const params = new URLSearchParams(searchParams.toString())
      if (query.trim()) params.set("q", query.trim())
      else params.delete("q")
      params.delete("page")
      router.replace(`${pathname}${params.toString() ? `?${params.toString()}` : ""}`, { scroll: false })
    }, 300)
    return () => window.clearTimeout(timeout)
  }, [pathname, query, router, searchParams, urlQuery])
  useEffect(() => {
    setExtraThreads([])
    setLoadedPage(result.page)
    setHasMore(result.hasMore)
    setLoadMoreError(false)
  }, [requestKey, result.hasMore, result.page])

  function setParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (value) params.set(key, value)
    else params.delete(key)
    params.delete("page")
    router.replace(`${pathname}${params.toString() ? `?${params.toString()}` : ""}`, { scroll: false })
  }

  function clearFilters() {
    setQuery("")
    router.replace(pathname, { scroll: false })
  }

  async function loadMore() {
    if (!hasMore || loadingMore) return
    setLoadingMore(true)
    setLoadMoreError(false)
    try {
      const params = new URLSearchParams(requestParams)
      params.set("page", String(loadedPage + 1))
      const next = await fetcher(`/api/forum/threads?${params.toString()}`)
      setExtraThreads((current) => [...current, ...next.threads])
      setLoadedPage(next.page)
      setHasMore(next.hasMore)
    } catch {
      setLoadMoreError(true)
    } finally {
      setLoadingMore(false)
    }
  }

  const isEmpty = !isLoading && result.total === 0
  const noResults = !isLoading && Boolean(urlQuery || category || desk || origin || media) && result.total === 0

  return (
    <div className="flex flex-col gap-4">
      <div className="border border-border bg-card p-3">
        <div className="flex min-w-0 flex-col gap-2 lg:flex-row">
          <label className="relative min-w-0 w-full flex-1">
            <span className="sr-only">Search threads</span>
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search threads, sources, tags, or authors" className="label-mono w-full border border-border bg-background py-2.5 pl-10 pr-3 text-sm text-foreground outline-none transition-colors focus:border-primary placeholder:text-muted-foreground/60" />
          </label>
          <SelectControl label="Category" value={category} onChange={(value) => setParam("category", value)}>
            <option value="">All categories</option>
            {FORUM_CATEGORIES.map((item) => <option key={item.slug} value={item.slug}>{item.name}</option>)}
          </SelectControl>
          <SelectControl label="Desk" value={desk} onChange={(value) => setParam("desk", value)}>
            <option value="">All desks</option>
            {FORUM_DESKS.map((item) => <option key={item.slug} value={item.slug}>{item.label}</option>)}
          </SelectControl>
        </div>
        <div className="mt-2 grid min-w-0 grid-cols-1 gap-2 min-[360px]:grid-cols-2 lg:flex lg:flex-row">
          <SelectControl label="Origin" value={origin} onChange={(value) => setParam("origin", value)}>
            <option value="">All origins</option>
            <option value="community">Community</option>
            <option value="primary-source">Primary source</option>
          </SelectControl>
          <SelectControl label="Media" value={media} onChange={(value) => setParam("media", value)}>
            <option value="">Any media</option>
            <option value="images">Images</option>
            <option value="video">Video</option>
            <option value="links">Links</option>
            <option value="social">Social links</option>
          </SelectControl>
          <div className="min-w-0 min-[360px]:col-span-2 lg:col-span-1">
            <SelectControl label="Sort" value={sort} onChange={(value) => setParam("sort", value)}>
            {SORT_OPTIONS.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
            </SelectControl>
          </div>
          {(urlQuery || category || desk || origin || media || sort !== "latest") && <button type="button" onClick={clearFilters} className="label-mono min-h-11 w-full border border-border px-4 py-2 text-xs text-muted-foreground transition-colors hover:border-primary hover:text-primary lg:w-auto">Clear filters</button>}
        </div>
      </div>

      <div className="flex items-center justify-between gap-3">
        <p className="label-mono text-xs text-muted-foreground">{isLoading && !data ? "Loading the record…" : `${result.total.toLocaleString()} thread${result.total === 1 ? "" : "s"}`}</p>
        {error && <p className="label-mono text-xs text-destructive">Could not refresh results.</p>}
      </div>

      {isEmpty && (
        <div className="border border-dashed border-border bg-card p-10 text-center">
          <MessageSquare className="mx-auto h-8 w-8 text-muted-foreground/50" />
          <p className="stencil mt-4 text-xl text-foreground">{noResults ? "No threads matched." : "The Town Hall is quiet."}</p>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">{noResults ? "Try another combination of filters or clear the current view." : "Start the first useful discussion."}</p>
          {noResults ? <button type="button" onClick={clearFilters} className="label-mono mt-4 text-sm text-primary hover:underline">Clear filters</button> : <Link href={isSignedIn ? "/forum/new" : "/auth/login?next=/forum/new"} className="label-mono mt-4 inline-block border border-primary px-4 py-2 text-sm text-primary transition-colors hover:bg-primary hover:text-primary-foreground">{isSignedIn ? "Start a thread" : "Sign in to post"}</Link>}
        </div>
      )}

      {threads.length > 0 && <div className="flex flex-col gap-2">{threads.map((thread) => <ThreadCard key={thread.id} thread={thread} isSignedIn={isSignedIn} />)}</div>}

      {hasMore && <div className="flex flex-col items-center gap-2 pt-2"><button type="button" onClick={loadMore} disabled={loadingMore} className="label-mono w-full border border-border bg-card py-3 text-sm text-foreground transition-colors hover:border-primary hover:text-primary disabled:cursor-wait disabled:opacity-60 sm:w-auto sm:px-10">{loadingMore ? "Loading…" : "Load more threads"}</button>{loadMoreError && <p className="label-mono text-xs text-destructive">Could not load more threads. Try again.</p>}<span className="label-mono text-[10px] text-muted-foreground">Showing {threads.length} of {result.total}</span></div>}
    </div>
  )
}
