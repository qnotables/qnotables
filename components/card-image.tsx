interface CardImageProps {
  src?: string
  alt: string
  variant?: "cover" | "contain"
  mediaType?: string
  aspectRatio?: "video" | "square" | "auto"
  objectPosition?: "center" | "top" | "bottom"
  className?: string
  onLoad?: () => void
}

/**
 * CardImage component for consistent image rendering in cards
 * 
 * - "cover" variant: crops image to fit (for photos)
 * - "contain" variant: shrinks image to fit without cropping (for graphs/charts)
 * - Automatically detects graph/chart types and uses contain
 * - Includes dark background for transparent images
 * - Lazy loaded for performance
 */
export function CardImage({
  src,
  alt,
  variant = "cover",
  mediaType,
  aspectRatio = "video",
  objectPosition = "center",
  className = "",
  onLoad,
}: CardImageProps) {
  // Determine final variant based on media type
  const isGraphicType = mediaType && ["graph", "chart", "infographic", "document_image"].includes(mediaType)
  const finalVariant = isGraphicType ? "contain" : variant

  // Determine aspect ratio class
  const aspectClass =
    aspectRatio === "square"
      ? "aspect-square"
      : aspectRatio === "auto"
        ? ""
        : "aspect-video"

  // Determine object-fit class
  const objectFitClass = finalVariant === "contain" ? "object-contain" : "object-cover"

  // Determine object-position class
  const objectPositionClass = 
    objectPosition === "top" ? "object-top" : 
    objectPosition === "bottom" ? "object-bottom" : 
    "object-center"

  return (
    <div
      className={`relative w-full overflow-hidden bg-muted ${aspectClass} ${className}`}
    >
      <img
        src={src || "/placeholder.svg"}
        alt={alt}
        loading="lazy"
        onLoad={onLoad}
        className={`h-full w-full ${objectFitClass} ${objectPositionClass}`}
      />
    </div>
  )
}
