"use client"

import Link from "next/link"
import { useMemo, useState } from "react"
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Compass,
  Lightbulb,
  MessageCircle,
  PenLine,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { FORUM_CATEGORIES, normalizeCategorySlug } from "@/lib/forum-utils"
import type { ThreadListItem } from "@/components/forum-list"

interface ForumCommunityHubProps {
  threads: ThreadListItem[]
  categoryCounts: Record<string, number>
  isSignedIn: boolean
}

const prompts = [
  "What local change would make everyday life meaningfully better?",
  "Which source changed how you understood an issue?",
  "What are you researching that others might help clarify?",
]

export function ForumCommunityHub({ threads, categoryCounts, isSignedIn }: ForumCommunityHubProps) {
  const [promptIndex, setPromptIndex] = useState(0)
  const featured = useMemo(() => threads.filter((thread) => thread.is_featured || thread.is_pinned).slice(0, 3), [threads])
  const recent = useMemo(() => threads.filter((thread) => !featured.some((item) => item.id === thread.id)).slice(0, 4), [threads, featured])

  return (
    <div className="flex flex-col gap-8">
      <section className="relative overflow-hidden border border-primary/30 bg-card px-6 py-8 md:px-10 md:py-12">
        <div className="absolute right-0 top-0 h-24 w-24 border-b border-l border-primary/20" aria-hidden="true" />
        <div className="relative max-w-3xl">
          <div className="label-mono mb-4 flex items-center gap-2 text-xs text-primary"><Compass className="size-4" /> A PLACE TO THINK OUT LOUD</div>
          <h2 className="stencil text-balance text-3xl leading-tight text-foreground md:text-5xl">Welcome to the Town Hall.</h2>
          <p className="mt-4 max-w-2xl text-pretty text-base leading-7 text-muted-foreground md:text-lg">Bring a source, a question, or a careful observation. The best discussions make room for evidence, uncertainty, and people who are still learning.</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button asChild><Link href={isSignedIn ? "/forum/new" : "/auth/login?next=/forum/new"}><PenLine data-icon="inline-start" /> Start a discussion</Link></Button>
            <Button asChild variant="outline"><Link href="/forum/guidelines"><BookOpen data-icon="inline-start" /> Read the guidelines</Link></Button>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <Card><CardHeader><CardTitle className="flex items-center gap-2 text-lg"><Users className="size-5 text-primary" /> Meet thoughtfully</CardTitle></CardHeader><CardContent><p className="text-sm leading-6 text-muted-foreground">Ask honest questions, cite what you can, and make space for a good-faith reply.</p></CardContent></Card>
        <Card><CardHeader><CardTitle className="flex items-center gap-2 text-lg"><Sparkles className="size-5 text-primary" /> Community highlights</CardTitle></CardHeader><CardContent><p className="text-sm leading-6 text-muted-foreground">Featured threads are selected for clarity, generosity, and useful detail—not volume.</p></CardContent></Card>
        <Card><CardHeader><CardTitle className="flex items-center gap-2 text-lg"><ShieldCheck className="size-5 text-primary" /> A calmer signal</CardTitle></CardHeader><CardContent><p className="text-sm leading-6 text-muted-foreground">Report problems privately. Moderation is transparent, consistent, and focused on keeping discussion usable.</p></CardContent></Card>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1fr_300px]">
        <div className="flex flex-col gap-4">
          <div className="flex items-end justify-between gap-4"><div><div className="label-mono text-xs text-primary">CURATED DISCUSSIONS</div><h2 className="stencil mt-1 text-2xl text-foreground">Community highlights</h2></div><Link href="/forum?sort=featured" className="label-mono text-xs text-primary hover:underline">View all <ArrowRight className="inline size-3" /></Link></div>
          {featured.length > 0 ? featured.map((thread) => <HighlightCard key={thread.id} thread={thread} />) : <EmptyPanel text="Thoughtful discussions will appear here as the Town Hall grows." />}
        </div>
        <aside className="flex flex-col gap-4">
          <Card className="bg-primary/5"><CardHeader><CardTitle className="flex items-center gap-2 text-lg"><Lightbulb className="size-5 text-primary" /> Weekly prompt</CardTitle><CardDescription>Start with curiosity, not certainty.</CardDescription></CardHeader><CardContent><p className="text-sm leading-6 text-foreground">{prompts[promptIndex]}</p><Button variant="ghost" size="sm" className="mt-3 px-0 text-primary" onClick={() => setPromptIndex((index) => (index + 1) % prompts.length)}>Show another prompt</Button></CardContent></Card>
          <Card><CardHeader><CardTitle className="text-lg">Find your room</CardTitle></CardHeader><CardContent className="flex flex-col gap-2">{FORUM_CATEGORIES.slice(0, 6).map((category) => <Link key={category.slug} href={`/forum?category=${category.slug}`} className="flex items-center justify-between border-b border-border/60 pb-2 text-sm text-muted-foreground transition-colors last:border-0 last:pb-0 hover:text-primary"><span>{category.name}</span><Badge variant="secondary">{categoryCounts[normalizeCategorySlug(category.slug)] ?? 0}</Badge></Link>)}</CardContent></Card>
        </aside>
      </section>

      <section>
        <div className="flex items-end justify-between gap-4"><div><div className="label-mono text-xs text-primary">RECENT CONVERSATIONS</div><h2 className="stencil mt-1 text-2xl text-foreground">What people are discussing</h2></div><Link href="/forum?sort=newest" className="label-mono text-xs text-primary hover:underline">Browse latest <ArrowRight className="inline size-3" /></Link></div>
        <div className="mt-4 grid gap-3 md:grid-cols-2">{recent.length > 0 ? recent.map((thread) => <RecentCard key={thread.id} thread={thread} />) : <EmptyPanel text="There are no recent threads yet. Start the first useful question." />}</div>
      </section>

      <section className="border border-border bg-muted/30 p-6 md:p-8"><div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between"><div><div className="label-mono text-xs text-primary">NEW HERE?</div><h2 className="stencil mt-1 text-2xl text-foreground">Make your first post easier to answer.</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">Lead with the question, add the context that matters, and link the source or example that brought you here.</p></div><Button asChild variant="outline"><Link href="/forum/guidelines"><CheckCircle2 data-icon="inline-start" /> See posting tips</Link></Button></div></section>
    </div>
  )
}

