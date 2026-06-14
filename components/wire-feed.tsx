"use client"

import { StoryCard } from "@/components/story-card"
import { useDeskFilter } from "@/components/desk-filter-context"
import type { Category, Story } from "@/lib/news-data"

type Desk = { cat: Category; stories: Story[] }

export function WireFeed({ desks }: { desks: Desk[] }) {
  const { active } = useDeskFilter()

  const visible = active === "NOTABLES" ? desks : desks.filter((d) => d.cat === active)
  const isFiltered = active !== "NOTABLES"

  return (
    <>
      <div id="wire" className="mb-5 mt-12 flex scroll-mt-40 items-center gap-3">
        <span className="h-2 w-2 bg-primary" />
        <h2 className="stencil text-xl text-foreground">The Wire</h2>
        <span className="label-mono hidden text-muted-foreground sm:inline">
          {isFiltered ? `// DESK: ${active}` : `// ${desks.length} DESKS ACTIVE`}
        </span>
        <span className="ml-auto h-px flex-1 bg-border" />
      </div>

      {visible.length === 0 ? (
        <p className="label-mono border border-dashed border-border px-4 py-8 text-center text-muted-foreground">
          No active reports on this desk.
        </p>
      ) : (
        <div className="flex flex-col gap-10">
          {visible.map(({ cat, stories }) => (
            <section key={cat} id={`desk-${cat}`} className="scroll-mt-40">
              <div className="mb-4 flex items-center gap-3">
                <h3 className="stencil text-lg text-primary">{cat}</h3>
                <span className="label-mono text-muted-foreground">
                  {String(stories.length).padStart(2, "0")}{" "}
                  {stories.length === 1 ? "REPORT" : "REPORTS"}
                </span>
                <span className="ml-auto h-px flex-1 bg-border/60" />
              </div>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {stories.map((story) => (
                  <StoryCard key={story.id} story={story} />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </>
  )
}
