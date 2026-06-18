import { redirect } from "next/navigation"
import { validateDashboardAccess } from "@/lib/dashboard-auth"
import { VideoForm } from "@/components/dashboard/video-form"
import { PageHeader } from "@/components/dashboard/ui"

export const metadata = {
  title: "New Video — Dashboard",
}

export default async function NewVideoPage() {
  const hasAccess = await validateDashboardAccess()
  if (!hasAccess) redirect("/dashboard/login")

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title="New Video"
        description="Add a video by uploading a file or linking to an external URL."
        breadcrumbs={[{ label: "Videos", href: "/dashboard/videos" }, { label: "New" }]}
      />
      <VideoForm />
    </div>
  )
}
