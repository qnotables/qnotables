import Image from "next/image"
import type { PostMedia } from "@/lib/post-media"

export function PostFeaturedMedia({ media, title, compact = false }: { media: PostMedia; title: string; compact?: boolean }) {
  const frameClass = compact ? "relative aspect-[16/7] w-full overflow-hidden bg-muted" : "relative aspect-video w-full overflow-hidden border border-border bg-muted"

  return (
    <div className={frameClass}>
      {media.kind === "image" ? (
        <Image src={media.src} alt={media.alt || title} fill className="object-cover object-top" sizes={compact ? "(max-width: 768px) 100vw, 50vw" : "(max-width: 1024px) 100vw, 1024px"} />
      ) : media.kind === "video" ? (
        <video src={media.src} poster={media.poster} controls playsInline preload="metadata" className="h-full w-full object-contain" title={media.title || title} />
      ) : (
        <iframe src={media.src} title={media.title || title} loading="lazy" referrerPolicy="no-referrer-when-downgrade" sandbox="allow-presentation allow-same-origin allow-scripts allow-forms" allowFullScreen className="absolute inset-0 h-full w-full border-0" />
      )}
    </div>
  )
}
