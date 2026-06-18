"use client"

import { useState, useMemo, useTransition } from "react"
import { Search, Filter, X, Tag } from "lucide-react"
import { LatestDispatches } from "@/components/latest-dispatches"
import type { ArchiveRecord } from "@/lib/archives-utils"

interface ArchivesClientProps {
  records: ArchiveRecord[]
  tags: string[]
  categories: string[]
  postTypes: string[]
  years: number[]
}

export function ArchivesClient({
  records,
  tags,
  categories,
  postTypes,
  years,
}: ArchivesClientProps) {
  const [search, setSearch] = useState("")
  const [selectedTag, setSelectedTag] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("")
  const [selectedType, setSelectedType] = useState("")
  const [selectedYear, setSelectedYear] = useState("")
  const [showFilters, setShowFilters] = useState(false)
  const [, startTransition] = useTransition()

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()

    return records.filter((r) => {
      // Text search across title and excerpt
      if (q) {
        const haystack = `${r.title} ${r.excerpt ?? ""}`.toLowerCase()
        if (!haystack.includes(q)) return false
      }

      // Tag filter
      if (selectedTag && !r.tags?.includes(selectedTag)) return false

      // Category filter
      if (selectedCategory && r.category !== selectedCategory) return false

      // Post type filter
      if (selectedType && r.post_type !== selectedType) return false

      // Year filter
      if (selectedYear) {
        const year = new Date(r.published_at).getFullYear()
        if (String(year) !== selectedYear) return false
      }

      return true
    })
  }, [records, search, selectedTag, selectedCategory, selectedType, selectedYear])

  const activeCount = [search, selectedTag, selectedCategory, selectedType, selectedYear].filter(Boolean).length

  function clearAll() {
    startTransition(() => {
      setSearch("")
      setSelectedTag("")
      setSelectedCategory("")
      setSelectedType("")
      setSelectedYear("")
    })
  }

  return (
    <div className="space-y-8">
      {/* Search bar */}
      <div className="rounded border border-border bg-card/50 p-4 md:p-6">
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="search"
              placeholder="Search by title or excerpt..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded border border-border bg-background py-2 pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              aria-label="Search archives"
            />
          </div>
          <button
            type="button"
            onClick={() => setShowFilters((v) => !v)}
            className="inline-flex items-center gap-2 rounded border border-border bg-background px-3 py-2 text-sm transition-colors hover:bg-muted/50"
            aria-expanded={showFilters}
            aria-label="Toggle filters"
          >
            <Filter className="h-4 w-4 text-muted-foreground" />
            <span className="label-mono hidden text-xs sm:inline text-muted-foreground">
              FILTERS{activeCount > 1 ? ` (${activeCount - (search ? 1 : 0)})` : ""}
            </span>
          </button>
          {activeCount > 0 && (
            <button
              type="button"
              onClick={clearAll}
              className="inline-flex items-center gap-1 rounded border border-border bg-background px-3 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
              aria-label="Clear all filters"
            >
              <X className="h-4 w-4" />
              <span className="label-mono hidden text-xs sm:inline">CLEAR</span>
            </button>
          )}
        </div>

        {/* Expanded filter panel */}
        {showFilters && (
          <div className="mt-4 space-y-4 border-t border-border pt-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {categories.length > 0 && (
                <div>
                  <label className="label-mono mb-1.5 block text-xs font-semibold text-muted-foreground">
                    CATEGORY
                  </label>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full rounded border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="">All Categories</option>
                    {categories.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              )}

              {postTypes.length > 0 && (
                <div>
                  <label className="label-mono mb-1.5 block text-xs font-semibold text-muted-foreground">
                    TYPE
                  </label>
                  <select
                    value={selectedType}
                    onChange={(e) => setSelectedType(e.target.value)}
                    className="w-full rounded border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="">All Types</option>
                    {postTypes.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
              )}

              {years.length > 0 && (
                <div>
                  <label className="label-mono mb-1.5 block text-xs font-semibold text-muted-foreground">
                    YEAR
                  </label>
                  <select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(e.target.value)}
                    className="w-full rounded border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="">All Years</option>
                    {years.map((y) => (
                      <option key={y} value={String(y)}>{y}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tag pills */}
        {tags.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2 border-t border-border pt-4">
            <span className="label-mono flex items-center gap-1 text-xs text-muted-foreground">
              <Tag className="h-3 w-3" /> TAGS:
            </span>
            {tags.slice(0, 16).map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => setSelectedTag(selectedTag === tag ? "" : tag)}
                className={`label-mono rounded border px-2 py-0.5 text-xs transition-colors ${
                  selectedTag === tag
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border text-muted-foreground hover:border-primary/50 hover:text-foreground"
                }`}
              >
                #{tag}
              </button>
            ))}
            {tags.length > 16 && (
              <span className="label-mono text-xs text-muted-foreground self-center">
                +{tags.length - 16} more
              </span>
            )}
          </div>
        )}
      </div>

      {/* Results count when filtering */}
      {activeCount > 0 && (
        <p className="label-mono text-xs text-muted-foreground">
          {filtered.length} record{filtered.length !== 1 ? "s" : ""} found
          {search ? ` for "${search}"` : ""}
          {selectedTag ? ` tagged #${selectedTag}` : ""}
        </p>
      )}

      {/* Records list */}
      <LatestDispatches records={filtered} />
    </div>
  )
}
