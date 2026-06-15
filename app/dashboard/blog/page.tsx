import { redirect } from "next/navigation"
import { Plus } from "lucide-react"
import { validateDashboardAccess } from "@/lib/dashboard-auth"
import { getAllPostsAdmin } from "@/lib/blog-posts"
import { PageHeader, PrimaryButton } from "@/components/dashboard/ui"
import { BlogTable } from "@/components/dashboard/blog-table"

export const metadata = {
  title: "Blog — Control Room",
  description: "Create, edit, and manage blog posts.",
}

export default async function BlogDashboardPage() {
  const hasAccess = await validateDashboardAccess()
  if (!hasAccess) redirect("/dashboard/login")

  const posts = await getAllPostsAdmin()

  return (
    <div className="mx-auto max-w-7xl">
      <PageHeader
        title="Blog"
        description={`Managing ${posts.length} ${posts.length === 1 ? "post" : "posts"}`}
        action={
          <PrimaryButton href="/dashboard/blog/new">
            <Plus className="h-4 w-4" /> New Post
          </PrimaryButton>
        }
      />
      <BlogTable posts={posts} />
    </div>
  )
}
