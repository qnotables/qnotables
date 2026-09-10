import Link from "next/link"
import { Plus } from "lucide-react"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { ArchiveHero } from "@/components/archive-hero"
import { ArchiveSearchBar } from "@/components/archive-search-bar"
import { FeaturedRecords } from "@/components/featured-records"
import { LatestDispatches } from "@/components/latest-dispatches"
import { ArchiveSidebar } from "@/components/archive-sidebar"
import { ContentSidebar } from "@/components/content-sidebar"
import { TopAd, BottomAd } from "@/components/ad-display"
import { getAllPosts } from "@/lib/blog-posts"
import { getPublishedVideos } from "@/app/actions/video-actions"
import { JsonLd } from "@/components/json-ld"
import { collectionSchema, pageMetadata } from "@/lib/seo"
import { getAdminUser } from "@/lib/admin"
import {
  transformBlogPostToArchive,
  convertVideoToArchive,
  extractCategories,
  extractTags,
  extractSources,
  extractPostTypes,
  extractMediaTypes,
  extractYears,
  extractMonths,
  getFeaturedRecords,
  getAllArchiveRecords,
  ArchiveRecord,
} from "@/lib/archives-utils"

export const dynamic = "force-dynamic"

const archiveDescription = "Search QNotables field notes, source records, research threads, videos, documents, timelines, and public records."

export const metadata = pageMetadata({
  title: "Archives",
  description: archiveDescription,
  path: "/archives",
})

export default async function ArchivesPage() {
  // Fetch posts and videos from database
  const [allPosts, allVideos, adminUser] = await Promise.all([
    getAllPosts(),
    getPublishedVideos(),
    getAdminUser(),
  ])
  const isAdmin = Boolean(adminUser)

  // Convert videos to archive records
  const videoRecords = allVideos.map(convertVideoToArchive)

  // Merge blog posts and videos
  const allRecords = [
    ...getAllArchiveRecords(allPosts),
    ...videoRecords,
  ]
    .sort((a, b) => new Date(b.published_at).getTime() - new Date(a.published_at).getTime())

  // If no records, show empty state
  if (!allRecords || allRecords.length === 0) {
    return (
      <div className="min-h-screen tactical-grid">
        <SiteHeader />
        <main className="mx-auto w-full max-w-7xl px-4 py-12 md:px-6 lg:py-16">
          <div className="rounded border border-dashed border-border p-12 text-center">
            <p className="label-mono text-muted-foreground">No records available yet. Check back soon.</p>
            {isAdmin && (
              <Link
                href="/dashboard/blog/new"
                className="label-mono mt-6 inline-flex items-center gap-2 bg-primary px-4 py-2 font-semibold text-primary-foreground transition-opacity hover:opacity-90"
              >
                <Plus className="h-4 w-4" />
                New Blog Post
              </Link>
            )}
          </div>
        </main>
        <SiteFooter />
      </div>
    )
  }

  // Extract metadata from posts
  const categories = extractCategories(allPosts)
  const tags = extractTags(allPosts)
  const sources = extractSources(allPosts)
  const postTypes = extractPostTypes(allPosts)
  const mediaTypes = extractMediaTypes(allPosts)
  const years = extractYears(allPosts)
  const months = extractMonths(allPosts)

  // Get featured records (only from blog posts for now)
  const featuredRecords = getFeaturedRecords(allPosts)

  // Calculate stats
  const stats = {
    totalRecords: allRecords.length,
    featured: featuredRecords.length,
    videos: videoRecords.length,
    documents: allPosts.filter((p) => p.postType === "Document Drop" || p.postType === "Public Record" || p.postType === "Source Archive").length,
  }

  // Get last update date
  const lastUpdate = allPosts
    .reduce((latest, post) => {
      const postDate = new Date(post.publishedAt || post.date)
      return postDate > latest ? postDate : latest
    }, new Date(0))
    .toLocaleDateString("en-US", { month: "short", day: "numeric" })

  return (
    <div className="min-h-screen tactical-grid">
      <JsonLd data={collectionSchema("QNotables Archives", archiveDescription, "/archives")} />
      <SiteHeader />
      <TopAd />

      <main className="mx-auto w-full max-w-7xl px-4 py-12 md:px-6 lg:py-16">
        {/* Hero Section */}
        <div className="flex flex-wrap items-end justify-between gap-4">
          <ArchiveHero
            totalRecords={stats.totalRecords}
            featuredRecords={stats.featured}
            videoArchives={stats.videos}
            documentDrops={stats.documents}
            activeSources={sources.length}
            lastUpdate={lastUpdate}
          />
          {isAdmin && (
            <Link
              href="/dashboard/blog/new"
              className="label-mono inline-flex items-center gap-2 bg-primary px-4 py-2.5 font-semibold text-primary-foreground transition-opacity hover:opacity-90"
            >
              <Plus className="h-4 w-4" />
              New Blog Post
            </Link>
          )}
        </div>

        {/* Search and Filter Bar */}
        <ArchiveSearchBar
          categories={categories}
          postTypes={postTypes}
          mediaTypes={mediaTypes}
          years={years}
          months={months}
          sources={sources}
          tags={tags}
        />

        {/* Featured Records */}
        {featuredRecords.length > 0 && (
          <FeaturedRecords records={featuredRecords} />
        )}

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-[1fr_280px]">
          {/* Latest Dispatches */}
          <LatestDispatches records={allRecords || []} />

          {/* Sidebar */}
          <ContentSidebar>
            <ArchiveSidebar
              categories={categories}
              tags={tags}
              sources={sources}
              months={months}
              years={years}
              stats={stats}
            />
          </ContentSidebar>
        </div>
      </main>

      <BottomAd />
      <SiteFooter />
    </div>
  )
}

