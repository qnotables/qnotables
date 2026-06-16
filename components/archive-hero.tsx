"use client"

import Link from "next/link"
import { Radio, Video, FileText, Calendar, Archive, TrendingUp } from "lucide-react"

interface ArchiveHeroProps {
  totalRecords?: number
  featuredRecords?: number
  videoArchives?: number
  documentDrops?: number
  activeSources?: number
  lastUpdate?: string
  currentPage?: "main" | "timeline" | "documents" | "videos"
}

export function ArchiveHero({ totalRecords = 0, featuredRecords = 0, videoArchives = 0, documentDrops = 0, activeSources = 0, lastUpdate = "—", currentPage }: ArchiveHeroProps) {
  // If currentPage is specified and not "main", show minimal hero for section pages
  if (currentPage && currentPage !== "main") {
    return (
      <section className="mb-8 border-b border-border pb-8">
        <div className="flex items-baseline gap-3 mb-4">
          <span className="h-3 w-3 bg-primary rounded" />
          <h1 className="stencil text-4xl md:text-5xl text-foreground capitalize">
            {currentPage === "timeline" && "TIMELINE"}
            {currentPage === "documents" && "DOCUMENTS"}
            {currentPage === "videos" && "VIDEOS"}
          </h1>
          <span className="label-mono hidden text-sm text-muted-foreground md:inline">
            // RESEARCH ARCHIVE
          </span>
        </div>

        <p className="text-sm leading-relaxed text-muted-foreground max-w-3xl mb-4">
          {currentPage === "timeline" && "Browse archives organized chronologically. Filter by date, category, source, and media type."}
          {currentPage === "documents" && "Research materials, PDFs, and documents from Hot and Fresh archives."}
          {currentPage === "videos" && "Video archives and multimedia content from Hot and Fresh."}
        </p>

        {/* Navigation buttons */}
        <div className="flex flex-wrap gap-2">
          <Link
            href="/archives"
            className="label-mono inline-flex items-center gap-2 px-3 py-2 border border-border bg-background text-sm text-foreground hover:bg-muted/50 rounded transition-colors"
          >
            <Archive className="h-4 w-4" />
            Main Archives
          </Link>
          <Link
            href="/archives/timeline"
            className={`label-mono inline-flex items-center gap-2 px-3 py-2 border text-sm rounded transition-colors ${
              currentPage === "timeline"
                ? "border-primary bg-primary/10 text-primary"
                : "border-border bg-background text-foreground hover:bg-muted/50"
            }`}
          >
            <Calendar className="h-4 w-4" />
            Timeline
          </Link>
          <Link
            href="/archives/documents"
            className={`label-mono inline-flex items-center gap-2 px-3 py-2 border text-sm rounded transition-colors ${
              currentPage === "documents"
                ? "border-primary bg-primary/10 text-primary"
                : "border-border bg-background text-foreground hover:bg-muted/50"
            }`}
          >
            <FileText className="h-4 w-4" />
            Documents
          </Link>
          <Link
            href="/archives/videos"
            className={`label-mono inline-flex items-center gap-2 px-3 py-2 border text-sm rounded transition-colors ${
              currentPage === "videos"
                ? "border-primary bg-primary/10 text-primary"
                : "border-border bg-background text-foreground hover:bg-muted/50"
            }`}
          >
            <Video className="h-4 w-4" />
            Videos
          </Link>
        </div>
      </section>
    )
  }

  return (
    <section className="mb-16 border-b border-border pb-12">
      {/* Hero content */}
      <div className="mb-8">
        <div className="flex items-baseline gap-3 mb-4">
          <span className="h-3 w-3 bg-primary rounded" />
          <h1 className="stencil text-4xl md:text-5xl lg:text-6xl text-foreground">
            ARCHIVES
          </h1>
          <span className="label-mono hidden text-sm text-muted-foreground md:inline">
            // RESEARCH LIBRARY
          </span>
        </div>

        <p className="text-lg leading-relaxed text-muted-foreground max-w-3xl mb-4">
          Field notes, source records, research threads, videos, documents, and public records organized for review.
        </p>

        <p className="text-sm leading-relaxed text-muted-foreground max-w-3xl">
          Search the record, follow the timeline, review source material, and track story threads across desks.
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6 mb-8">
        <div className="border border-border bg-card/50 p-3 rounded">
          <p className="label-mono text-xs font-semibold text-muted-foreground mb-1">TOTAL RECORDS</p>
          <p className="text-xl font-bold text-foreground">{totalRecords}</p>
        </div>
        <div className="border border-border bg-card/50 p-3 rounded">
          <p className="label-mono text-xs font-semibold text-muted-foreground mb-1">FEATURED</p>
          <p className="text-xl font-bold text-primary">{featuredRecords}</p>
        </div>
        <div className="border border-border bg-card/50 p-3 rounded">
          <p className="label-mono text-xs font-semibold text-muted-foreground mb-1">VIDEOS</p>
          <p className="text-xl font-bold text-foreground">{videoArchives}</p>
        </div>
        <div className="border border-border bg-card/50 p-3 rounded">
          <p className="label-mono text-xs font-semibold text-muted-foreground mb-1">DOCUMENTS</p>
          <p className="text-xl font-bold text-foreground">{documentDrops}</p>
        </div>
        <div className="border border-border bg-card/50 p-3 rounded">
          <p className="label-mono text-xs font-semibold text-muted-foreground mb-1">SOURCES</p>
          <p className="text-xl font-bold text-foreground">{activeSources}</p>
        </div>
        <div className="border border-border bg-card/50 p-3 rounded">
          <p className="label-mono text-xs font-semibold text-muted-foreground mb-1">UPDATED</p>
          <p className="text-xs text-foreground font-mono">{lastUpdate}</p>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex flex-wrap gap-2">
        <Link
          href="#featured"
          className="label-mono inline-flex items-center gap-2 px-3 py-2 border border-border bg-background text-sm text-foreground hover:bg-muted/50 rounded transition-colors"
        >
          <TrendingUp className="h-4 w-4" />
          Featured Records
        </Link>
        <Link
          href="/archives/timeline"
          className="label-mono inline-flex items-center gap-2 px-3 py-2 border border-border bg-background text-sm text-foreground hover:bg-muted/50 rounded transition-colors"
        >
          <Calendar className="h-4 w-4" />
          Timeline
        </Link>
        <Link
          href="/archives/videos"
          className="label-mono inline-flex items-center gap-2 px-3 py-2 border border-border bg-background text-sm text-foreground hover:bg-muted/50 rounded transition-colors"
        >
          <Video className="h-4 w-4" />
          Videos
        </Link>
        <Link
          href="/archives/documents"
          className="label-mono inline-flex items-center gap-2 px-3 py-2 border border-border bg-background text-sm text-foreground hover:bg-muted/50 rounded transition-colors"
        >
          <FileText className="h-4 w-4" />
          Documents
        </Link>
        <Link
          href="/api/rss"
          className="label-mono inline-flex items-center gap-2 px-3 py-2 border border-primary/30 bg-primary/5 text-sm text-primary hover:bg-primary/10 rounded transition-colors"
        >
          <Radio className="h-4 w-4" />
          RSS Feed
        </Link>
      </div>
    </section>
  )
}
