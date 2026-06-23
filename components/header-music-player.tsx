"use client"

import { useEffect, useRef, useState } from "react"
import { Pause, Play, SkipBack, SkipForward, Volume2, VolumeX } from "lucide-react"

interface Track {
  title: string
  src: string
}

const TRACKS: Track[] = [
  { title: "WWG1WGA", src: "/audio/wwg1wga.mp3" },
  { title: "THE GREAT AWAKENING", src: "/audio/great-awakening.mp3" },
  { title: "HOLD THE LINE", src: "/audio/hold-the-line.mp3" },
]

export function HeaderMusicPlayer() {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [trackIdx, setTrackIdx] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [muted, setMuted] = useState(false)
  const [progress, setProgress] = useState(0) // 0–100

  const track = TRACKS[trackIdx]

  // Create audio element once
  useEffect(() => {
    const audio = new Audio(track.src)
    audio.preload = "metadata"
    audio.muted = muted

    audio.addEventListener("timeupdate", () => {
      if (audio.duration) {
        setProgress((audio.currentTime / audio.duration) * 100)
      }
    })

    audio.addEventListener("ended", () => {
      setTrackIdx((i) => (i + 1) % TRACKS.length)
    })

    audioRef.current = audio

    return () => {
      audio.pause()
      audio.src = ""
      audioRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trackIdx])

  // Sync mute
  useEffect(() => {
    if (audioRef.current) audioRef.current.muted = muted
  }, [muted])

  // Play / pause
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return
    if (playing) {
      audio.play().catch(() => setPlaying(false))
    } else {
      audio.pause()
    }
  }, [playing])

  function togglePlay() {
    setPlaying((p) => !p)
  }

  function prev() {
    setPlaying(false)
    setProgress(0)
    setTrackIdx((i) => (i - 1 + TRACKS.length) % TRACKS.length)
  }

  function next() {
    setPlaying(false)
    setProgress(0)
    setTrackIdx((i) => (i + 1) % TRACKS.length)
  }

  function seek(e: React.MouseEvent<HTMLButtonElement>) {
    const audio = audioRef.current
    if (!audio || !audio.duration) return
    const rect = e.currentTarget.getBoundingClientRect()
    const ratio = (e.clientX - rect.left) / rect.width
    audio.currentTime = ratio * audio.duration
    setProgress(ratio * 100)
  }

  return (
    <div className="flex items-center gap-1.5 border border-border bg-card px-2 py-1">
      {/* Track label */}
      <span className="label-mono hidden max-w-[120px] truncate text-[10px] text-muted-foreground sm:block">
        {track.title}
      </span>

      <span className="hidden h-3 w-px bg-border sm:block" aria-hidden="true" />

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
        onClick={seek}
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
