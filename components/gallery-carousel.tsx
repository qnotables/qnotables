'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import type { GalleryImage } from '@/app/actions/gallery-actions'

interface GalleryCarouselProps {
  images: GalleryImage[]
}

export function GalleryCarousel({ images }: GalleryCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isAutoPlay, setIsAutoPlay] = useState(true)

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

      {/* Main image card */}
      <div
        className="relative h-[160px] w-[160px] shrink-0 overflow-hidden border border-border bg-black"
        onMouseEnter={() => setIsAutoPlay(false)}
        onMouseLeave={() => setIsAutoPlay(true)}
      >
        <Image
          src={currentImage.image_url}
          alt={currentImage.alt_text}
          fill
          className="object-cover"
          sizes="160px"
          priority
        />

        {/* Image counter */}
        {images.length > 1 && (
          <div className="absolute right-1 top-1 rounded bg-black/60 px-1.5 py-0.5 text-xs font-mono text-white">
            {currentIndex + 1}/{images.length}
          </div>
        )}
      </div>

      {/* Thumbnail strip — show up to 4 adjacent thumbnails */}
      <div className="flex flex-1 gap-2 overflow-hidden">
        {images
          .slice(currentIndex + 1, currentIndex + 5)
          .map((img, i) => (
            <button
              key={img.id}
              onClick={() => {
                setCurrentIndex(currentIndex + 1 + i)
                setIsAutoPlay(false)
              }}
              className="relative h-[160px] w-[160px] shrink-0 overflow-hidden border border-border bg-black opacity-60 transition-opacity hover:opacity-100"
              aria-label={`View ${img.title}`}
            >
              <Image
                src={img.image_url}
                alt={img.alt_text}
                fill
                className="object-cover"
                sizes="160px"
              />
            </button>
          ))}
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
    </div>
  )
}
