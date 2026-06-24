'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import Image from 'next/image'
import { X, ZoomIn, Play, ChevronLeft, ChevronRight } from 'lucide-react'
import type { GalleryImage } from '@/app/actions/gallery-actions'

const PAGE_SIZE = 7

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
  const [page, setPage] = useState(0)
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)

  const totalPages = useMemo(() => Math.ceil(images.length / PAGE_SIZE), [images.length])

  const pageImages = useMemo(
    () => images.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE),
    [images, page]
  )

  const openLightbox = (globalIndex: number) => setLightboxIndex(globalIndex)
  const closeLightbox = () => setLightboxIndex(null)

  const lightboxPrev = useCallback(() => {
    setLightboxIndex((prev) => (prev === null ? null : (prev - 1 + images.length) % images.length))
  }, [images.length])

  const lightboxNext = useCallback(() => {
    setLightboxIndex((prev) => (prev === null ? null : (prev + 1) % images.length))
  }, [images.length])

  const prevPage = () => setPage((p) => Math.max(0, p - 1))
  const nextPage = () => setPage((p) => Math.min(totalPages - 1, p + 1))

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

  if (!images.length) {
    return (
      <div className="flex h-48 items-center justify-center border-2 border-dashed border-border bg-muted">
        <p className="text-sm text-muted-foreground">No gallery images yet. Upload one to get started!</p>
      </div>
    )
  }

  return (
    <div className="w-full space-y-3">
      {/* 7-image grid with prev/next arrows */}
      <div className="relative flex items-center gap-1.5">
        {/* Prev arrow */}
        <button
          onClick={prevPage}
          disabled={page === 0}
          className="flex-shrink-0 rounded border border-border bg-card p-1.5 text-muted-foreground transition-colors hover:border-primary hover:text-primary disabled:pointer-events-none disabled:opacity-30"
          aria-label="Previous page"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        {/* Thumbnail strip — always 7 slots */}
        <div className="grid flex-1 gap-1" style={{ gridTemplateColumns: `repeat(${PAGE_SIZE}, minmax(0, 1fr))` }}>
          {Array.from({ length: PAGE_SIZE }).map((_, slotIdx) => {
            const img = pageImages[slotIdx]
            const globalIndex = page * PAGE_SIZE + slotIdx

            if (!img) {
              // Empty slot filler
              return (
                <div
                  key={`empty-${slotIdx}`}
                  className="relative h-[130px] border border-dashed border-border bg-muted/30"
                />
              )
            }

            const isVideo = img.file_type?.startsWith('video/')
            return (
              <button
                key={img.id}
                onClick={() => openLightbox(globalIndex)}
                className="group relative h-[130px] overflow-hidden border border-border bg-black transition-all hover:border-primary hover:opacity-100"
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
                      <Play className="h-6 w-6 fill-white text-white drop-shadow" />
                    </div>
                  </>
                ) : (
                  <>
                    <Image
                      src={img.image_url}
                      alt={img.alt_text}
                      fill
                      className="object-cover transition-transform duration-200 group-hover:scale-105"
                      sizes="14vw"
                      priority={globalIndex < PAGE_SIZE}
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors group-hover:bg-black/20">
                      <ZoomIn className="h-4 w-4 text-white opacity-0 transition-opacity group-hover:opacity-100" />
                    </div>
                  </>
                )}
              </button>
            )
          })}
        </div>

        {/* Next arrow */}
        <button
          onClick={nextPage}
          disabled={page >= totalPages - 1}
          className="flex-shrink-0 rounded border border-border bg-card p-1.5 text-muted-foreground transition-colors hover:border-primary hover:text-primary disabled:pointer-events-none disabled:opacity-30"
          aria-label="Next page"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {/* Pagination dots + counter */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3">
          {/* Prev arrow (mirrored below strip) */}
          <button
            onClick={prevPage}
            disabled={page === 0}
            className="text-muted-foreground transition-colors hover:text-primary disabled:pointer-events-none disabled:opacity-30"
            aria-label="Previous page"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </button>

          {/* Dot slider */}
          <div className="flex items-center gap-1.5" role="tablist" aria-label="Carousel pages">
            {Array.from({ length: totalPages }).map((_, i) => (
              <button
                key={i}
                role="tab"
                aria-selected={i === page}
                aria-label={`Page ${i + 1}`}
                onClick={() => setPage(i)}
                className={`rounded-full transition-all duration-200 ${
                  i === page
                    ? 'h-2 w-6 bg-primary'
                    : 'h-1.5 w-1.5 bg-muted-foreground/40 hover:bg-muted-foreground'
                }`}
              />
            ))}
          </div>

          {/* Next arrow */}
          <button
            onClick={nextPage}
            disabled={page >= totalPages - 1}
            className="text-muted-foreground transition-colors hover:text-primary disabled:pointer-events-none disabled:opacity-30"
            aria-label="Next page"
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Image counter */}
      <p className="text-center font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
        {page * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE + PAGE_SIZE, images.length)} of {images.length}
      </p>

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
