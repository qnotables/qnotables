import Link from "next/link"
import type { ReactNode } from "react"
import { MessageSquare, Radio, Rss, ScanSearch, ScrollText } from "lucide-react"
import { CardImage } from "@/components/card-image"
import { ShareButtons } from "@/components/share-buttons"
import { SignalActionMenu } from "@/components/signal-action-menu"
import { timeAgo } from "@/lib/time"
import type { SignalActionState } from "@/lib/signals"
import type { HomeFeedItem } from "@/lib/home-feed"

const KIND_LABELS = {
  editorial: "EDITORIAL",
  forum: "FORUM",
  wire: "WIRE",
  notable: "NOTABLE",
  analysis: "ANALYSIS",
} as const

const KIND_ICONS = {
  editorial: ScrollText,
  forum: MessageSquare,
  wire: Radio,
  notable: Rss,
  analysis: ScanSearch,
} as const

function FeedDestination({ item, children }: { item: HomeFeedItem; children: ReactNode }) {
  if (item.external) {
    return (
      <a href={item.href} target="_blank" rel="noopener noreferrer" className="group/title">
        {children}
      </a>
    )
  }

  return <Link href={item.href} className="group/title">{children}</Link>
}

function FeedCard({ item, isLoggedIn, activeActions }: { item: HomeFeedItem; isLoggedIn: boolean; activeActions: SignalActionState[string] }) {
  const Icon = KIND_ICONS[item.kind]
  const timestamp = Date.parse(item.publishedAt) > 0 ? timeAgo(item.publishedAt) : "date unknown"

  return (
    <article className="group grid grid-cols-1 border border-border bg-card transition-colors hover:border-primary sm:grid-cols-[minmax(0,1fr)_13rem]">
      <div className="flex min-w-0 flex-col p-5">
        <div className="flex items-center gap-2 text-primary">
          <Icon className="h-3.5 w-3.5" aria-hidden="true" />
          <span className="label-mono text-[10px] font-semibold tracking-[0.16em]">{KIND_LABELS[item.kind]}</span>
          <span className="text-border">/</span>
          <span className="label-mono truncate text-[10px] text-muted-foreground">{item.topic}</span>
        </div>

        <FeedDestination item={item}>
          <h2 className="mt-3 text-pretty font-mono text-lg font-semibold leading-snug text-foreground transition-colors group-hover/title:text-primary">
            {item.title}
          </h2>
        </FeedDestination>

        <p className="mt-3 line-clamp-3 text-sm leading-6 text-muted-foreground">{item.excerpt}</p>

        <div className="mt-auto flex flex-wrap items-center gap-x-3 gap-y-2 pt-5">
          <span className="label-mono text-[10px] font-semibold text-foreground">{item.source}</span>
          <span className="label-mono text-[10px] text-muted-foreground">{timestamp}</span>
          <div className="ml-auto flex items-center gap-3">
            <ShareButtons title={item.title} url={item.href} excerpt={item.excerpt} source={item.source} />
            <SignalActionMenu signal={item.signal} isLoggedIn={isLoggedIn} activeActions={activeActions} />
          </div>
        </div>
      </div>

      <FeedDestination item={item}>
        <CardImage src={item.image} alt="" aspectRatio="video" className="h-full min-h-40 sm:min-h-0" />
        <span className="sr-only">Open {item.title}</span>
      </FeedDestination>
    </article>
  )
}

export function HomeFeed({ items, isLoggedIn, activeActions }: { items: HomeFeedItem[]; isLoggedIn: boolean; activeActions: SignalActionState }) {
  if (items.length === 0) {
    return (
      <div className="border border-dashed border-border p-8 text-center">
        <p className="label-mono text-xs text-muted-foreground">NO FEED ITEMS AVAILABLE</p>
      </div>
    )
  }

  return (
    <section aria-labelledby="home-feed-heading">
      <div className="mb-4 flex items-center gap-3">
        <h2 id="home-feed-heading" className="stencil text-lg text-foreground">Open Source Stream</h2>
        <span className="h-px flex-1 bg-border" />
        <span className="label-mono text-[10px] text-muted-foreground">{items.length} SIGNALS</span>
      </div>
      <div className="flex flex-col gap-4">
        {items.map((item) => (
          <FeedCard key={item.id} item={item} isLoggedIn={isLoggedIn} activeActions={activeActions[item.signal.signalKey] ?? []} />
        ))}
      </div>
    </section>
  )
}
