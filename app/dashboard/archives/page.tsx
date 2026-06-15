import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { isAdminEmail } from "@/lib/admin"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { ArchivesTable } from "@/components/archives-table"

export const metadata = {
  title: "Manage Archives — Dashboard",
}

export default async function ArchivesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect("/auth/login")
  if (!isAdminEmail(user.email)) redirect("/")

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
    <div id="top" className="min-h-screen tactical-grid">
      <SiteHeader />

      <main className="mx-auto max-w-7xl px-4 py-10 md:px-6">
        <div className="mb-8 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="h-2 w-2 bg-primary" />
            <h1 className="stencil text-3xl md:text-4xl text-foreground">Archives Management</h1>
          </div>
        </div>

        <p className="label-mono mb-6 text-muted-foreground">
          View, edit, and manage all posts in the archive. {posts.length} total posts.
        </p>

        <ArchivesTable initialPosts={posts} />
      </main>

      <SiteFooter />
    </div>
  )
}
