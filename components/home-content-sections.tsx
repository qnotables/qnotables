import Link from "next/link"
import { ArrowUpRight, Clock, FileText, MessageSquare, Play } from "lucide-react"
import { CardImage } from "@/components/card-image"
import { ShareButtons } from "@/components/share-buttons"
import type { BlogPost } from "@/lib/blog-posts"
import type { ForumThread } from "@/lib/forum"
import { formatDate } from "@/lib/blog-posts"
import { getSiteUrl } from "@/lib/rss-utils"
import { timeAgo } from "@/lib/time"

const DEFAULT_DISPATCH_IMAGE = "/images/og-default.png"

function decodeHtmlEntities(value: string): string {
  return value
    .replace(/&#(x?[0-9a-f]+);?/gi, (_, code: string) => {
      const parsed = code.toLowerCase().startsWith("x")
        ? Number.parseInt(code.slice(1), 16)
        : Number.parseInt(code, 10)
      return Number.isFinite(parsed) ? String.fromCodePoint(parsed) : _
    })
    .replace(/&(amp|apos|gt|lt|quot|nbsp);/gi, (_, entity: string) => {
      const entities: Record<string, string> = {
        amp: "&",
        apos: "'",
        gt: ">",
        lt: "<",
        quot: '"',
        nbsp: " ",
      }
      return entities[entity.toLowerCase()] ?? _
    })
}

function cleanText(value?: string | null): string {
  if (!value) return ""
  return decodeHtmlEntities(value.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim())
}

function getDispatchAction(post: BlogPost): { label: string; icon: typeof Play | typeof FileText | typeof ArrowUpRight } {
  const searchable = `${post.postType ?? ""} ${post.content}`.toLowerCase()
  if (/(video|youtube|rumble|odysee|video_embed)/.test(searchable)) {
    return { label: "Watch video", icon: Play }
  }
  if (/(document|documents|source record)/.test(searchable)) {
    return { label: "View documents", icon: FileText }
  }
  return { label: "Read report", icon: ArrowUpRight }
}

function SectionHeading({
  eyebrow,
  title,
  href,
  linkLabel,
  headingId,
}: {
  eyebrow: string
  title: string
  href: string
  linkLabel: string
  headingId: string
}) {
  return (
    <div className="mb-4 flex flex-wrap items-end gap-x-3 gap-y-2 border-b border-border pb-3">
      <div className="flex min-w-0 items-center gap-3">
        <span className="h-2 w-2 shrink-0 bg-primary" />
        <div>
          <p className="label-mono text-xs text-primary">{eyebrow}</p>
          <h2 id={headingId} className="stencil text-2xl text-foreground">{title}</h2>
        </div>
      </div>
      <Link
        href={href}
        className="label-mono ml-auto inline-flex items-center gap-1 border border-border px-2.5 py-1.5 text-xs text-muted-foreground transition-colors hover:border-primary hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      >
        {linkLabel}
        <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
      </Link>
    </div>
  )
}

function DispatchCard({ post }: { post: BlogPost }) {
  const title = cleanText(post.title)
  const excerpt = cleanText(post.excerpt || post.subtitle) || "Open the full dispatch for the complete record."
  const image = post.coverImage || post.seoImageUrl || DEFAULT_DISPATCH_IMAGE
  const href = `/archives/${post.slug}`
  const action = getDispatchAction(post)
  const ActionIcon = action.icon

  return (
    <article className="group flex min-w-0 flex-col border border-border bg-card transition-colors hover:border-primary/70">
      <Link href={href} className="block overflow-hidden border-b border-border" aria-label={`Open dispatch: ${title}`}>
        <CardImage
          src={image}
          alt={`${title} thumbnail`}
          aspectRatio="video"
          objectPosition="top"
          className="transition-transform duration-300 group-hover:scale-[1.02]"
        />
      </Link>
      <div className="flex min-w-0 flex-1 flex-col gap-3 p-4">
        <div className="label-mono flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-muted-foreground">
          <span className="font-semibold uppercase text-primary">{cleanText(post.category || post.tag) || "Dispatch"}</span>
          <span className="text-border" aria-hidden="true">•</span>
          <time dateTime={post.date}>{formatDate(post.date)}</time>
          {post.sourceName && (
            <>
              <span className="text-border" aria-hidden="true">•</span>
              <span className="truncate">via {cleanText(post.sourceName)}</span>
            </>
          )}
        </div>
        <Link href={href} className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
          <h3 className="stencil line-clamp-3 text-lg leading-tight text-foreground transition-colors group-hover:text-primary">
            {title}
          </h3>
        </Link>
        <p className="line-clamp-3 flex-1 text-sm leading-relaxed text-muted-foreground">{excerpt}</p>
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border pt-3">
          <Link
            href={href}
            className="label-mono inline-flex items-center gap-1 text-xs font-semibold text-primary transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <ActionIcon className="h-3.5 w-3.5" aria-hidden="true" />
            {action.label}
          </Link>
          <ShareButtons
            title={title}
            url={`${getSiteUrl()}${href}`}
            excerpt={excerpt}
            source={post.sourceName}
            className="shrink-0"
          />
        </div>
      </div>
    </article>
  )
}

