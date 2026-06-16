import { redirect } from "next/navigation"
import { validateDashboardAccess } from "@/lib/dashboard-auth"
import { PageHeader } from "@/components/dashboard/ui"
import { DashboardBlogForm } from "@/components/dashboard/dashboard-blog-form"

export const dynamic = "force-dynamic"

export const metadata = {
  title: "New Post — Admin Dashboard",
}

export default async function NewPostPage() {
  const hasAccess = await validateDashboardAccess()
  if (!hasAccess) redirect("/dashboard/login")

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="New Post"
        description="Draft a new dispatch. Save as draft or publish immediately."
        breadcrumbs={[
          { label: "Blog", href: "/dashboard/blog" },
          { label: "New Post" },
        ]}
      />
      <DashboardBlogForm />
    </div>
  )
}
