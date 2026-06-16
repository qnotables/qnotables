"use client"

import { X } from "lucide-react"
import { useTransition } from "react"
import { useRouter, useSearchParams } from "next/navigation"

interface TeamFiltersProps {
  groups: string[]
  selectedGroup: string | null
}

export function TeamFilters({ groups, selectedGroup }: TeamFiltersProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [pending] = useTransition()

  const handleFilterChange = (group: string | null) => {
    const params = new URLSearchParams(searchParams)
    if (group) {
      params.set("group", group)
    } else {
      params.delete("group")
    }
    router.push(`/team?${params.toString()}`)
  }

  if (groups.length === 0) return null

  return (
    <div className="flex flex-wrap gap-2">
      <button
        onClick={() => handleFilterChange(null)}
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
          onClick={() => handleFilterChange(selectedGroup === group ? null : group)}
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
