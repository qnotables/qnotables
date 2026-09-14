import type { Story } from "@/lib/news-data"

export const SIGNAL_ACTION_TYPES = ["archive", "research", "thread_draft", "dossier"] as const
export type SignalActionType = (typeof SIGNAL_ACTION_TYPES)[number]

export type SignalInput = {
  id?: string
  kind?: string
  title: string
  excerpt?: string
  source?: string
  category?: string
  url?: string
  imageUrl?: string
  publishedAt?: string
  metadata?: Record<string, string | number | boolean | null>
}

export type Signal = {
  signalKey: string
  sourceKind: string
  sourceId?: string
  title: string
  excerpt: string
  source: string
  category: string
  url: string
  imageUrl?: string
  publishedAt?: string
  metadata: Record<string, string | number | boolean | null>
}

const INTERNAL_SIGNAL_ORIGIN = "https://qnotables.ai"

function normalizeText(value: string | undefined, maxLength: number): string {
  return (value ?? "").replace(/[\u0000-\u001F\u007F]/g, " ").replace(/\s+/g, " ").trim().slice(0, maxLength)
}

export function normalizeHttpUrl(value: string | undefined): string | undefined {
  if (!value) return undefined
  try {
    const url = new URL(value)
    if (!/^https?:$/i.test(url.protocol)) return undefined
    url.hash = ""
    return url.toString().slice(0, 2048)
  } catch {
    return undefined
  }
}

function hashSignal(value: string): string {
  let hash = 2166136261
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index)
    hash = Math.imul(hash, 16777619)
  }
  return (hash >>> 0).toString(16).padStart(8, "0")
}

export function normalizeSignal(input: SignalInput): Signal {
  const sourceKind = normalizeText(input.kind, 40).toLowerCase() || "signal"
  const sourceId = normalizeText(input.id, 160) || undefined
  const title = normalizeText(input.title, 240) || "Untitled signal"
  const excerpt = normalizeText(input.excerpt, 1200)
  const source = normalizeText(input.source, 120) || "QNotables"
  const category = normalizeText(input.category, 80) || "OTHER"
  const url = normalizeHttpUrl(input.url) ?? `${INTERNAL_SIGNAL_ORIGIN}/#signal-${encodeURIComponent(sourceId ?? title.slice(0, 80))}`
  const imageUrl = normalizeHttpUrl(input.imageUrl)
  const publishedAt = normalizeText(input.publishedAt, 80) || undefined
  const identity = `${sourceKind}|${sourceId ?? ""}|${url}`

  return {
    signalKey: `sig_${hashSignal(identity)}`,
    sourceKind,
    sourceId,
    title,
    excerpt,
    source,
    category,
    url,
    imageUrl,
    publishedAt,
    metadata: input.metadata ?? {},
  }
}

export function signalFromStory(story: Story): Signal {
  return normalizeSignal({
    id: story.id,
    kind: "wire",
    title: story.headline,
    excerpt: story.summary,
    source: story.source,
    category: story.category,
    url: story.url,
    imageUrl: story.image,
  })
}

function buildQueryUrl(pathname: string, signal: Signal, params: Record<string, string>): string {
  const url = new URL(pathname, INTERNAL_SIGNAL_ORIGIN)
  Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, value.slice(0, 2048)))
  return `${url.pathname}${url.search}`
}

export function buildResearchHref(signal: Signal): string {
  return buildQueryUrl("/search", signal, {
    q: signal.title,
    source: signal.source,
  })
}

export function buildThreadDraftHref(signal: Signal): string {
  return buildQueryUrl("/forum/new", signal, {
    import: "1",
    title: signal.title,
    body: signal.excerpt,
    sourceUrl: signal.url,
    sourceName: signal.source,
    category: signal.category,
    imageUrl: signal.imageUrl ?? "",
    postedAt: signal.publishedAt ?? "",
  })
}

export type SignalActionState = Record<string, SignalActionType[]>
