import { redirect, notFound } from "next/navigation"
import { validateDashboardAccess } from "@/lib/dashboard-auth"
import { getVideoById } from "@/app/actions/video-actions"
import { VideoForm } from "@/components/dashboard/video-form"
import { PageHeader } from "@/components/dashboard/ui"

export const metadata = {
  title: "Edit Video — Dashboard",
}

export default async function EditVideoPage({ params }: { params: Promise<{ id: string }> }) {
  const hasAccess = await validateDashboardAccess()
  if (!hasAccess) redirect("/dashboard/login")

  const { id } = await params
  const video = await getVideoById(id)
  if (!video) notFound()

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title="Edit Video"
        description={video.title}
        breadcrumbs={[{ label: "Videos", href: "/dashboard/videos" }, { label: "Edit" }]}
      />
      <VideoForm video={video} />
    </div>
  )
}
