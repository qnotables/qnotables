"use client"

import { List, LayoutList, Images } from "lucide-react"

type ViewMode = "timeline" | "compact" | "media"

interface TimelineViewToggleProps {
  currentView: ViewMode
  onViewChange: (view: ViewMode) => void
}

export function TimelineViewToggle({ currentView, onViewChange }: TimelineViewToggleProps) {
  const views: Array<{ mode: ViewMode; label: string; icon: React.ReactNode }> = [
    { mode: "timeline", label: "Timeline", icon: <List className="h-4 w-4" /> },
    { mode: "compact", label: "List", icon: <LayoutList className="h-4 w-4" /> },
    { mode: "media", label: "Media", icon: <Images className="h-4 w-4" /> },
  ]

  return (
    <div className="mb-6 flex items-center gap-2 border-b border-border pb-4">
      <span className="label-mono text-xs text-muted-foreground mr-2">VIEW:</span>
      <div className="flex gap-1">
        {views.map((view) => (
          <button
            key={view.mode}
            onClick={() => onViewChange(view.mode)}
            className={`label-mono flex items-center gap-1.5 px-3 py-2 rounded transition-all text-xs font-semibold ${
              currentView === view.mode
                ? "bg-primary text-primary-foreground border border-primary"
                : "border border-border text-foreground hover:border-primary/50 hover:bg-card/50"
            }`}
          >
            {view.icon}
            <span className="hidden sm:inline">{view.label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
