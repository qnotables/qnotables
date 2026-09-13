import Link from "next/link"
import { FileText, Layers, MessageSquare, Pin, Users } from "lucide-react"
import { FORUM_CATEGORIES } from "@/lib/forum-utils"

export interface ForumSidebarStats {
  threadCount: number
  replyCount: number
  memberCount: number
}

export interface PinnedThread {
  id: string
  slug?: string | null
  title: string
  replyCount: number
}

interface ForumSidebarProps {
  stats: ForumSidebarStats
  pinned: PinnedThread[]
  categoryCounts: Record<string, number>
}

function StatRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <div className="flex items-center justify-between border-b border-border/60 py-2 last:border-0">
      <span className="label-mono flex items-center gap-2 text-xs text-muted-foreground">{icon}{label}</span>
      <span className="stencil text-lg leading-none text-foreground">{value.toLocaleString()}</span>
    </div>
  )
}

export function ForumSidebar({ stats, pinned, categoryCounts }: ForumSidebarProps) {
  return (
    <aside className="flex flex-col gap-4">
      <div className="corner-frame border border-border bg-card p-4">
        <h2 className="label-mono mb-2 flex items-center gap-2 text-xs font-semibold text-primary"><Layers className="h-3.5 w-3.5" /> SITREP</h2>
        <StatRow icon={<FileText className="h-3.5 w-3.5" />} label="Threads" value={stats.threadCount} />
        <StatRow icon={<MessageSquare className="h-3.5 w-3.5" />} label="Replies" value={stats.replyCount} />
        <StatRow icon={<Users className="h-3.5 w-3.5" />} label="Operators" value={stats.memberCount} />
      </div>

      {pinned.length > 0 && (
        <div className="border border-border bg-card p-4">
          <h2 className="label-mono mb-3 flex items-center gap-2 text-xs font-semibold text-primary"><Pin className="h-3.5 w-3.5" /> PINNED THREADS</h2>
          <ul className="flex flex-col gap-3">
            {pinned.map((thread) => (
              <li key={thread.id}>
                <Link href={`/forum/${thread.slug || thread.id}`} className="group flex items-start gap-2 text-sm leading-snug text-foreground transition-colors hover:text-primary">
                  <Pin className="mt-0.5 h-3 w-3 shrink-0 text-primary/70" />
                  <span className="min-w-0"><span className="line-clamp-2">{thread.title}</span><span className="label-mono mt-1 block text-[10px] text-muted-foreground">{thread.replyCount} replies</span></span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="border border-border bg-card p-4">
        <h2 className="label-mono mb-3 text-xs font-semibold text-primary">CATEGORIES</h2>
        <ul className="flex flex-col">
          {FORUM_CATEGORIES.map((category) => (
            <li key={category.slug}>
              <Link href={`/forum?category=${category.slug}`} className="flex items-center justify-between border-b border-border/40 py-2 text-sm text-muted-foreground transition-colors last:border-0 hover:text-primary">
                <span>{category.name}</span>
                <span className="label-mono text-[10px] text-muted-foreground/70">{categoryCounts[category.slug] ?? 0}</span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </aside>
  )
}
