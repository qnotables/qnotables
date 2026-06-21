'use client'

import { useEffect, useState, useCallback } from 'react'
import Image from 'next/image'
import { ChevronLeft, ChevronRight, X, ZoomIn, Play } from 'lucide-react'
import type { GalleryImage } from '@/app/actions/gallery-actions'

interface GalleryCarouselProps {
  images: GalleryImage[]
}

export function GalleryCarousel({ images }: GalleryCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isAutoPlay, setIsAutoPlay] = useState(true)
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)

  const openLightbox = (index: number) => {
    setLightboxIndex(index)
    setIsAutoPlay(false)
  }

  const closeLightbox = () => setLightboxIndex(null)

  const lightboxPrev = useCallback(() => {
    setLightboxIndex((prev) => (prev === null ? null : (prev - 1 + images.length) % images.length))
  }, [images.length])

  const lightboxNext = useCallback(() => {
    setLightboxIndex((prev) => (prev === null ? null : (prev + 1) % images.length))
  }, [images.length])

  // Keyboard navigation for lightbox
  useEffect(() => {
    if (lightboxIndex === null) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeLightbox()
      if (e.key === 'ArrowLeft') lightboxPrev()
      if (e.key === 'ArrowRight') lightboxNext()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [lightboxIndex, lightboxPrev, lightboxNext])

  // Auto-rotate carousel every 5 seconds
  useEffect(() => {
    if (!isAutoPlay || images.length === 0) return

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % images.length)
    }, 5000)

    return () => clearInterval(interval)
  }, [isAutoPlay, images.length])

  if (!images.length) {
    return (
      <div className="flex h-96 items-center justify-center rounded-lg border-2 border-dashed border-border bg-muted">
        <p className="text-sm text-muted-foreground">No gallery images yet. Upload one to get started!</p>
      </div>
    )
  }

  const currentImage = images[currentIndex]

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length)
    setIsAutoPlay(false)
  }

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % images.length)
    setIsAutoPlay(false)
  }

  return (
    <div className="flex items-center gap-2">
      {/* Prev button */}
      {images.length > 1 && (
        <button
          onClick={goToPrevious}
          className="shrink-0 rounded border border-border bg-secondary p-1 hover:bg-muted"
          aria-label="Previous image"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
      )}

      {/* Main media card */}
      <button
        onClick={() => openLightbox(currentIndex)}
        className="group relative h-[160px] w-[160px] shrink-0 overflow-hidden border border-border bg-black"
        onMouseEnter={() => setIsAutoPlay(false)}
        onMouseLeave={() => setIsAutoPlay(true)}
        aria-label={`${currentImage.file_type?.startsWith('video/') ? 'Play' : 'View'} ${currentImage.title}`}
      >
        {currentImage.file_type?.startsWith('video/') ? (
          <>
            <video
              src={currentImage.image_url}
              className="h-full w-full object-cover"
              muted
              playsInline
              preload="metadata"
            />
            <div className="absolute inset-0 flex items-center justify-center bg-black/30">
              <Play className="h-8 w-8 fill-white text-white drop-shadow" />
            </div>
          </>
        ) : (
          <>
            <Image
              src={currentImage.image_url}
              alt={currentImage.alt_text}
              fill
              className="object-cover transition-transform duration-200 group-hover:scale-105"
              sizes="160px"
              priority
            />
            <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors group-hover:bg-black/30">
              <ZoomIn className="h-6 w-6 text-white opacity-0 transition-opacity group-hover:opacity-100" />
            </div>
          </>
        )}
        {/* Counter */}
        {images.length > 1 && (
          <div className="absolute right-1 top-1 rounded bg-black/60 px-1.5 py-0.5 text-xs font-mono text-white">
            {currentIndex + 1}/{images.length}
          </div>
        )}
      </button>

      {/* Thumbnail strip — show up to 4 adjacent thumbnails */}
      <div className="flex flex-1 gap-2 overflow-hidden">
        {images
          .slice(currentIndex + 1, currentIndex + 5)
          .map((img, i) => {
            const absoluteIndex = currentIndex + 1 + i
            return (
              <button
                key={img.id}
                onClick={() => openLightbox(absoluteIndex)}
                className="group relative h-[160px] w-[160px] shrink-0 overflow-hidden border border-border bg-black opacity-60 transition-opacity hover:opacity-100"
                aria-label={`${img.file_type?.startsWith('video/') ? 'Play' : 'View'} ${img.title}`}
              >
                {img.file_type?.startsWith('video/') ? (
                  <>
                    <video
                      src={img.image_url}
                      className="h-full w-full object-cover"
                      muted
                      playsInline
                      preload="metadata"
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                      <Play className="h-6 w-6 fill-white text-white drop-shadow" />
                    </div>
                  </>
                ) : (
                  <>
                    <Image
                      src={img.image_url}
                      alt={img.alt_text}
                      fill
                      className="object-cover"
                      sizes="160px"
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors group-hover:bg-black/30">
                      <ZoomIn className="h-5 w-5 text-white opacity-0 transition-opacity group-hover:opacity-100" />
                    </div>
                  </>
                )}
              </button>
            )
          })}
      </div>

      {/* Next button */}
      {images.length > 1 && (
        <button
          onClick={goToNext}
          className="shrink-0 rounded border border-border bg-secondary p-1 hover:bg-muted"
          aria-label="Next image"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      )}

      {/* Lightbox overlay */}
      {lightboxIndex !== null && (() => {
        const lb = images[lightboxIndex]
        return (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/90"
            onClick={closeLightbox}
            role="dialog"
            aria-modal="true"
            aria-label={lb.title}
          >
            {/* Close */}
            <button
              onClick={closeLightbox}
              className="absolute right-4 top-4 z-10 rounded border border-white/20 bg-black/60 p-2 text-white hover:bg-black/90"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Prev */}
            {images.length > 1 && (
              <button
                onClick={(e) => { e.stopPropagation(); lightboxPrev() }}
                className="absolute left-4 top-1/2 z-10 -translate-y-1/2 rounded border border-white/20 bg-black/60 p-2 text-white hover:bg-black/90"
                aria-label="Previous image"
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
            )}

            {/* Media */}
            <div
              className="relative max-h-[90vh] max-w-[90vw]"
              onClick={(e) => e.stopPropagation()}
            >
              {lb.file_type?.startsWith('video/') ? (
                <video
                  src={lb.image_url}
                  className="max-h-[85vh] max-w-[90vw] shadow-2xl"
                  controls
                  autoPlay
                  playsInline
                />
              ) : (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={lb.image_url}
                  alt={lb.alt_text}
                  className="max-h-[85vh] max-w-[90vw] object-contain shadow-2xl"
                />
              )}
              {/* Caption */}
              {lb.title && (
                <div className="mt-2 text-center font-mono text-sm text-white/70">
                  {lb.title}
                  <span className="ml-3 text-white/40">{lightboxIndex + 1} / {images.length}</span>
                </div>
              )}
            </div>

            {/* Next */}
            {images.length > 1 && (
              <button
                onClick={(e) => { e.stopPropagation(); lightboxNext() }}
                className="absolute right-4 top-1/2 z-10 -translate-y-1/2 rounded border border-white/20 bg-black/60 p-2 text-white hover:bg-black/90"
                aria-label="Next image"
              >
                <ChevronRight className="h-6 w-6" />
              </button>
            )}
          </div>
        )
      })()}
    </div>
  )
}
