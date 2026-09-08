"use client"

import { createContext, useContext, useEffect, useRef, useState, ReactNode } from "react"
import { usePathname } from "next/navigation"

interface Track {
  title: string
  src: string
}

interface PersistedPlayerState {
  trackSrc?: string
  trackIdx?: number
  currentTime?: number
  playing?: boolean
  muted?: boolean
  volume?: number
}

const PLAYER_STORAGE_KEY = "qnotables-music-player"

interface MusicPlayerContextType {
  tracks: Track[]
  trackIdx: number
  playing: boolean
  muted: boolean
  volume: number
  progress: number
  setPlaying: (playing: boolean) => void
  setVolume: (volume: number) => void
  setTrackIdx: (idx: number | ((i: number) => number)) => void
  setMuted: (muted: boolean) => void
  prev: () => void
  next: () => void
  togglePlay: () => void
  seek: (ratio: number) => void
}

const MusicPlayerContext = createContext<MusicPlayerContextType | null>(null)

export function MusicPlayerProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const savedStateRef = useRef<PersistedPlayerState | null>(null)
  const restoredPositionRef = useRef(false)
  const [tracks, setTracks] = useState<Track[]>([])
  const [trackIdx, setTrackIdx] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [muted, setMuted] = useState(false)
  const [volume, setVolume] = useState(1)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    try {
      const saved = JSON.parse(window.localStorage.getItem(PLAYER_STORAGE_KEY) || "null") as PersistedPlayerState | null
      if (saved) {
        savedStateRef.current = saved
        if (typeof saved.volume === "number" && saved.volume >= 0 && saved.volume <= 1) setVolume(saved.volume)
        if (typeof saved.muted === "boolean") setMuted(saved.muted)
        if (typeof saved.playing === "boolean") setPlaying(saved.playing)
      }
    } catch {
      savedStateRef.current = null
    }
  }, [])

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
        const saved = savedStateRef.current
        const savedIndex = saved?.trackSrc ? fetched.findIndex((item) => item.src === saved.trackSrc) : -1
        if (savedIndex >= 0) setTrackIdx(savedIndex)
        else if (typeof saved?.trackIdx === "number" && saved.trackIdx >= 0 && saved.trackIdx < fetched.length) setTrackIdx(saved.trackIdx)
        setTracks(fetched)
      })
      .catch(() => setTracks([]))
  }, [])

  const track = tracks[trackIdx]

  function persistState(overrides: Partial<PersistedPlayerState> = {}) {
    if (!track && tracks.length === 0) return
    try {
      window.localStorage.setItem(
        PLAYER_STORAGE_KEY,
        JSON.stringify({
          trackSrc: track?.src,
          trackIdx,
          currentTime: audioRef.current?.currentTime ?? 0,
          playing,
          muted,
          volume,
          ...overrides,
        }),
      )
    } catch {
      // Storage can be unavailable in private browsing or restricted contexts.
    }
  }

  // Rebuild audio element whenever the track changes
  useEffect(() => {
    if (!track) return

    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.src = ""
    }

    const audio = new Audio(track.src)
    audio.preload = "metadata"
    audio.volume = volume
    audio.muted = muted

    const handleLoadedMetadata = () => {
      const saved = savedStateRef.current
      if (!restoredPositionRef.current && saved?.trackSrc === track.src && typeof saved.currentTime === "number") {
        audio.currentTime = Math.min(Math.max(saved.currentTime, 0), Math.max(audio.duration - 0.25, 0))
        restoredPositionRef.current = true
        setProgress(audio.duration ? (audio.currentTime / audio.duration) * 100 : 0)
      }
    }

    const handleTimeUpdate = () => {
      if (audio.duration) {
        setProgress((audio.currentTime / audio.duration) * 100)
        persistState({ currentTime: audio.currentTime })
      }
    }

    const handleEnded = () => {
      setProgress(0)
      restoredPositionRef.current = false
      setTrackIdx((i) => (i + 1) % tracks.length)
    }

    audio.addEventListener("loadedmetadata", handleLoadedMetadata)
    audio.addEventListener("timeupdate", handleTimeUpdate)
    audio.addEventListener("ended", handleEnded)

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
    persistState({ muted })
  }, [muted])

  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume
    persistState({ volume })
  }, [volume])

  useEffect(() => {
    persistState({ playing })
  }, [playing, trackIdx, tracks])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return
    if (playing) {
      audio.play().catch(() => setPlaying(false))
    } else {
      audio.pause()
    }
  }, [playing])

  // The provider stays mounted across App Router navigation. Re-assert playback
  // after a page switch without recreating the audio element or losing position.
  useEffect(() => {
    if (!playing) return
    const audio = audioRef.current
    if (!audio || !audio.paused) return
    audio.play().catch(() => {
      // Browsers may block autoplay after a hard reload; keep the intent persisted.
    })
  }, [pathname, playing])

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
        volume,
        progress,
        setPlaying,
        setVolume,
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
