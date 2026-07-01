import { ArrowUpRight, Clock, FileText } from "lucide-react"
import { RSS_SOURCES } from "@/lib/rss"
import { PriorityTag } from "@/components/priority-tag"

// Assign a priority level and short description to each feed for display
const FEED_META: Record<string, { priority: "PRIORITY" | "ROUTINE"; category: string; description: string }> = {
  "/qr/": {
    priority: "PRIORITY",
    category: "/QRESEARCH/",
    description: "Live tripcode feed from 8kun /qresearch/. Real-time Q drops and research thread activity.",
  },
  "qnotables": {
    priority: "ROUTINE",
    category: "/QNOTABLES/",
    description: "Curated notables feed from the /qnotables/ board. Aggregated highlights from active threads.",
  },
  "fox": {
    priority: "PRIORITY",
    category: "FOX NEWS",
    description: "Breaking political headlines from Fox News politics desk. Updated continuously.",
  },
  "foxn": {
    priority: "ROUTINE",
    category: "FOX NEWS",
    description: "National news feed from Fox News. Top stories across the United States.",
  },
  "NY Post": {
    priority: "ROUTINE",
    category: "NY POST",
    description: "National and political coverage from the New York Post.",
  },
}

export function RssFeedCards() {
  const enabledSources = RSS_SOURCES.filter((s) => s.enabled).slice(0, 2)

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
      {enabledSources.map((source) => {
        const meta = FEED_META[source.id] ?? {
          priority: "ROUTINE" as const,
          category: "RSS",
          description: `Live feed from ${source.name}.`,
        }

        return (
          <a
            key={source.id}
            href={source.url}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex h-full flex-col border border-border bg-card transition-colors hover:border-primary/60"
          >
            {/* Image / header area */}
            <div className="relative aspect-[16/9] w-full overflow-hidden bg-muted/60 border-b border-border">
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="label-mono text-[11px] font-semibold text-muted-foreground tracking-widest uppercase opacity-40">
                  {meta.category}
                </span>
              </div>
              <div className="absolute left-0 top-0 flex items-center gap-2 p-2">
                <PriorityTag level={meta.priority} />
              </div>
            </div>

            {/* Body */}
            <div className="flex flex-1 flex-col p-4">
              <div className="flex items-center gap-2">
                <span className="label-mono text-primary">{meta.category}</span>
              </div>

              <div className="mt-2 block flex-1">
                <h3 className="stencil text-xl text-balance leading-[1.02] text-foreground transition-colors group-hover:text-primary">
                  {source.name}
                </h3>
                <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-muted-foreground">
                  {meta.description}
                </p>
              </div>

              {/* Footer */}
              <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-border pt-3">
                <span className="label-mono text-foreground">{source.name}</span>
                <span className="label-mono flex items-center gap-1.5 text-muted-foreground">
                  <FileText className="h-3 w-3" /> RSS
                </span>
                <div className="ml-auto flex items-center gap-3">
                  <ArrowUpRight className="h-4 w-4 text-muted-foreground transition-colors group-hover:text-primary" />
                </div>
              </div>
            </div>
          </a>
        )
      })}
    </div>
  )
}
