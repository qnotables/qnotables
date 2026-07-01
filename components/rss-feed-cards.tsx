import { Rss, ExternalLink } from "lucide-react"
import { RSS_SOURCES } from "@/lib/rss"

export function RssFeedCards() {
  const enabledSources = RSS_SOURCES.filter((s) => s.enabled)

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      {enabledSources.map((source) => (
        <a
          key={source.id}
          href={source.url}
          target="_blank"
          rel="noopener noreferrer"
          className="group flex items-start gap-4 border border-border bg-card p-4 transition-all hover:border-primary hover:bg-muted/20"
        >
          <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center border border-border bg-muted text-muted-foreground transition-colors group-hover:border-primary group-hover:text-primary">
            <Rss className="h-4 w-4" />
          </div>
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <div className="flex items-center gap-2">
              <span className="stencil truncate text-sm text-foreground group-hover:text-primary">
                {source.name}
              </span>
              <ExternalLink className="h-3 w-3 shrink-0 text-muted-foreground transition-colors group-hover:text-primary" />
            </div>
            <span className="label-mono truncate text-[11px] text-muted-foreground">
              {source.url}
            </span>
            <span className="label-mono mt-1 text-[10px] font-semibold tracking-wider text-primary/70 group-hover:text-primary">
              RSS FEED →
            </span>
          </div>
        </a>
      ))}
    </div>
  )
}
