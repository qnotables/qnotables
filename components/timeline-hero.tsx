import { Calendar, Filter, Download } from "lucide-react"
import { TimelineStats } from "@/lib/archives-utils"

interface TimelineHeroProps {
  stats: TimelineStats
  onFilterClick?: () => void
}

export function TimelineHero({ stats, onFilterClick }: TimelineHeroProps) {
  const [startYear, endYear] = stats.yearRange

  return (
    <section className="mb-12 border-b border-border pb-8">
      {/* Header */}
      <div className="mb-8 flex items-start justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            <h1 className="stencil text-4xl md:text-5xl text-foreground">TIMELINE</h1>
          </div>
          <p className="text-sm text-muted-foreground md:text-base">
            Complete chronological record of all archived records and research
          </p>
        </div>
        <button
          onClick={onFilterClick}
          className="label-mono flex items-center gap-2 rounded border border-border px-3 py-2 text-xs font-semibold text-foreground transition-colors hover:border-primary hover:bg-primary/10 md:px-4 md:py-2"
        >
          <Filter className="h-4 w-4" />
          <span className="hidden sm:inline">FILTERS</span>
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-6 md:gap-4">
        <div className="rounded border border-border/50 bg-card/50 p-3 md:p-4">
          <p className="label-mono text-xs text-muted-foreground">TOTAL</p>
          <p className="stencil mt-1 text-2xl text-foreground md:text-3xl">{stats.totalRecords}</p>
        </div>
        <div className="rounded border border-border/50 bg-card/50 p-3 md:p-4">
          <p className="label-mono text-xs text-muted-foreground">SPAN</p>
          <p className="stencil mt-1 text-2xl text-foreground md:text-3xl">
            {startYear === endYear ? startYear : `${startYear}–${endYear}`}
          </p>
        </div>
        <div className="rounded border border-border/50 bg-card/50 p-3 md:p-4">
          <p className="label-mono text-xs text-muted-foreground">CATEGORIES</p>
          <p className="stencil mt-1 text-2xl text-foreground md:text-3xl">{stats.categories}</p>
        </div>
        <div className="rounded border border-border/50 bg-card/50 p-3 md:p-4">
          <p className="label-mono text-xs text-muted-foreground">TAGS</p>
          <p className="stencil mt-1 text-2xl text-foreground md:text-3xl">{stats.tags}</p>
        </div>
        <div className="rounded border border-border/50 bg-card/50 p-3 md:p-4">
          <p className="label-mono text-xs text-muted-foreground">SOURCES</p>
          <p className="stencil mt-1 text-2xl text-foreground md:text-3xl">{stats.sources}</p>
        </div>
        <div className="rounded border border-border/50 bg-card/50 p-3 md:p-4">
          <p className="label-mono text-xs text-muted-foreground">MEDIA</p>
          <p className="stencil mt-1 text-2xl text-foreground md:text-3xl">{stats.mediaTypes}</p>
        </div>
      </div>
    </section>
  )
}
