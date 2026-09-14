import Link from "next/link"
import { ArrowUpRight, MessageSquare, Radio, ScanSearch } from "lucide-react"
import type { PulseCard, PulseSettings, TownHallPulse } from "@/lib/pulse"
import { PulseImagePreview, PulseVideoPreview } from "@/components/pulse-video-preview"

function formatActivity(value: string): string {
  const date = new Date(value)
  if (!Number.isFinite(date.getTime())) return "activity unknown"
  const days = Math.floor((Date.now() - date.getTime()) / 86_400_000)
  if (days <= 0) return "active today"
  if (days === 1) return "active 1d ago"
  return `active ${days}d ago`
}

function PulseCardView({ card }: { card: PulseCard }) {
  return (
    <article className="group relative flex min-h-52 flex-col border border-border bg-card/70 p-5 transition-colors hover:border-primary focus-within:border-primary">
      <div className="flex items-center justify-between gap-3">
        <span className="label-mono text-[10px] font-semibold tracking-[0.16em] text-primary">{card.eyebrow}</span>
        <span className="label-mono text-[10px] text-muted-foreground">{card.sourceStatus}</span>
      </div>
      {card.video ? (
        <div className="relative z-10 mt-5">
          <PulseVideoPreview video={card.video} title={card.title} />
          <span className="label-mono pointer-events-none absolute left-2 top-2 border border-primary bg-background/80 px-2 py-1 text-[9px] font-semibold tracking-[0.14em] text-primary backdrop-blur-sm">VIDEO PREVIEW</span>
        </div>
      ) : card.ogImageUrl ? (
        <div className="relative z-10 mt-5 aspect-[16/8] overflow-hidden border border-border bg-muted/30">
          <PulseImagePreview src={card.ogImageUrl} alt={`${card.title} preview`} />
          <span className="label-mono absolute bottom-2 left-2 border border-border bg-background/80 px-2 py-1 text-[9px] font-semibold tracking-[0.14em] text-foreground backdrop-blur-sm">SOURCE PREVIEW</span>
        </div>
      ) : null}
      <div className="mt-5 flex items-start gap-3">
        <span aria-hidden="true" className="mt-1 h-2 w-2 shrink-0 bg-primary" />
        <div>
          <p className="label-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">{card.category}</p>
          <h3 className="stencil mt-2 text-lg leading-tight text-foreground">
            <Link href={card.href} className="after:absolute after:inset-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary" aria-label={`Open discussion: ${card.title}`}>
              {card.title}
            </Link>
          </h3>
        </div>
      </div>
      <p className="relative mt-4 line-clamp-3 text-sm leading-6 text-muted-foreground">{card.excerpt}</p>
      <div className="relative mt-auto flex items-center justify-between gap-3 pt-5">
        <span className="label-mono inline-flex items-center gap-2 text-[10px] text-muted-foreground">
          <MessageSquare className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
          {card.replyCount} {card.replyCount === 1 ? "REPLY" : "REPLIES"} · {formatActivity(card.activityAt)}
        </span>
        <span className="label-mono inline-flex items-center gap-1 text-[10px] text-primary opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
          JOIN DISCUSSION <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
        </span>
      </div>
    </article>
  )
}

export function PulseCards({ pulse }: { pulse: TownHallPulse | { settings: PulseSettings; cards: PulseCard[] } }) {
  if (pulse.cards.length === 0) {
    return <p className="border border-dashed border-border px-5 py-6 text-sm leading-6 text-muted-foreground">The signal is quiet. Check back when the Town Hall has a new thread to examine.</p>
  }
  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
      {pulse.cards.map((card) => <PulseCardView key={`${card.slot}:${card.threadId}`} card={card} />)}
    </div>
  )
}

export function TownHallPulse({ pulse, isLoggedIn }: { pulse: TownHallPulse; isLoggedIn: boolean }) {
  if (!pulse.settings.enabled) return null
  return (
    <section aria-labelledby="town-hall-pulse-title" className="mb-8 border-y border-border py-6">
      <div className="mb-5 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="max-w-2xl">
          <div className="flex items-center gap-3">
            <Radio className="h-4 w-4 text-primary" aria-hidden="true" />
            <p className="label-mono text-[10px] font-semibold tracking-[0.2em] text-primary">{pulse.settings.kicker}</p>
          </div>
          <h2 id="town-hall-pulse-title" className="stencil mt-2 text-3xl text-foreground md:text-4xl">{pulse.settings.title}</h2>
          <p className="mt-2 max-w-xl text-pretty text-sm leading-6 text-muted-foreground">{pulse.settings.description}</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Link href="/forum" className="label-mono inline-flex items-center gap-2 border border-primary px-4 py-2 text-xs font-semibold text-primary transition-colors hover:bg-primary hover:text-primary-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">{pulse.settings.enterLabel}<ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" /></Link>
          <Link href={isLoggedIn ? "/forum/new" : "/auth/login?next=/forum/new"} className="label-mono inline-flex items-center gap-2 bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">{isLoggedIn ? pulse.settings.startLabel : "SIGN IN TO PARTICIPATE"}<ScanSearch className="h-3.5 w-3.5" aria-hidden="true" /></Link>
        </div>
      </div>
      <PulseCards pulse={pulse} />
    </section>
  )
}

export function PulsePreview({ cards }: { cards: PulseCard[] }) {
  return <PulseCards pulse={{ settings: { enabled: true, editorThreadId: null, excludedThreadIds: [], activeMaxAgeDays: 14, backchannelMaxAgeDays: 14, kicker: "", title: "", description: "", enterLabel: "", startLabel: "", updatedBy: null }, cards }} />
}
