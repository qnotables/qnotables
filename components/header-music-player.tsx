"use client"

import { Pause, Play, SkipBack, SkipForward, Volume2, VolumeX } from "lucide-react"
import { useMusicPlayer } from "@/lib/music-player-context"

export function HeaderMusicPlayer() {
  const { tracks, playing, muted, progress, togglePlay, prev, next, seek } = useMusicPlayer()

  if (tracks.length === 0) return null

  function handleSeek(e: React.MouseEvent<HTMLButtonElement>) {
    const rect = e.currentTarget.getBoundingClientRect()
    const ratio = (e.clientX - rect.left) / rect.width
    seek(ratio)
  }

  return (
    <div className="flex items-center gap-1.5 border border-border bg-card px-2 py-1">
      {/* Prev */}
      <button
        onClick={prev}
        aria-label="Previous track"
        className="p-0.5 text-muted-foreground transition-colors hover:text-primary"
      >
        <SkipBack className="h-3 w-3" />
      </button>

      {/* Play / Pause */}
      <button
        onClick={togglePlay}
        aria-label={playing ? "Pause" : "Play"}
        className="flex h-6 w-6 items-center justify-center border border-primary bg-primary/10 text-primary transition-colors hover:bg-primary hover:text-primary-foreground"
      >
        {playing ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
      </button>

      {/* Next */}
      <button
        onClick={next}
        aria-label="Next track"
        className="p-0.5 text-muted-foreground transition-colors hover:text-primary"
      >
        <SkipForward className="h-3 w-3" />
      </button>

      {/* Progress bar — clickable */}
      <button
        onClick={handleSeek}
        aria-label="Seek"
        className="relative h-1 w-16 bg-border hover:h-1.5 transition-all"
      >
        <span
          className="absolute inset-y-0 left-0 bg-primary transition-all"
          style={{ width: `${progress}%` }}
        />
      </button>

      {/* Mute */}
      <button
        onClick={() => setMuted((m) => !m)}
        aria-label={muted ? "Unmute" : "Mute"}
        className="p-0.5 text-muted-foreground transition-colors hover:text-primary"
      >
        {muted ? <VolumeX className="h-3 w-3" /> : <Volume2 className="h-3 w-3" />}
      </button>
    </div>
  )
}
