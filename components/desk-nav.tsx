"use client"

import { useDeskFilter } from "@/components/desk-filter-context"
import { categories } from "@/lib/news-data"

export function DeskNav() {
  const { active, setActive } = useDeskFilter()
  const allDesks = ["NOTABLES", ...categories]

  return (
    <div className="mb-6 flex flex-wrap gap-2 border-b border-border pb-3">
      {allDesks.map((desk) => (
        <button
          key={desk}
          onClick={() => setActive(desk)}
          className={`label-mono px-3 py-1.5 transition-colors ${
            active === desk
              ? "border-b-2 border-primary text-primary"
              : "text-muted-foreground hover:text-foreground"
          }`}
          aria-pressed={active === desk}
        >
          {desk}
        </button>
      ))}
    </div>
  )
}
