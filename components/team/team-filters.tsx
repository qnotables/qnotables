"use client"

import { useTransition } from "react"
import { X } from "lucide-react"

interface TeamFiltersProps {
  groups: string[]
  selectedGroup: string | null
  onFilterChange: (group: string | null) => void
}

export function TeamFilters({ groups, selectedGroup, onFilterChange }: TeamFiltersProps) {
  const [pending] = useTransition()

  if (groups.length === 0) return null

  return (
    <div className="flex flex-wrap gap-2">
      <button
        onClick={() => onFilterChange(null)}
        disabled={pending}
        className={`label-mono inline-flex items-center gap-2 px-3 py-1 border transition-colors disabled:opacity-50 ${
          selectedGroup === null
            ? "border-primary bg-primary/10 text-primary"
            : "border-border bg-background text-muted-foreground hover:border-primary hover:text-primary"
        }`}
      >
        All Teams
      </button>

      {groups.map((group) => (
        <button
          key={group}
          onClick={() => onFilterChange(selectedGroup === group ? null : group)}
          disabled={pending}
          className={`label-mono inline-flex items-center gap-2 px-3 py-1 border transition-colors disabled:opacity-50 ${
            selectedGroup === group
              ? "border-primary bg-primary/10 text-primary"
              : "border-border bg-background text-muted-foreground hover:border-primary hover:text-primary"
          }`}
        >
          {group}
          {selectedGroup === group && <X className="h-3 w-3" />}
        </button>
      ))}
    </div>
  )
}
