"use client"

import { useState, useEffect, useCallback } from "react"
import { X, ExternalLink } from "lucide-react"

interface ForumImageProps {
  src: string
  alt: string
}

export function ForumImage({ src, alt }: ForumImageProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false)

  const openLightbox = useCallback(() => setLightboxOpen(true), [])
  const closeLightbox = useCallback(() => setLightboxOpen(false), [])

  // Close on Escape
  useEffect(() => {
    if (!lightboxOpen) return
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") closeLightbox()
    }
    document.addEventListener("keydown", onKey)
    // Prevent body scroll while lightbox is open
    document.body.style.overflow = "hidden"
    return () => {
      document.removeEventListener("keydown", onKey)
      document.body.style.overflow = ""
    }
  }, [lightboxOpen, closeLightbox])

  return (
    <>
      {/* Inline image */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        onClick={openLightbox}
        loading="lazy"
        className="my-2 block w-full max-h-[700px] cursor-zoom-in rounded border border-border bg-muted/30 object-contain transition-opacity hover:opacity-90"
        title="Click to enlarge"
      />

      {/* Lightbox */}
      {lightboxOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={alt || "Image"}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm"
          onClick={closeLightbox}
        >
          {/* Controls */}
          <div className="absolute right-4 top-4 flex items-center gap-2">
            <a
              href={src}
              target="_blank"
              rel="noopener noreferrer nofollow"
              onClick={(e) => e.stopPropagation()}
              className="flex h-9 w-9 items-center justify-center border border-white/20 bg-black/60 text-white/80 transition-colors hover:bg-white/10 hover:text-white"
              title="Open full image in new tab"
              aria-label="Open full image in new tab"
            >
              <ExternalLink className="h-4 w-4" />
            </a>
            <button
              type="button"
              onClick={closeLightbox}
              className="flex h-9 w-9 items-center justify-center border border-white/20 bg-black/60 text-white/80 transition-colors hover:bg-white/10 hover:text-white"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Image container — click on image itself should NOT close */}
          <div
            className="relative max-h-[90vh] max-w-[90vw]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={src}
              alt={alt}
              className="block max-h-[90vh] max-w-[90vw] border border-white/10 object-contain shadow-2xl"
              draggable={false}
            />
            {alt && (
              <p className="label-mono mt-2 text-center text-xs text-white/60">{alt}</p>
            )}
          </div>
        </div>
      )}
    </>
  )
}
