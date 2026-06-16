"use client"

import { useState, useEffect } from "react"
import Link from "next/link"

interface Ad {
  id: string
  title: string
  description: string
  imageUrl: string | null
  buttonText: string
  buttonLink: string
  type: "internal" | "sponsor" | "partner"
  placement: "top" | "sidebar" | "in-feed" | "bottom"
  priority: number
}

interface AdCarouselProps {
  ads: Ad[]
  className?: string
  interval?: number // interval in milliseconds, default 10000ms (10 seconds)
}

export function AdCarousel({ ads, className = "", interval = 10000 }: AdCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted || ads.length <= 1) return

    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % ads.length)
    }, interval)

    return () => clearInterval(timer)
  }, [mounted, ads.length, interval])

  if (!mounted || ads.length === 0 || !ads[currentIndex]?.imageUrl) return null

  const currentAd = ads[currentIndex]

  return (
    <div className={`relative ${className}`}>
      <Link
        href={currentAd.buttonLink}
        className="block border border-border overflow-hidden hover:opacity-90 transition-opacity"
      >
        <img
          src={currentAd.imageUrl}
          alt={currentAd.title}
          className="w-full h-[150px] object-scale-down"
        />
      </Link>

      {/* Carousel indicators */}
      {ads.length > 1 && (
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
          {ads.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`h-1.5 w-1.5 rounded-full transition-colors ${
                index === currentIndex ? "bg-primary" : "bg-muted-foreground/30"
              }`}
              aria-label={`Go to ad ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  )
}
