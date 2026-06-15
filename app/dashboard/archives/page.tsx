import { redirect } from "next/navigation"
import { createAdminClient } from "@/lib/supabase/admin"
import { ArchivesTable } from "@/components/archives-table"
import { validateDashboardAccess } from "@/lib/dashboard-auth"
import { PageHeader } from "@/components/dashboard/ui"

export const metadata = {
  title: "Archives Management — Admin Dashboard",
  description: "View, edit, and manage all posts in the archive.",
}

export default async function ArchivesPage() {
  const hasAccess = await validateDashboardAccess()
  if (!hasAccess) redirect("/dashboard/login")

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
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Archives"
        description={`View, edit, and manage all posts in the archive. ${posts.length} total posts.`}
        breadcrumbs={[{ label: "Archives" }]}
      />
      <ArchivesTable initialPosts={posts} />
    </div>
  )
}
