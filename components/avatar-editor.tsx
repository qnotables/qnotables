"use client"

import { useRef, useState } from "react"
import Image from "next/image"
import { Camera, Loader2, UserRound, X } from "lucide-react"

interface AvatarEditorProps {
  initialUrl: string | null
  displayName: string
}

export function AvatarEditor({ initialUrl, displayName }: AvatarEditorProps) {
  const [url, setUrl] = useState<string | null>(initialUrl)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setError(null)
    setPending(true)

    const formData = new FormData()
    formData.append("file", file)

    try {
      const res = await fetch("/api/profile/avatar", {
        method: "POST",
        body: formData,
      })
      const json = await res.json()
      if (!res.ok) {
        setError(json.error ?? "Upload failed")
      } else {
        // Bust the browser cache by appending a timestamp
        setUrl(`${json.url}?t=${Date.now()}`)
      }
    } catch {
      setError("Upload failed — please try again")
    } finally {
      setPending(false)
      // Reset input so the same file can be re-selected
      if (inputRef.current) inputRef.current.value = ""
    }
  }

  return (
    <div className="group relative">
      {/* Avatar display */}
      <div className="relative flex h-14 w-14 items-center justify-center overflow-hidden border border-border bg-secondary text-secondary-foreground">
        {url ? (
          <Image
            src={url}
            alt={`${displayName} avatar`}
            fill
            className="object-cover"
            sizes="56px"
            unoptimized
          />
        ) : (
          <UserRound className="h-7 w-7" />
        )}

        {/* Hover overlay — click to upload */}
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={pending}
          aria-label="Change profile image"
          className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 transition-opacity group-hover:opacity-100 disabled:cursor-wait"
        >
          {pending ? (
            <Loader2 className="h-5 w-5 animate-spin text-white" />
          ) : (
            <Camera className="h-5 w-5 text-white" />
          )}
        </button>
      </div>

      {/* Hidden file input */}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="sr-only"
        onChange={handleFile}
        aria-hidden="true"
      />

      {/* Error message */}
      {error && (
        <div className="absolute left-0 top-full mt-1 flex w-max max-w-xs items-start gap-1 bg-destructive/10 px-2 py-1 text-xs text-destructive">
          <X className="mt-0.5 h-3 w-3 shrink-0" />
          {error}
        </div>
      )}
    </div>
  )
}
