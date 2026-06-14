"use client"

type TickerItem = { headline: string; url?: string }

export function NewsTicker({ items }: { items: TickerItem[] }) {
  const displayItems = items.length ? items : [{ headline: "Awaiting live wire feed…" }]
  // duplicate for a seamless loop
  const loop = [...displayItems, ...displayItems]

  return (
    <div className="flex items-stretch border-b border-border bg-card">
      <div className="flex shrink-0 items-center gap-2 bg-primary px-3 py-2 text-primary-foreground">
        <span className="label-mono font-semibold">BREAKING</span>
      </div>
      <div className="group relative flex-1 overflow-hidden">
        <div className="flex w-max animate-[ticker_130s_linear_infinite] items-center gap-8 py-2 pl-4 group-hover:[animation-play-state:paused]">
          {loop.map((item, i) => (
            <span
              key={i}
              className="flex items-center gap-8 whitespace-nowrap text-sm italic text-muted-foreground"
            >
              <span className="text-primary">+</span>
              {item.url ? (
                <a
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="transition-colors hover:text-foreground hover:underline"
                >
                  {item.headline}
                </a>
              ) : (
                <span>{item.headline}</span>
              )}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
