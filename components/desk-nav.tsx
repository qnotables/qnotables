"use client"

import { useDeskFilter } from "@/components/desk-filter-context"
import { categories } from "@/lib/news-data"

export function DeskNav() {
  const { active, setActive } = useDeskFilter()
  const allDesks = ["NOTABLES", ...categories]

  return (
    <div className="mb-6 flex flex-wrap gap-1 border border-border bg-card px-3 py-2">
      {allDesks.map((desk) => (
        <button
          key={desk}
          onClick={() => setActive(desk)}
          className={`label-mono px-3 py-2 transition-colors ${
            active === desk
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:bg-muted hover:text-foreground"
          }`}
          aria-pressed={active === desk}
        >
          {desk}
        </button>
      ))}
    </div>
  )
}
