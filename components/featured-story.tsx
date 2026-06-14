import { ArrowUpRight, Clock, FileText } from "lucide-react"
import { type Story, formatAgo } from "@/lib/news-data"
import { PriorityTag } from "@/components/priority-tag"
import { ShareButtons } from "@/components/share-buttons"

export function FeaturedStory({ story }: { story: Story }) {
  const s = story
  const href = s.url || "#"
  const external = Boolean(s.url)
  const linkProps = external ? { target: "_blank", rel: "noopener noreferrer" } : {}
  return (
    <article className="corner-frame group relative overflow-hidden border border-border bg-card">
      <div className="relative aspect-[16/10] w-full overflow-hidden md:aspect-[16/9]">
        <img
          src={s.image || "/placeholder.svg"}
          alt=""
          className="h-full w-full object-cover opacity-90 grayscale-[35%] transition duration-500 group-hover:scale-[1.02] group-hover:grayscale-0"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-card via-card/40 to-transparent" />
        <div className="absolute left-0 top-0 flex items-center gap-2 p-3">
          <PriorityTag level={s.priority} />
          <span className="label-mono bg-background/80 px-2 py-1 text-foreground backdrop-blur">
            {s.category}
          </span>
        </div>
      </div>

      <div className="relative -mt-16 p-4 md:-mt-24 md:p-6">
        <a href={href} {...linkProps} className="block">
          <h2 className="stencil text-balance text-3xl leading-[0.98] text-foreground transition-colors group-hover:text-primary md:text-5xl">
            {s.headline}
          </h2>
        </a>
        <p className="mt-3 max-w-2xl text-pretty text-sm leading-relaxed text-muted-foreground md:text-base">
          {s.summary}
        </p>

        <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-border pt-3">
          <span className="label-mono text-primary">{s.source}</span>
          <span className="label-mono flex items-center gap-1.5 text-muted-foreground">
            <Clock className="h-3.5 w-3.5" /> {formatAgo(s.minutesAgo)}
          </span>
          <span className="label-mono flex items-center gap-1.5 text-muted-foreground">
            <FileText className="h-3.5 w-3.5" /> {s.reports} REPORTS
          </span>
          <div className="ml-auto flex items-center gap-4">
            <ShareButtons headline={s.headline} url={s.url} source={s.source} />
            <a
              href={href}
              {...linkProps}
              className="label-mono flex items-center gap-1 text-foreground transition-colors hover:text-primary"
            >
              FULL BRIEF <ArrowUpRight className="h-4 w-4" />
            </a>
          </div>
        </div>
      </div>
    </article>
  )
}
