"use client"

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
}

export function AdBanner({ ad, className = "" }: { ad: Ad; className?: string }) {
  // Site-facing ads display only the image
  if (!ad.imageUrl) return null

  return (
    <Link
      href={ad.buttonLink}
      className={`block border border-border overflow-hidden hover:opacity-90 transition-opacity ${className}`}
    >
      <img
        src={ad.imageUrl}
        alt={ad.title}
        className="w-full h-auto object-cover max-h-[100px]"
      />
    </Link>
  )
}
