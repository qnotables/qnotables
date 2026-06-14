export function NewsTicker({ headlines }: { headlines: string[] }) {
  const items = headlines.length ? headlines : ["Awaiting live wire feed…"]
  // duplicate for a seamless loop
  const loop = [...items, ...items]

  return (
    <div className="flex items-stretch border-b border-border bg-card">
      <div className="flex shrink-0 items-center gap-2 bg-primary px-3 py-2 text-primary-foreground">
        <span className="label-mono font-semibold">BREAKING</span>
      </div>
      <div className="group relative flex-1 overflow-hidden">
        <div className="flex w-max animate-[ticker_130s_linear_infinite] items-center gap-8 py-2 pl-4 group-hover:[animation-play-state:paused]">
          {loop.map((headline, i) => (
            <span
              key={i}
              className="flex items-center gap-8 whitespace-nowrap text-sm italic text-muted-foreground"
            >
              <span className="text-primary">+</span>
              {headline}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
