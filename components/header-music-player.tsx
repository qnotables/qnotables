"use client"

import { Pause, Play, SkipBack, SkipForward, Volume2, VolumeX } from "lucide-react"
import { useState } from "react"
import { useMusicPlayer } from "@/lib/music-player-context"

export function HeaderMusicPlayer() {
  const [showVolume, setShowVolume] = useState(false)
  const { tracks, playing, muted, volume, progress, togglePlay, prev, next, seek, setMuted, setVolume } = useMusicPlayer()

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

      {/* Volume */}
      <div className="relative flex items-center gap-1">
        <button
          type="button"
          onClick={() => setShowVolume((visible) => !visible)}
          aria-label={showVolume ? "Hide volume control" : "Show volume control"}
          aria-expanded={showVolume}
          title={`Volume ${Math.round(volume * 100)}%`}
          className="p-0.5 text-muted-foreground transition-colors hover:text-primary"
        >
          {muted || volume === 0 ? <VolumeX className="h-3 w-3" /> : <Volume2 className="h-3 w-3" />}
        </button>
        {showVolume && (
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={muted ? 0 : volume}
            onChange={(event) => {
              const nextVolume = Number(event.target.value)
              setVolume(nextVolume)
              if (nextVolume > 0 && muted) setMuted(false)
            }}
            aria-label="Volume"
            className="h-1 w-16 cursor-pointer accent-primary"
          />
        )}
      </div>
    </div>
  )
}
