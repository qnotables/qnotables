import { redirect } from "next/navigation"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { createAdminClient } from "@/lib/supabase/admin"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { ArchivesTable } from "@/components/archives-table"
import { validateDashboardAccess } from "@/lib/dashboard-auth"

export const metadata = {
  title: "Archives Management — Admin Dashboard",
  description: "View, edit, and manage all posts in the archive.",
}

export default async function ArchivesPage() {
  const hasAccess = await validateDashboardAccess()
  if (!hasAccess) {
    redirect("/dashboard/login")
  }

  // Fetch all posts
  const admin = createAdminClient()
  const { data: postsData = [] } = await admin
    .from("blog_posts")
    .select("id, slug, title, published_at, status, published, tag, category, author_name")
    .order("published_at", { ascending: false, nullsFirst: false })

  const posts = (postsData || []).map((p: any) => ({
    id: p.id,
    slug: p.slug,
    title: p.title,
    published_at: p.published_at,
    status: p.status,
    published: p.published,
    tag: p.tag,
    category: p.category,
    author_name: p.author_name,
  }))

  return (
    <>
      <SiteHeader />
      <main className="min-h-screen bg-background">
        <div className="mx-auto max-w-7xl px-4 py-8 md:px-6 md:py-12">
          <Link
            href="/dashboard"
            className="label-mono mb-8 inline-flex items-center gap-2 text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Link>

          <div className="mb-8">
            <h1 className="stencil mb-2 text-3xl text-foreground">Archives Management</h1>
            <p className="label-mono text-muted-foreground">
              View, edit, and manage all posts in the archive. {posts.length} total posts.
            </p>
          </div>

          <ArchivesTable initialPosts={posts} />
        </div>
      </main>
      <SiteFooter />
    </>
  )
}
