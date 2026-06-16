import Link from "next/link"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { ArchiveHero } from "@/components/archive-hero"
import { ArchiveSearchBar } from "@/components/archive-search-bar"
import { FeaturedRecords } from "@/components/featured-records"
import { LatestDispatches } from "@/components/latest-dispatches"
import { ArchiveSidebar } from "@/components/archive-sidebar"
import { getCategories, getTags, getAvailableMonths } from "@/lib/archives"
import { getAllPosts, formatDate } from "@/lib/blog-posts"

export const dynamic = "force-dynamic"

export const metadata = {
  title: "Archives | HOT AND FRESH",
  description: "Search HOT AND FRESH field notes, source records, research threads, videos, documents, timelines, and public records.",
}

export default async function ArchivesPage() {
  const [categories, tags, allPosts, months] = await Promise.all([
    getCategories(),
    getTags(),
    getAllPosts(),
    getAvailableMonths(),
  ])

  // Get years that actually have posts
  const years = Array.from(
    new Set(allPosts.map((p) => new Date(p.published_at || p.date).getFullYear())),
  ).sort((a, b) => b - a)

  // Get unique sources
  const sources = Array.from(
    new Set(allPosts
      .filter((p) => p.source_name)
      .map((p) => p.source_name))
  ).sort() as string[]

  // Get post types
  const postTypes = Array.from(
    new Set(allPosts.filter((p) => p.post_type).map((p) => p.post_type))
  ).sort() as string[]

  // Get media types
  const mediaTypes = Array.from(
    new Set(allPosts.filter((p) => p.media_type).map((p) => p.media_type))
  ).filter((m) => m) as string[]

  // Featured records (featured=true, sorted by priority)
  const featuredRecords = allPosts
    .filter((p) => p.featured)
    .sort((a, b) => (b.priority || 0) - (a.priority || 0))
    .map((p) => ({
      id: p.id || p.slug,
      slug: p.slug,
      title: p.title,
      excerpt: p.excerpt || p.subtitle || "",
      category: p.category || "General",
      post_type: p.post_type || "News Brief",
      published_at: p.published_at || p.date,
      source_name: p.source_name,
      priority: p.priority || 0,
      cover_image: p.cover_image,
      readMinutes: p.readMinutes || p.read_minutes,
      media_type: p.media_type,
      featured: p.featured,
    }))

  // All posts for latest dispatches
  const dispatchRecords = allPosts
    .sort((a, b) => new Date(b.published_at || b.date).getTime() - new Date(a.published_at || a.date).getTime())
    .map((p) => ({
      id: p.id || p.slug,
      slug: p.slug,
      title: p.title,
      excerpt: p.excerpt || "",
      subtitle: p.subtitle,
      category: p.category || "General",
      post_type: p.post_type || "News Brief",
      tags: p.tags || (p.tag ? [p.tag] : []),
      published_at: p.published_at || p.date,
      source_name: p.source_name,
      readMinutes: p.readMinutes || p.read_minutes,
      media_type: p.media_type,
      featured: p.featured,
      author: p.author_name || "HOT AND FRESH",
    }))

  // Stats
  const stats = {
    totalRecords: allPosts.length,
    featured: featuredRecords.length,
    videos: allPosts.filter((p) => p.media_type === "video").length,
    documents: allPosts.filter((p) => p.media_type === "document").length,
  }

  // Last update date
  const lastUpdate = new Date(Math.max(...allPosts.map((p) => new Date(p.published_at || p.date).getTime())))
    .toLocaleDateString("en-US", { month: "short", day: "numeric" })

  return (
    <div className="min-h-screen tactical-grid">
      <SiteHeader />

      <main className="mx-auto w-full max-w-7xl px-4 py-12 md:px-6 lg:py-16">
        {/* Hero Section */}
        <ArchiveHero
          totalRecords={stats.totalRecords}
          featuredRecords={stats.featured}
          videoArchives={stats.videos}
          documentDrops={stats.documents}
          activeSources={sources.length}
          lastUpdate={lastUpdate}
        />

        {/* Search and Filter Bar */}
        <ArchiveSearchBar
          categories={categories}
          postTypes={postTypes}
          mediaTypes={mediaTypes}
          years={years}
          months={months}
          sources={sources}
          tags={tags}
          onFiltersChange={(filters) => {
            // Client-side filtering will be handled by the component wrapper
            // For now, this is a placeholder for future interactivity
          }}
        />

        {/* Featured Records */}
        {featuredRecords.length > 0 && (
          <FeaturedRecords records={featuredRecords} />
        )}

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-[1fr_280px]">
          {/* Latest Dispatches */}
          <LatestDispatches records={dispatchRecords} />

          {/* Sidebar */}
          <ArchiveSidebar
            categories={categories}
            tags={tags}
            sources={sources}
            months={months}
            years={years}
            stats={stats}
          />
        </div>
      </main>

      <SiteFooter />
    </div>
  )
}

