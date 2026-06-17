"use client"

import { useState, useMemo } from "react"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { ArchiveHero } from "@/components/archive-hero"
import { TimelineHero } from "@/components/timeline-hero"
import { TimelineFilterBar } from "@/components/timeline-filter-bar"
import { TimelineViewToggle } from "@/components/timeline-view-toggle"
import { TimelineGroupComponent } from "@/components/timeline-group"
import { TimelineCard } from "@/components/timeline-card"
import { TimelineSidebar } from "@/components/timeline-sidebar"
import {
  getAllArchiveRecords,
  groupRecordsByYearMonth,
  filterTimelineRecords,
  getTimelineStats,
  extractYears,
  extractCategories,
  extractTags,
  extractSources,
  extractMediaTypes,
  TimelineFilters,
} from "@/lib/archives-utils"
import { BlogPost } from "@/lib/blog-posts"

type ViewMode = "timeline" | "compact" | "media"

interface TimelinePageProps {
  posts: BlogPost[]
}

export default function TimelinePageClient({ posts }: TimelinePageProps) {
  // Convert posts to archive records
  const allRecords = useMemo(() => getAllArchiveRecords(posts), [posts])

  // Extract filter options
  const years = useMemo(() => extractYears(posts), [posts])
  const categories = useMemo(() => extractCategories(posts), [posts])
  const tags = useMemo(() => extractTags(posts), [posts])
  const sources = useMemo(() => extractSources(posts), [posts])
  const mediaTypes = useMemo(() => extractMediaTypes(posts), [posts])

  // State
  const [filters, setFilters] = useState<TimelineFilters>({})
  const [viewMode, setViewMode] = useState<ViewMode>("timeline")
  const [selectedYear, setSelectedYear] = useState<number | undefined>()
  const [expandedMonths, setExpandedMonths] = useState<Set<string>>(new Set())

  // Apply filters
  const filteredRecords = useMemo(() => {
    return filterTimelineRecords(allRecords, filters)
  }, [allRecords, filters])

  // Group by month
  const groupedRecords = useMemo(() => {
    return groupRecordsByYearMonth(filteredRecords)
  }, [filteredRecords])

  // Get stats
  const stats = useMemo(() => {
    return getTimelineStats(filteredRecords)
  }, [filteredRecords])

  // Build month count map for sidebar
  const monthCounts = useMemo(() => {
    const map = new Map<string, number>()
    for (const group of groupedRecords) {
      const key = `${group.year}-${String(group.month).padStart(2, "0")}`
      map.set(key, group.records.length)
    }
    return map
  }, [groupedRecords])

  // Handle filter changes
  const handleFilterChange = (newFilters: TimelineFilters) => {
    setFilters(newFilters)
    setSelectedYear(newFilters.year)
  }

  // Handle filter reset
  const handleResetFilters = () => {
    setFilters({})
    setSelectedYear(undefined)
    setExpandedMonths(new Set())
  }

  // Handle year selection
  const handleYearSelect = (year: number) => {
    setSelectedYear(year === selectedYear ? undefined : year)
    setFilters({ ...filters, year: year === selectedYear ? undefined : year })
  }

  // Toggle month expansion
  const toggleMonth = (monthKey: string) => {
    const newExpanded = new Set(expandedMonths)
    if (newExpanded.has(monthKey)) {
      newExpanded.delete(monthKey)
    } else {
      newExpanded.add(monthKey)
    }
    setExpandedMonths(newExpanded)
  }

  return (
    <div className="min-h-screen tactical-grid">
      <SiteHeader />
      <ArchiveHero currentPage="timeline" />

      <main className="mx-auto w-full max-w-7xl px-4 py-8 md:px-6 md:py-12">
        {/* Hero with stats */}
        <TimelineHero stats={stats} />

        {/* View toggle */}
        <TimelineViewToggle currentView={viewMode} onViewChange={setViewMode} />

        {/* Filter bar */}
        <TimelineFilterBar
          filters={filters}
          years={years}
          categories={categories}
          tags={tags}
          sources={sources}
          mediaTypes={mediaTypes}
          onFiltersChange={handleFilterChange}
          onReset={handleResetFilters}
        />

        {/* Content area */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-4">
          {/* Main content */}
          <div className="lg:col-span-3">
            {filteredRecords.length === 0 ? (
              <div className="rounded border border-dashed border-border p-12 text-center">
                <p className="label-mono text-muted-foreground">No records found matching your filters.</p>
              </div>
            ) : viewMode === "compact" ? (
              // Compact list view
              <div className="space-y-2">
                {filteredRecords.map((record) => (
                  <TimelineCard key={record.id} record={record} variant="compact" />
                ))}
              </div>
            ) : viewMode === "media" ? (
              // Media grid view
              <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
                {filteredRecords
                  .filter((r) => r.cover_image)
                  .map((record) => (
                    <a
                      key={record.id}
                      href={`/archives/${record.slug}`}
                      className="group relative aspect-square overflow-hidden rounded border border-border hover:border-primary transition-colors"
                    >
                      <img
                        src={record.cover_image ?? undefined}
                        alt={record.title}
                        className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end">
                        <div className="p-3">
                          <h4 className="stencil text-sm text-foreground line-clamp-2">{record.title}</h4>
                        </div>
                      </div>
                    </a>
                  ))}
              </div>
            ) : (
              // Timeline grouped view (default)
              <div>
                {groupedRecords.length === 0 ? (
                  <div className="rounded border border-dashed border-border p-12 text-center">
                    <p className="label-mono text-muted-foreground">No records for the selected timeframe.</p>
                  </div>
                ) : (
                  groupedRecords.map((group) => {
                    const monthKey = `${group.year}-${String(group.month).padStart(2, "0")}`
                    const isExpanded = expandedMonths.size === 0 || expandedMonths.has(monthKey)

                    return (
                      <TimelineGroupComponent
                        key={monthKey}
                        group={group}
                        isExpanded={isExpanded}
                        onToggle={() => toggleMonth(monthKey)}
                      />
                    )
                  })
                )}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <TimelineSidebar
            years={years}
            selectedYear={selectedYear}
            monthCounts={monthCounts}
            onYearSelect={handleYearSelect}
          />
        </div>
      </main>
      <SiteFooter />
    </div>
  )
}
