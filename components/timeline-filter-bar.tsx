"use client"

import { X, ChevronDown } from "lucide-react"
import { TimelineFilters } from "@/lib/archives-utils"

interface TimelineFilterBarProps {
  filters: TimelineFilters
  years: number[]
  categories: string[]
  tags: string[]
  sources: string[]
  mediaTypes: string[]
  onFiltersChange: (filters: TimelineFilters) => void
  onReset: () => void
}

export function TimelineFilterBar({
  filters,
  years,
  categories,
  tags,
  sources,
  mediaTypes,
  onFiltersChange,
  onReset,
}: TimelineFilterBarProps) {
  const hasActiveFilters = Object.values(filters).some((v) => v !== undefined && v !== "")

  return (
    <div className="mb-8 rounded border border-border bg-card/50 p-4 md:p-6">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="stencil text-lg font-semibold text-foreground">Filters</h3>
        {hasActiveFilters && (
          <button
            onClick={onReset}
            className="label-mono flex items-center gap-1 text-xs text-primary hover:underline"
          >
            <X className="h-3 w-3" />
            Clear All
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
        {/* Year Filter */}
        <div>
          <label className="label-mono mb-2 block text-xs text-muted-foreground">Year</label>
          <select
            value={filters.year || ""}
            onChange={(e) =>
              onFiltersChange({
                ...filters,
                year: e.target.value ? parseInt(e.target.value) : undefined,
              })
            }
            className="w-full rounded border border-border bg-background px-3 py-2 text-sm text-foreground transition-colors hover:border-primary focus:border-primary focus:outline-none"
          >
            <option value="">All Years</option>
            {years.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </div>

        {/* Category Filter */}
        <div>
          <label className="label-mono mb-2 block text-xs text-muted-foreground">Category</label>
          <select
            value={filters.category || ""}
            onChange={(e) =>
              onFiltersChange({
                ...filters,
                category: e.target.value || undefined,
              })
            }
            className="w-full rounded border border-border bg-background px-3 py-2 text-sm text-foreground transition-colors hover:border-primary focus:border-primary focus:outline-none"
          >
            <option value="">All Categories</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        {/* Source Filter */}
        <div>
          <label className="label-mono mb-2 block text-xs text-muted-foreground">Source</label>
          <select
            value={filters.source || ""}
            onChange={(e) =>
              onFiltersChange({
                ...filters,
                source: e.target.value || undefined,
              })
            }
            className="w-full rounded border border-border bg-background px-3 py-2 text-sm text-foreground transition-colors hover:border-primary focus:border-primary focus:outline-none"
          >
            <option value="">All Sources</option>
            {sources.map((src) => (
              <option key={src} value={src}>
                {src}
              </option>
            ))}
          </select>
        </div>

        {/* Media Type Filter */}
        <div>
          <label className="label-mono mb-2 block text-xs text-muted-foreground">Media</label>
          <select
            value={filters.mediaType || ""}
            onChange={(e) =>
              onFiltersChange({
                ...filters,
                mediaType: e.target.value || undefined,
              })
            }
            className="w-full rounded border border-border bg-background px-3 py-2 text-sm text-foreground transition-colors hover:border-primary focus:border-primary focus:outline-none"
          >
            <option value="">All Types</option>
            {mediaTypes.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>

        {/* Search Filter */}
        <div>
          <label className="label-mono mb-2 block text-xs text-muted-foreground">Search</label>
          <input
            type="text"
            placeholder="Search..."
            value={filters.search || ""}
            onChange={(e) =>
              onFiltersChange({
                ...filters,
                search: e.target.value || undefined,
              })
            }
            className="w-full rounded border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground transition-colors hover:border-primary focus:border-primary focus:outline-none"
          />
        </div>
      </div>
    </div>
  )
}
