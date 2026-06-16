"use client"

import Link from "next/link"
import { Folder, Tag, Archive, Calendar, Radio, TrendingUp } from "lucide-react"

interface ArchiveSidebarProps {
  categories: string[]
  tags: string[]
  sources: string[]
  months: Array<{ year: number; month: number; count: number }>
  years: number[]
  stats?: {
    totalRecords: number
    featured: number
    videos: number
    documents: number
  }
}

export function ArchiveSidebar({ categories, tags, sources, months, years, stats }: ArchiveSidebarProps) {
  return (
    <aside className="space-y-6">
      {/* Archive Stats */}
      {stats && (
        <div className="border border-border rounded p-4 bg-card/50">
          <div className="flex items-center gap-2 mb-3 pb-3 border-b border-border/50">
            <TrendingUp className="h-4 w-4 text-primary" />
            <h3 className="label-mono text-xs font-semibold text-primary">ARCHIVE STATS</h3>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">Total Records:</span>
              <span className="font-bold text-foreground">{stats.totalRecords}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">Featured:</span>
              <span className="font-bold text-primary">{stats.featured}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">Videos:</span>
              <span className="font-bold text-foreground">{stats.videos}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">Documents:</span>
              <span className="font-bold text-foreground">{stats.documents}</span>
            </div>
          </div>
        </div>
      )}

      {/* Categories */}
      {categories.length > 0 && (
        <div className="border border-border rounded p-4 bg-card/50">
          <div className="flex items-center gap-2 mb-3 pb-3 border-b border-border/50">
            <Folder className="h-4 w-4 text-primary" />
            <h3 className="label-mono text-xs font-semibold text-primary">CATEGORIES</h3>
          </div>
          <div className="space-y-1.5">
            {categories.map((cat) => (
              <Link
                key={cat}
                href={`/archives/category/${encodeURIComponent(cat)}`}
                className="label-mono block border-l-2 border-transparent px-3 py-1.5 text-sm text-muted-foreground hover:border-primary hover:text-foreground hover:bg-muted/30 rounded-r transition-all"
              >
                {cat}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Tags */}
      {tags.length > 0 && (
        <div className="border border-border rounded p-4 bg-card/50">
          <div className="flex items-center gap-2 mb-3 pb-3 border-b border-border/50">
            <Tag className="h-4 w-4 text-primary" />
            <h3 className="label-mono text-xs font-semibold text-primary">TAGS</h3>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {tags.slice(0, 20).map((tag) => (
              <Link
                key={tag}
                href={`/archives/tag/${encodeURIComponent(tag)}`}
                className="label-mono text-xs px-2 py-1 border border-border bg-background hover:border-primary hover:text-primary rounded transition-all"
              >
                #{tag}
              </Link>
            ))}
            {tags.length > 20 && (
              <span className="label-mono text-xs px-2 py-1 text-muted-foreground">+{tags.length - 20} more</span>
            )}
          </div>
        </div>
      )}

      {/* Sources */}
      {sources.length > 0 && (
        <div className="border border-border rounded p-4 bg-card/50">
          <div className="flex items-center gap-2 mb-3 pb-3 border-b border-border/50">
            <Archive className="h-4 w-4 text-primary" />
            <h3 className="label-mono text-xs font-semibold text-primary">SOURCES</h3>
          </div>
          <div className="space-y-1.5">
            {sources.slice(0, 10).map((source) => (
              <Link
                key={source}
                href={`/archives/source/${encodeURIComponent(source)}`}
                className="label-mono block border-l-2 border-transparent px-3 py-1.5 text-sm text-muted-foreground hover:border-primary hover:text-foreground hover:bg-muted/30 rounded-r transition-all truncate"
              >
                {source}
              </Link>
            ))}
            {sources.length > 10 && (
              <span className="label-mono text-xs text-muted-foreground px-3">+{sources.length - 10} more</span>
            )}
          </div>
        </div>
      )}

      {/* By Month */}
      {months.length > 0 && (
        <div className="border border-border rounded p-4 bg-card/50">
          <div className="flex items-center gap-2 mb-3 pb-3 border-b border-border/50">
            <Calendar className="h-4 w-4 text-primary" />
            <h3 className="label-mono text-xs font-semibold text-primary">BY MONTH</h3>
          </div>
          <div className="space-y-1 max-h-64 overflow-y-auto">
            {months.map(({ year, month, count }) => (
              <Link
                key={`${year}-${month}`}
                href={`/archives/${year}/${String(month).padStart(2, "0")}`}
                className="label-mono flex justify-between items-center border-l-2 border-transparent px-3 py-1.5 text-sm text-muted-foreground hover:border-primary hover:text-foreground hover:bg-muted/30 rounded-r transition-all group"
              >
                <span>
                  {new Date(year, month - 1).toLocaleString("default", {
                    month: "short",
                    year: "numeric",
                  })}
                </span>
                <span className="text-xs text-muted-foreground group-hover:text-primary">({count})</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* By Year */}
      {years.length > 0 && (
        <div className="border border-border rounded p-4 bg-card/50">
          <div className="flex items-center gap-2 mb-3 pb-3 border-b border-border/50">
            <Calendar className="h-4 w-4 text-primary" />
            <h3 className="label-mono text-xs font-semibold text-primary">BY YEAR</h3>
          </div>
          <div className="space-y-1.5">
            {years.sort((a, b) => b - a).map((year) => (
              <Link
                key={year}
                href={`/archives/${year}`}
                className="label-mono block border-l-2 border-transparent px-3 py-1.5 text-sm text-muted-foreground hover:border-primary hover:text-foreground hover:bg-muted/30 rounded-r transition-all"
              >
                {year}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* RSS Feed */}
      <Link
        href="/api/rss"
        className="border border-primary/30 rounded p-4 bg-primary/5 hover:bg-primary/10 transition-colors block group"
      >
        <div className="flex items-center gap-2 mb-2">
          <Radio className="h-4 w-4 text-primary" />
          <h3 className="label-mono text-xs font-semibold text-primary">RSS FEED</h3>
        </div>
        <p className="label-mono text-xs text-muted-foreground group-hover:text-foreground transition-colors">
          Subscribe to archive updates via RSS.
        </p>
      </Link>
    </aside>
  )
}
