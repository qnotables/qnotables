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
  const typeLabel =
    ad.type === "sponsor" ? "SPONSOR" : ad.type === "partner" ? "PARTNER" : "PROMOTED"

  return (
    <div className={`border border-border bg-card p-4 sm:p-6 ${className}`}>
      <div className="label-mono mb-2 text-xs text-muted-foreground">{typeLabel}</div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:gap-6">
        {ad.imageUrl && (
          <div className="h-32 w-full sm:h-40 sm:w-40 flex-shrink-0">
            <img
              src={ad.imageUrl}
              alt={ad.title}
              className="h-full w-full object-cover rounded border border-border"
            />
          </div>
        )}

        <div className="flex-1">
          <h3 className="stencil text-lg text-foreground">{ad.title}</h3>
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{ad.description}</p>

          <Link
            href={ad.buttonLink}
            className="label-mono mt-4 inline-block bg-primary px-6 py-2 font-semibold text-primary-foreground transition-opacity hover:opacity-90"
          >
            {ad.buttonText}
          </Link>
        </div>
      </div>
    </div>
  )
}
