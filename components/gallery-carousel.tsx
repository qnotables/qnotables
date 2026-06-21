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
    <div
      className="relative aspect-video w-full overflow-hidden rounded-lg border border-border bg-black"
      onMouseEnter={() => setIsAutoPlay(false)}
      onMouseLeave={() => setIsAutoPlay(true)}
    >
      {/* Main image */}
      <Image
        src={currentImage.image_url}
        alt={currentImage.alt_text}
        fill
        className="object-contain"
        priority
      />

      {/* Title overlay */}
      {currentImage.title && (
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent px-4 py-4">
          <h3 className="text-lg font-semibold text-white">{currentImage.title}</h3>
          {currentImage.description && (
            <p className="text-sm text-gray-300">{currentImage.description}</p>
          )}
        </div>
      )}

      {/* Navigation buttons */}
      {images.length > 1 && (
        <>
          <button
            onClick={goToPrevious}
            className="absolute left-2 top-1/2 z-10 -translate-y-1/2 rounded-full bg-black/50 p-2 hover:bg-black/75"
            aria-label="Previous image"
          >
            <ChevronLeft className="h-5 w-5 text-white" />
          </button>
          <button
            onClick={goToNext}
            className="absolute right-2 top-1/2 z-10 -translate-y-1/2 rounded-full bg-black/50 p-2 hover:bg-black/75"
            aria-label="Next image"
          >
            <ChevronRight className="h-5 w-5 text-white" />
          </button>
        </>
      )}

      {/* Dot indicators */}
      {images.length > 1 && (
        <div className="absolute bottom-2 left-1/2 flex -translate-x-1/2 gap-2">
          {images.map((_, idx) => (
            <button
              key={idx}
              onClick={() => {
                setCurrentIndex(idx)
                setIsAutoPlay(false)
              }}
              className={`h-2 w-2 rounded-full transition-all ${
                idx === currentIndex ? 'bg-white' : 'bg-white/50'
              }`}
              aria-label={`Go to image ${idx + 1}`}
            />
          ))}
        </div>
      )}

      {/* Image counter */}
      {images.length > 1 && (
        <div className="absolute right-4 top-4 rounded bg-black/60 px-3 py-1 text-sm font-mono text-white">
          {currentIndex + 1} / {images.length}
        </div>
      )}
    </div>
  )
}
