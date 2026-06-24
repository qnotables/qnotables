"use client"

import { createContext, useContext, useEffect, useRef, useState, ReactNode } from "react"

interface Track {
  title: string
  src: string
}

interface MusicPlayerContextType {
  tracks: Track[]
  trackIdx: number
  playing: boolean
  muted: boolean
  progress: number
  setPlaying: (playing: boolean) => void
  setTrackIdx: (idx: number | ((i: number) => number)) => void
  setMuted: (muted: boolean) => void
  prev: () => void
  next: () => void
  togglePlay: () => void
  seek: (ratio: number) => void
}

const MusicPlayerContext = createContext<MusicPlayerContextType | null>(null)

export function MusicPlayerProvider({ children }: { children: ReactNode }) {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [tracks, setTracks] = useState<Track[]>([])
  const [trackIdx, setTrackIdx] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [muted, setMuted] = useState(false)
  const [progress, setProgress] = useState(0)

  // Fetch tracks from API on mount
  useEffect(() => {
    fetch("/api/audio")
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`)
        const ct = r.headers.get("content-type") || ""
        if (!ct.includes("application/json")) throw new Error("Non-JSON response")
        return r.json()
      })
      .then((data) => {
        const fetched: Track[] = (data.tracks || []).map((t: any) => ({
          title: t.title,
          src: t.url,
        }))
        setTracks(fetched)
      })
      .catch(() => setTracks([]))
  }, [])

  const track = tracks[trackIdx]

  // Rebuild audio element whenever the track changes
  useEffect(() => {
    if (!track) return

    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.src = ""
    }

    const audio = new Audio(track.src)
    audio.preload = "metadata"
    audio.muted = muted

    audio.addEventListener("timeupdate", () => {
      if (audio.duration) {
        setProgress((audio.currentTime / audio.duration) * 100)
      }
    })

    audio.addEventListener("ended", () => {
      setProgress(0)
      setTrackIdx((i) => (i + 1) % tracks.length)
    })

    audioRef.current = audio

    if (playing) {
      audio.play().catch(() => setPlaying(false))
    }

    return () => {
      audio.pause()
      audio.src = ""
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [track?.src])

  useEffect(() => {
    if (audioRef.current) audioRef.current.muted = muted
  }, [muted])

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
    setPlaying(true)
    setProgress(0)
    setTrackIdx((i) => (i - 1 + tracks.length) % tracks.length)
  }

  function next() {
    setPlaying(true)
    setProgress(0)
    setTrackIdx((i) => (i + 1) % tracks.length)
  }

  function seek(ratio: number) {
    const audio = audioRef.current
    if (!audio || !audio.duration) return
    audio.currentTime = ratio * audio.duration
    setProgress(ratio * 100)
  }

  return (
    <MusicPlayerContext.Provider
      value={{
        tracks,
        trackIdx,
        playing,
        muted,
        progress,
        setPlaying,
        setTrackIdx,
        setMuted,
        prev,
        next,
        togglePlay,
        seek,
      }}
    >
      {children}
    </MusicPlayerContext.Provider>
  )
}

export function useMusicPlayer() {
  const ctx = useContext(MusicPlayerContext)
  if (!ctx) throw new Error("useMusicPlayer must be used within MusicPlayerProvider")
  return ctx
}