function HighlightCard({ thread }: { thread: ThreadListItem }) {
  return <Link href={`/forum/${thread.slug || thread.id}`} className="group border border-border bg-card p-5 transition-colors hover:border-primary"><div className="flex items-start justify-between gap-4"><div><div className="label-mono text-[10px] text-primary">{thread.is_pinned ? "PINNED" : "FEATURED"}</div><h3 className="stencil mt-2 text-xl leading-snug text-foreground group-hover:text-primary">{thread.title}</h3></div><MessageCircle className="size-5 shrink-0 text-muted-foreground" /></div><p className="mt-3 line-clamp-2 text-sm leading-6 text-muted-foreground">{thread.excerpt || thread.body}</p><div className="label-mono mt-4 flex flex-wrap gap-3 text-[10px] text-muted-foreground"><span>{thread.authorName}</span><span>{thread.replyCount} replies</span><span>{thread.category || "Open discussion"}</span></div></Link>
}

function RecentCard({ thread }: { thread: ThreadListItem }) {
  return <Link href={`/forum/${thread.slug || thread.id}`} className="group border border-border bg-card p-4 transition-colors hover:border-primary"><div className="flex items-start gap-3"><MessageCircle className="mt-0.5 size-4 shrink-0 text-primary" /><div className="min-w-0"><h3 className="truncate text-sm font-semibold text-foreground group-hover:text-primary">{thread.title}</h3><p className="mt-1 text-xs text-muted-foreground">{thread.authorName} · {thread.replyCount} replies</p></div></div></Link>
}

function EmptyPanel({ text }: { text: string }) {
  return <div className="border border-dashed border-border bg-card p-8 text-sm leading-6 text-muted-foreground">{text}</div>
}
