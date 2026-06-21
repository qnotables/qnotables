'use client'

import { useEffect, useState, useCallback } from 'react'
import Image from 'next/image'
import { X, ZoomIn, Play, ChevronLeft, ChevronRight } from 'lucide-react'
import type { GalleryImage } from '@/app/actions/gallery-actions'

interface LightboxProps {
  images: GalleryImage[]
  index: number
  onClose: () => void
  onPrev: () => void
  onNext: () => void
}

function Lightbox({ images, index, onClose, onPrev, onNext }: LightboxProps) {
  const item = images[index]
  const isVideo = item.file_type?.startsWith('video/')

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={item.title}
    >
      {/* Close */}
      <button
        onClick={onClose}
        className="absolute right-4 top-4 z-10 rounded border border-white/20 bg-black/60 p-2 text-white hover:bg-black/90"
        aria-label="Close"
      >
        <X className="h-5 w-5" />
      </button>

      {/* Prev */}
      {images.length > 1 && (
        <button
          onClick={(e) => { e.stopPropagation(); onPrev() }}
          className="absolute left-4 top-1/2 z-10 -translate-y-1/2 rounded border border-white/20 bg-black/60 p-2 text-white hover:bg-black/90"
          aria-label="Previous"
        >
          <ChevronLeft className="h-6 w-6" />
        </button>
      )}

      {/* Media */}
      <div
        className="relative max-h-[90vh] max-w-[90vw]"
        onClick={(e) => e.stopPropagation()}
      >
        {isVideo ? (
          <video
            src={item.image_url}
            className="max-h-[85vh] max-w-[90vw] shadow-2xl"
            controls
            autoPlay
            playsInline
          />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.image_url}
            alt={item.alt_text}
            className="max-h-[85vh] max-w-[90vw] object-contain shadow-2xl"
          />
        )}
        {item.title && (
          <div className="mt-2 text-center font-mono text-sm text-white/70">
            {item.title}
            <span className="ml-3 text-white/40">{index + 1} / {images.length}</span>
          </div>
        )}
      </div>

      {/* Next */}
      {images.length > 1 && (
        <button
          onClick={(e) => { e.stopPropagation(); onNext() }}
          className="absolute right-4 top-1/2 z-10 -translate-y-1/2 rounded border border-white/20 bg-black/60 p-2 text-white hover:bg-black/90"
          aria-label="Next"
        >
          <ChevronRight className="h-6 w-6" />
        </button>
      )}
    </div>
  )
}

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

  return (
    <div className="w-full">
      {/* Full-width thumbnail grid */}
      <div className="grid auto-cols-fr grid-flow-col gap-1.5 overflow-x-auto">
        {images.map((img, i) => {
          const isVideo = img.file_type?.startsWith('video/')
          const isActive = i === currentIndex
          return (
            <button
              key={img.id}
              onClick={() => openLightbox(i)}
              onMouseEnter={() => { setCurrentIndex(i); setIsAutoPlay(false) }}
              onMouseLeave={() => setIsAutoPlay(true)}
              className={`group relative h-[160px] min-w-[120px] overflow-hidden border bg-black transition-opacity ${
                isActive ? 'border-primary opacity-100' : 'border-border opacity-70 hover:opacity-100'
              }`}
              aria-label={`${isVideo ? 'Play' : 'View'} ${img.title}`}
            >
              {isVideo ? (
                <>
                  <video
                    src={img.image_url}
                    className="h-full w-full object-cover"
                    muted
                    playsInline
                    preload="metadata"
                  />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                    <Play className={`fill-white text-white drop-shadow ${isActive ? 'h-8 w-8' : 'h-6 w-6'}`} />
                  </div>
                </>
              ) : (
                <>
                  <Image
                    src={img.image_url}
                    alt={img.alt_text}
                    fill
                    className="object-cover transition-transform duration-200 group-hover:scale-105"
                    sizes="(max-width: 768px) 33vw, 160px"
                    priority={i < 6}
                  />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors group-hover:bg-black/20">
                    <ZoomIn className="h-5 w-5 text-white opacity-0 transition-opacity group-hover:opacity-100" />
                  </div>
                </>
              )}
              {isActive && (
                <div className="absolute bottom-1 left-1 rounded bg-black/60 px-1.5 py-0.5 text-xs font-mono text-white">
                  {i + 1}/{images.length}
                </div>
              )}
            </button>
          )
        })}
      </div>

      {/* Lightbox overlay */}
      {lightboxIndex !== null && (
        <Lightbox
          images={images}
          index={lightboxIndex}
          onClose={closeLightbox}
          onPrev={lightboxPrev}
          onNext={lightboxNext}
        />
      )}
    </div>
  )
}