function CommunityCard({ thread }: { thread: ForumThread }) {
  const title = cleanText(thread.title)
  const excerpt = cleanText(thread.body)
  const href = `/forum/${thread.slug || thread.id}`
  const activityAt = thread.lastActivityAt || thread.createdAt
  const hasReplyActivity = Boolean(
    thread.latestReply && new Date(thread.latestReply.createdAt).getTime() > new Date(thread.createdAt).getTime(),
  )

  return (
    <article className="group flex min-w-0 flex-col border border-border bg-card p-4 transition-colors hover:border-primary/70">
      {thread.latestImageUrl && (
        <Link href={href} className="mb-3 block overflow-hidden border-b border-border pb-3" aria-label={`Open discussion: ${title}`}>
          <CardImage src={thread.latestImageUrl} alt={`${title} attachment`} aspectRatio="video" objectPosition="top" />
        </Link>
      )}
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <div className="label-mono flex flex-wrap items-center gap-x-2 gap-y-1 text-[10px] text-muted-foreground">
          <span className="font-semibold uppercase text-primary">{cleanText(thread.category) || "Community"}</span>
          <span className="text-border" aria-hidden="true">•</span>
          <span className="inline-flex items-center gap-1">
            {hasReplyActivity ? <MessageSquare className="h-3 w-3" aria-hidden="true" /> : <Clock className="h-3 w-3" aria-hidden="true" />}
            {hasReplyActivity ? "RECENT REPLY" : "NEW THREAD"}
          </span>
        </div>
        <Link href={href} className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
          <h3 className="stencil line-clamp-3 text-base leading-tight text-foreground transition-colors group-hover:text-primary">
            {title}
          </h3>
        </Link>
        {excerpt && <p className="line-clamp-2 text-sm leading-relaxed text-muted-foreground">{excerpt}</p>}
        <div className="label-mono mt-auto flex flex-wrap items-center gap-x-2 gap-y-1 border-t border-border pt-3 text-[10px] text-muted-foreground">
          <span className="font-semibold text-foreground">{cleanText(thread.authorName)}</span>
          <span aria-hidden="true">•</span>
          <time dateTime={activityAt}>{timeAgo(activityAt)}</time>
          <span aria-hidden="true">•</span>
          <span>{thread.replyCount} {thread.replyCount === 1 ? "REPLY" : "REPLIES"}</span>
        </div>
        <div className="flex items-center justify-between gap-2 pt-1">
          <ShareButtons title={title} url={`${getSiteUrl()}${href}`} excerpt={excerpt} className="shrink-0" />
          <Link
            href={href}
            className="label-mono inline-flex items-center gap-1 text-[10px] font-semibold text-primary hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            OPEN <ArrowUpRight className="h-3 w-3" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </article>
  )
}

export function HomeContentSections({ posts, threads }: { posts: BlogPost[]; threads: ForumThread[] }) {
  return (
    <div className="flex flex-col gap-8">
      <section aria-labelledby="latest-dispatches-heading">
        <SectionHeading
          eyebrow="EDITORIAL DESK"
          title="Latest Dispatches"
          href="/archives"
          linkLabel="View all dispatches"
          headingId="latest-dispatches-heading"
        />
        {posts.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 2xl:grid-cols-4">
            {posts.map((post) => <DispatchCard key={post.id || post.slug} post={post} />)}
          </div>
        ) : (
          <div className="border border-dashed border-border px-4 py-8 text-center">
            <p className="label-mono text-sm text-muted-foreground">No published dispatches are available.</p>
          </div>
        )}
      </section>

      <section aria-labelledby="community-activity-heading">
        <SectionHeading
          eyebrow="OPEN FORUM"
          title="Community Activity"
          href="/forum"
          linkLabel="View all community discussions"
          headingId="community-activity-heading"
        />
        {threads.length > 0 ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 2xl:grid-cols-4">
            {threads.map((thread) => <CommunityCard key={thread.id} thread={thread} />)}
          </div>
        ) : (
          <div className="border border-dashed border-border px-4 py-8 text-center">
            <p className="label-mono text-sm text-muted-foreground">No public community activity is available.</p>
          </div>
        )}
      </section>
    </div>
  )
}
