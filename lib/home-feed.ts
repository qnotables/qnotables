import type { NotablesPost } from "@/app/actions/notables-actions"
import type { BlogPost } from "@/lib/blog-posts"
import type { ForumThread } from "@/lib/forum"
import type { Story } from "@/lib/news-data"
import type { SignalAnalysisItem } from "@/lib/signal-analysis"
import { buildExcerpt } from "@/lib/forum-utils"
import { normalizeSignal, type Signal } from "@/lib/signals"

export type HomeFeedKind = "editorial" | "forum" | "wire" | "notable" | "analysis"

export interface HomeFeedItem {
  id: string
  kind: HomeFeedKind
  topic: string
  title: string
  excerpt: string
  source: string
  publishedAt: string
  href: string
  external: boolean
  image?: string
  signal: Signal
}

function cleanText(value: string | null | undefined, fallback: string): string {
  const cleaned = (value ?? "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim()
  return cleaned || fallback
}

function cleanExcerpt(value: string | null | undefined, fallback: string): string {
  const excerpt = buildExcerpt((value ?? "").trim())
  return cleanText(excerpt, fallback)
}

function validDate(value: string | null | undefined): string {
  if (value && Number.isFinite(Date.parse(value))) return new Date(value).toISOString()
  return new Date(0).toISOString()
}

function validExternalUrl(value: string | null | undefined): string | null {
  if (!value) return null
  try {
    const url = new URL(value)
    return /^https?:$/i.test(url.protocol) ? url.toString() : null
  } catch {
    return null
  }
}

function safeImageUrl(value: string | null | undefined): string | undefined {
  if (!value) return undefined
  if (value.startsWith("/")) return value
  return validExternalUrl(value) ?? undefined
}

function makeItem(input: Omit<HomeFeedItem, "signal">): HomeFeedItem {
  return {
    ...input,
    signal: normalizeSignal({
      id: input.id,
      kind: input.kind,
      title: input.title,
      excerpt: input.excerpt,
      source: input.source,
      category: input.topic,
      url: input.href,
      imageUrl: input.image,
      publishedAt: input.publishedAt,
    }),
  }
}

export function adaptHomeFeed({
  blogs,
  threads,
  stories,
  notables,
  analysis = [],
}: {
  blogs: BlogPost[]
  threads: ForumThread[]
  stories: Story[]
  notables: NotablesPost[]
  analysis?: SignalAnalysisItem[]
}): HomeFeedItem[] {
  const editorial = blogs.slice(0, 5).map((post) =>
    makeItem({
      id: `editorial:${post.id ?? post.slug}`,
      kind: "editorial",
      topic: cleanText(post.category || post.tag, "EDITORIAL").toUpperCase(),
      title: cleanText(post.title, "Untitled editorial"),
      excerpt: cleanText(post.excerpt, "Read the latest editorial briefing."),
      source: cleanText(post.sourceName, "QNOTABLES EDITORIAL"),
      publishedAt: validDate(post.publishedAt || post.date),
      href: `/blog/${encodeURIComponent(post.slug)}`,
      external: false,
      image: safeImageUrl(post.coverImage || post.seoImageUrl),
    }),
  )

  const forum = threads.slice(0, 5).map((thread) =>
    makeItem({
      id: `forum:${thread.id}`,
      kind: "forum",
      topic: cleanText(thread.category, "OPEN FORUM").toUpperCase(),
      title: cleanText(thread.title, "Untitled discussion"),
      excerpt: cleanExcerpt(thread.latestReply?.body || thread.body, "Community discussion is available in the forum."),
      source: "QNOTABLES FORUM",
      publishedAt: validDate(thread.lastActivityAt || thread.latestReply?.createdAt || thread.createdAt),
      href: thread.slug ? `/forum/${encodeURIComponent(thread.slug)}` : `/forum/thread/${encodeURIComponent(thread.id)}`,
      external: false,
      image: safeImageUrl(thread.latestImageUrl),
    }),
  )

  const wire = stories
    .filter((story, index, all) => all.findIndex((candidate) => candidate.id === story.id) === index)
    .slice(0, 8)
    .map((story) => {
      const href = validExternalUrl(story.url) || "/"
      return makeItem({
        id: `wire:${story.id}`,
        kind: "wire",
        topic: cleanText(story.category, "WIRE").toUpperCase(),
        title: cleanText(story.headline, "Untitled wire report"),
        excerpt: cleanText(story.summary, "Open the full wire report for additional context."),
        source: cleanText(story.source, "WIRE DESK"),
        publishedAt: validDate(new Date(Date.now() - Math.max(0, story.minutesAgo) * 60_000).toISOString()),
        href,
        external: href !== "/",
        image: safeImageUrl(story.image),
      })
    })

  const notableItems = notables.slice(0, 5).map((notable) => {
    const href = validExternalUrl(notable.source_url || notable.thread_url) || "/notables"
    return makeItem({
      id: `notable:${notable.id}`,
      kind: "notable",
      topic: cleanText(notable.tag || notable.board, "NOTABLES").toUpperCase(),
      title: cleanText(notable.title, "Untitled notable"),
      excerpt: cleanExcerpt(notable.excerpt || notable.body || notable.raw_text, "Open the notable record for the source material."),
      source: cleanText(notable.source, "NOTABLES DESK"),
      publishedAt: validDate(notable.published_at || notable.created_at_source || notable.scraped_at),
      href,
      external: href !== "/notables",
      image: safeImageUrl(notable.cover_image || notable.og_image_url),
    })
  })

  const analysisItems = analysis.slice(0, 8).map((item) => makeItem({
    id: `analysis:${item.id}`,
    kind: "analysis",
    topic: cleanText(item.category, "SIGNAL ANALYSIS").toUpperCase(),
    title: cleanText(item.title, "Untitled signal"),
    excerpt: cleanText(item.excerpt, item.analysis.rationale || "Approved signal analysis."),
    source: cleanText(item.source, "ANALYSIS DESK"),
    publishedAt: validDate(item.publishedAt),
    href: validExternalUrl(item.url) || "/notables",
    external: Boolean(validExternalUrl(item.url)),
    image: safeImageUrl(item.imageUrl),
  }))

  return [...editorial, ...forum, ...wire, ...notableItems, ...analysisItems]
    .sort((a, b) => {
      const dateDifference = Date.parse(b.publishedAt) - Date.parse(a.publishedAt)
      return dateDifference || a.id.localeCompare(b.id)
    })
    .slice(0, 16)
}
