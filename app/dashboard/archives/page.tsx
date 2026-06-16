import { redirect } from "next/navigation"
import Link from "next/link"
import { Plus, Edit, Trash2, Eye, Copy, Star, Archive as ArchiveIcon } from "lucide-react"
import { createAdminClient } from "@/lib/supabase/admin"
import { validateDashboardAccess } from "@/lib/dashboard-auth"
import { ArchivesTable } from "@/components/archives-table"

export const dynamic = "force-dynamic"

export const metadata = {
  title: "Archives Management — Dashboard",
  description: "Manage archive posts, media, and research items",
}

export default async function ArchivesPage() {
  const hasAccess = await validateDashboardAccess()
  if (!hasAccess) redirect("/dashboard/login")

  const admin = createAdminClient()
  const { data: postsData = [] } = await admin
    .from("blog_posts")
    .select("id, slug, title, published_at, status, featured, category, post_type, media_type, priority")
    .order("updated_at", { ascending: false })

  const posts = (postsData || []).map((p: any) => ({
    id: p.id,
    slug: p.slug,
    title: p.title,
    published_at: p.published_at,
    status: p.status,
    featured: p.featured,
    category: p.category,
    post_type: p.post_type,
    media_type: p.media_type,
    priority: p.priority,
  }))

  const published = posts.filter(p => p.status === "published").length
  const drafts = posts.filter(p => p.status === "draft").length
  const scheduled = posts.filter(p => p.status === "scheduled").length

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border px-6 py-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">ARCHIVE MANAGEMENT</h1>
            <p className="label-mono mt-2 text-sm text-muted-foreground">
              {posts.length} total items • {published} published • {drafts} drafts • {scheduled} scheduled
            </p>
          </div>
          <Link
            href="/dashboard/archives/new"
            className="inline-flex items-center gap-2 bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
          >
            <Plus className="h-4 w-4" />
            NEW ARCHIVE ITEM
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="border-b border-border px-6 py-6">
        <div className="grid grid-cols-4 gap-4">
          <div className="border border-border bg-muted/30 p-4">
            <p className="label-mono text-xs font-semibold uppercase text-muted-foreground">Total Items</p>
            <p className="text-2xl font-bold text-foreground">{posts.length}</p>
          </div>
          <div className="border border-border bg-muted/30 p-4">
            <p className="label-mono text-xs font-semibold uppercase text-muted-foreground">Published</p>
            <p className="text-2xl font-bold text-foreground">{published}</p>
          </div>
          <div className="border border-border bg-muted/30 p-4">
            <p className="label-mono text-xs font-semibold uppercase text-muted-foreground">Drafts</p>
            <p className="text-2xl font-bold text-foreground">{drafts}</p>
          </div>
          <div className="border border-border bg-muted/30 p-4">
            <p className="label-mono text-xs font-semibold uppercase text-muted-foreground">Scheduled</p>
            <p className="text-2xl font-bold text-foreground">{scheduled}</p>
          </div>
        </div>
      </div>

      {/* Archives Table */}
      <div className="px-6 py-8">
        <ArchivesTable initialPosts={posts} />
      </div>
    </div>
  )
}
