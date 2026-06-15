import { redirect, notFound } from "next/navigation"
import { validateDashboardAccess } from "@/lib/dashboard-auth"
import { PageHeader } from "@/components/dashboard/ui"
import { DashboardBlogForm } from "@/components/dashboard/dashboard-blog-form"
import { getPostByIdAdmin } from "@/lib/blog-posts"

export const metadata = {
  title: "Edit Post — Admin Dashboard",
}

export default async function EditPostPage({ params }: { params: Promise<{ id: string }> }) {
  const hasAccess = await validateDashboardAccess()
  if (!hasAccess) redirect("/dashboard/login")

  const { id } = await params
  const post = await getPostByIdAdmin(id)
  if (!post) notFound()

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Edit Post"
        description={post.title}
        breadcrumbs={[
          { label: "Blog", href: "/dashboard/blog" },
          { label: "Edit" },
        ]}
      />
      <DashboardBlogForm post={post} />
    </div>
  )
}
