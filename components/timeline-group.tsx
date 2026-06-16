import { TimelineGroup } from "@/lib/archives-utils"
import { TimelineCard } from "@/components/timeline-card"

interface TimelineGroupProps {
  group: TimelineGroup
  isExpanded?: boolean
  onToggle?: () => void
}

export function TimelineGroupComponent({ group, isExpanded = true, onToggle }: TimelineGroupProps) {
  return (
    <div className="mb-8">
      {/* Month header */}
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between mb-4 pb-3 border-b-2 border-primary/40 hover:border-primary transition-colors group"
      >
        <div className="flex items-center gap-3">
          <h3 className="stencil text-xl md:text-2xl text-foreground group-hover:text-primary transition-colors">
            {group.monthLabel}
          </h3>
          <span className="label-mono text-xs bg-primary/10 text-primary px-2 py-1 rounded">
            {group.records.length}
          </span>
        </div>
        {onToggle && (
          <div className={`transition-transform ${isExpanded ? "rotate-180" : ""}`}>
            <svg className="h-5 w-5 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          </div>
        )}
      </button>

      {/* Records list */}
      {isExpanded && (
        <div className="space-y-3 ml-0 md:ml-4">
          {group.records.map((record) => (
            <TimelineCard key={record.id} record={record} />
          ))}
        </div>
      )}
    </div>
  )
}
