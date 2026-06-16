"use client"

import { useState, useMemo } from "react"
import { Search, Filter, X, Calendar, Folder, Tag, TrendingUp, Video, FileText, Link as LinkIcon } from "lucide-react"

interface ArchiveFilters {
  search: string
  category: string
  postType: string
  mediaType: string
  year: string
  month: string
  source: string
  tags: string[]
}

interface ArchiveSearchProps {
  categories: string[]
  postTypes: string[]
  mediaTypes: string[]
  years: number[]
  months: Array<{ year: number; month: number }>
  sources: string[]
  tags: string[]
  onFiltersChange: (filters: ArchiveFilters) => void
}

export function ArchiveSearchBar({ categories, postTypes, mediaTypes, years, months, sources, tags, onFiltersChange }: ArchiveSearchProps) {
  const [filters, setFilters] = useState<ArchiveFilters>({
    search: "",
    category: "",
    postType: "",
    mediaType: "",
    year: "",
    month: "",
    source: "",
    tags: [],
  })
  const [isExpanded, setIsExpanded] = useState(false)

  const handleFilterChange = (key: keyof ArchiveFilters, value: any) => {
    const updated = { ...filters, [key]: value }
    setFilters(updated)
    onFiltersChange(updated)
  }

  const activeFilterCount = Object.values(filters).filter(v => v && (Array.isArray(v) ? v.length > 0 : true)).length

  const clearFilters = () => {
    const cleared: ArchiveFilters = {
      search: "",
      category: "",
      postType: "",
      mediaType: "",
      year: "",
      month: "",
      source: "",
      tags: [],
    }
    setFilters(cleared)
    onFiltersChange(cleared)
  }

  return (
    <div className="mb-12 rounded border border-border bg-card/50 p-6">
      {/* Main search bar */}
      <div className="mb-6 flex gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search archives by title, tag, category, or source..."
            value={filters.search}
            onChange={(e) => handleFilterChange("search", e.target.value)}
            className="w-full bg-background pl-9 pr-3 py-2 text-sm border border-border rounded focus:outline-none focus:ring-1 focus:ring-primary text-foreground placeholder:text-muted-foreground"
          />
        </div>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="inline-flex items-center gap-2 border border-border bg-background px-3 py-2 text-sm font-medium text-foreground hover:bg-muted/50 rounded transition-colors"
        >
          <Filter className="h-4 w-4" />
          <span className="label-mono hidden sm:inline text-xs">
            {activeFilterCount > 0 && <span className="text-primary">({activeFilterCount})</span>}
          </span>
        </button>
      </div>

      {/* Expanded filters */}
      {isExpanded && (
        <div className="space-y-4 border-t border-border pt-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {/* Category */}
            {categories.length > 0 && (
              <div>
                <label className="label-mono mb-1.5 block text-xs font-semibold text-muted-foreground">CATEGORY</label>
                <select
                  value={filters.category}
                  onChange={(e) => handleFilterChange("category", e.target.value)}
                  className="w-full bg-background px-3 py-2 text-sm border border-border rounded focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
                >
                  <option value="">All Categories</option>
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Post Type */}
            {postTypes.length > 0 && (
              <div>
                <label className="label-mono mb-1.5 block text-xs font-semibold text-muted-foreground">TYPE</label>
                <select
                  value={filters.postType}
                  onChange={(e) => handleFilterChange("postType", e.target.value)}
                  className="w-full bg-background px-3 py-2 text-sm border border-border rounded focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
                >
                  <option value="">All Types</option>
                  {postTypes.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Media Type */}
            {mediaTypes.length > 0 && (
              <div>
                <label className="label-mono mb-1.5 block text-xs font-semibold text-muted-foreground">MEDIA</label>
                <select
                  value={filters.mediaType}
                  onChange={(e) => handleFilterChange("mediaType", e.target.value)}
                  className="w-full bg-background px-3 py-2 text-sm border border-border rounded focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
                >
                  <option value="">All Media</option>
                  {mediaTypes.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Year */}
            {years.length > 0 && (
              <div>
                <label className="label-mono mb-1.5 block text-xs font-semibold text-muted-foreground">YEAR</label>
                <select
                  value={filters.year}
                  onChange={(e) => handleFilterChange("year", e.target.value)}
                  className="w-full bg-background px-3 py-2 text-sm border border-border rounded focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
                >
                  <option value="">All Years</option>
                  {years.sort((a, b) => b - a).map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Clear filters button */}
          {activeFilterCount > 0 && (
            <button
              onClick={clearFilters}
              className="label-mono inline-flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="h-3 w-3" />
              Clear All Filters
            </button>
          )}
        </div>
      )}
    </div>
  )
}
