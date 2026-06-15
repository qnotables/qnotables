"use client"

interface LiveStreamButtonProps {
  live: boolean
}

export function LiveStreamButton({ live }: LiveStreamButtonProps) {
  if (!live) {
    return (
      <span className="label-mono hidden text-muted-foreground sm:inline">
        // CACHED BRIEF
      </span>
    )
  }

  return (
    <button
      onClick={() => {
        window.open(
          "https://rumble.com/c/Qnotables",
          "rumble_popout",
          "width=1000,height=700,resizable=yes,scrollbars=yes"
        )
      }}
      className="label-mono hidden items-center gap-1 text-primary transition-colors hover:text-primary/80 sm:inline-flex cursor-pointer"
      title="Open Rumble live stream in popout"
    >
      <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-primary" /> LIVE STREAM
    </button>
  )
}
