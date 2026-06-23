"use client"

import { useEffect, useRef, useState } from "react"
import { Music, Trash2, Upload, Play, Pause, CheckCircle } from "lucide-react"

interface AudioTrack {
  url: string
  title: string
  pathname: string
  size: number
  uploadedAt: string
}

export default function AudioManagerPage() {
  const [tracks, setTracks] = useState<AudioTrack[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [uploadSuccess, setUploadSuccess] = useState(false)
  const [deletingUrl, setDeletingUrl] = useState<string | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  async function fetchTracks() {
    setLoading(true)
    try {
      const res = await fetch("/api/audio")
      const data = await res.json()
      setTracks(data.tracks || [])
    } catch {
      setTracks([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchTracks() }, [])

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    setUploadError(null)
    setUploadSuccess(false)

    try {
      const form = new FormData()
      form.append("file", file)
      form.append("folder", "audio")
      const res = await fetch("/api/dashboard/upload", { method: "POST", body: form })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Upload failed")
      setUploadSuccess(true)
      await fetchTracks()
      setTimeout(() => setUploadSuccess(false), 3000)
    } catch (err: any) {
      setUploadError(err.message)
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ""
    }
  }

  async function handleDelete(track: AudioTrack) {
    if (!confirm(`Delete "${track.title}"?`)) return
    setDeletingUrl(track.url)
    try {
      await fetch("/api/audio", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: track.url }),
      })
      if (previewUrl === track.url) {
        audioRef.current?.pause()
        setPreviewUrl(null)
      }
      await fetchTracks()
    } finally {
      setDeletingUrl(null)
    }
  }

  function togglePreview(url: string) {
    if (previewUrl === url) {
      audioRef.current?.pause()
      setPreviewUrl(null)
    } else {
      if (audioRef.current) audioRef.current.pause()
      const audio = new Audio(url)
      audio.play()
      audio.onended = () => setPreviewUrl(null)
      audioRef.current = audio
      setPreviewUrl(url)
    }
  }

  function formatBytes(bytes: number) {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`
  }

  return (
    <div className="flex flex-col gap-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="h-2 w-2 bg-primary" aria-hidden="true" />
            <span className="label-mono text-xs text-primary">CONTROL ROOM</span>
          </div>
          <h1 className="stencil text-3xl text-foreground">Audio Manager</h1>
          <p className="label-mono text-sm text-muted-foreground mt-1">
            Upload .mp3 files to populate the header music player.
          </p>
        </div>

        {/* Upload button */}
        <div className="flex flex-col items-end gap-2">
          <label className={`flex items-center gap-2 border px-4 py-2 label-mono text-xs font-bold cursor-pointer transition-colors ${
            uploading
              ? "border-border text-muted-foreground cursor-not-allowed"
              : "border-primary text-primary hover:bg-primary hover:text-primary-foreground"
          }`}>
            {uploadSuccess ? (
              <><CheckCircle className="h-3.5 w-3.5" /> UPLOADED</>
            ) : uploading ? (
              <><span className="h-3 w-3 border border-primary border-t-transparent rounded-full animate-spin" /> UPLOADING...</>
            ) : (
              <><Upload className="h-3.5 w-3.5" /> UPLOAD MP3</>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="audio/*,.mp3"
              className="sr-only"
              disabled={uploading}
              onChange={handleUpload}
            />
          </label>
          {uploadError && (
            <p className="label-mono text-xs text-destructive">{uploadError}</p>
          )}
        </div>
      </div>

      {/* Track list */}
      <div className="border border-border bg-card">
        <div className="flex items-center gap-2 border-b border-border bg-muted/60 px-4 py-2.5">
          <Music className="h-3.5 w-3.5 text-primary" />
          <span className="label-mono text-xs font-bold text-primary">PLAYLIST</span>
          <span className="label-mono text-xs text-muted-foreground ml-1">— {tracks.length} TRACK{tracks.length !== 1 ? "S" : ""}</span>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <span className="label-mono text-xs text-muted-foreground animate-pulse">LOADING...</span>
          </div>
        ) : tracks.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-16">
            <Music className="h-8 w-8 text-muted-foreground/40" />
            <p className="label-mono text-xs text-muted-foreground">NO TRACKS — UPLOAD AN MP3 TO BEGIN</p>
          </div>
        ) : (
          <ul>
            {tracks.map((track, i) => (
              <li
                key={track.url}
                className={`flex items-center gap-4 px-4 py-3 border-b border-border last:border-b-0 ${
                  previewUrl === track.url ? "bg-primary/5" : "hover:bg-muted/30"
                } transition-colors`}
              >
                {/* Index */}
                <span className="label-mono text-xs text-muted-foreground w-5 text-right flex-shrink-0">{i + 1}</span>

                {/* Preview toggle */}
                <button
                  onClick={() => togglePreview(track.url)}
                  aria-label={previewUrl === track.url ? "Pause" : "Preview"}
                  className="flex h-7 w-7 flex-shrink-0 items-center justify-center border border-border text-muted-foreground hover:border-primary hover:text-primary transition-colors"
                >
                  {previewUrl === track.url
                    ? <Pause className="h-3 w-3" />
                    : <Play className="h-3 w-3" />
                  }
                </button>

                {/* Info */}
                <div className="flex flex-col flex-1 min-w-0">
                  <span className="label-mono text-xs font-semibold text-foreground truncate">{track.title}</span>
                  <span className="label-mono text-[10px] text-muted-foreground truncate">{track.pathname}</span>
                </div>

                {/* Size */}
                <span className="label-mono text-xs text-muted-foreground flex-shrink-0 hidden sm:block">
                  {formatBytes(track.size)}
                </span>

                {/* Delete */}
                <button
                  onClick={() => handleDelete(track)}
                  disabled={deletingUrl === track.url}
                  aria-label="Delete track"
                  className="flex-shrink-0 p-1.5 text-muted-foreground hover:text-destructive transition-colors disabled:opacity-40"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Tip */}
      <p className="label-mono text-xs text-muted-foreground">
        Uploaded tracks are automatically available in the header music player. Accepted formats: .mp3, .wav, .ogg, .m4a — max 50 MB per file.
      </p>
    </div>
  )
}
