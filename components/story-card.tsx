import { ArrowUpRight, Clock, FileText } from "lucide-react"
import { type Story, formatAgo } from "@/lib/news-data"
import { PriorityTag } from "@/components/priority-tag"
import { ShareButtons } from "@/components/share-buttons"
import { CardImage } from "@/components/card-image"

export function StoryCard({ story, variant = "default" }: { story: Story; variant?: "default" | "wide" }) {
  const s = story
  const href = s.url || "#"
  const linkProps = s.url ? { target: "_blank", rel: "noopener noreferrer" } : {}
  return (
    <article className="group flex h-full flex-col border border-border bg-card transition-colors hover:border-primary/60">
      {s.image && (
        <div className="relative aspect-[16/9] w-full overflow-hidden">
          <CardImage
            src={s.image}
            alt={s.headline}
            variant="cover"
            aspectRatio="video"
            className="opacity-90 grayscale-[35%] transition duration-500 group-hover:scale-[1.03] group-hover:grayscale-0"
          />
          <div className="absolute left-0 top-0 flex items-center gap-2 p-2">
            <PriorityTag level={s.priority} />
          </div>
        </div>
      )}

      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-center gap-2">
          <span className="label-mono text-primary">{s.category}</span>
          {!s.image && <PriorityTag level={s.priority} />}
        </div>

        <a href={href} {...linkProps} className="mt-2 block flex-1">
          <h3
            className={`stencil text-balance leading-[1.02] text-foreground transition-colors group-hover:text-primary ${
              variant === "wide" ? "text-2xl md:text-3xl" : "text-xl"
            }`}
          >
            {s.headline}
          </h3>
          <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-muted-foreground">
            {s.summary}
          </p>
        </a>

        <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-border pt-3">
          <span className="label-mono text-foreground">{s.source}</span>
          <span className="label-mono flex items-center gap-1.5 text-muted-foreground">
            <Clock className="h-3 w-3" /> {formatAgo(s.minutesAgo)}
          </span>
          <span className="label-mono flex items-center gap-1.5 text-muted-foreground">
            <FileText className="h-3 w-3" /> {s.reports}
          </span>
          <div className="ml-auto flex items-center gap-3">
            <ShareButtons headline={s.headline} url={s.url} source={s.source} />
            <ArrowUpRight className="h-4 w-4 text-muted-foreground transition-colors group-hover:text-primary" />
          </div>
        </div>
      </div>
    </article>
  )
}
