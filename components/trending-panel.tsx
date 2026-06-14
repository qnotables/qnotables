import { TrendingUp } from "lucide-react"

type TrendingItem = { rank: number; headline: string; reports: number; url?: string }

export function TrendingPanel({ items }: { items: TrendingItem[] }) {
  const trending = items
  const max = Math.max(...trending.map((t) => t.reports), 1)
  return (
    <section className="border border-border bg-card">
      <header className="flex items-center gap-2 border-b border-border bg-secondary px-4 py-3 text-secondary-foreground">
        <TrendingUp className="h-4 w-4" />
        <h2 className="stencil text-lg">Most Reported</h2>
      </header>
      <ol className="divide-y divide-border">
        {trending.map((t) => (
          <li key={t.rank}>
            <a
              href={t.url || "#"}
              {...(t.url ? { target: "_blank", rel: "noopener noreferrer" } : {})}
              className="group flex items-center gap-3 px-4 py-3 transition-colors hover:bg-muted"
            >
              <span className="stencil w-6 shrink-0 text-2xl leading-none text-primary">
                {String(t.rank).padStart(2, "0")}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm leading-snug text-foreground transition-colors group-hover:text-primary">
                  {t.headline}
                </p>
                <div className="mt-1.5 flex items-center gap-2">
                  <div className="h-1 flex-1 bg-muted">
                    <div
                      className="h-1 bg-primary"
                      style={{ width: `${(t.reports / max) * 100}%` }}
                    />
                  </div>
                  <span className="label-mono shrink-0 text-muted-foreground">
                    {t.reports}
                  </span>
                </div>
              </div>
            </a>
          </li>
        ))}
      </ol>
    </section>
  )
}
