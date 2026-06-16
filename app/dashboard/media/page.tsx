import { redirect } from "next/navigation"
import { createAdminClient } from "@/lib/supabase/admin"
import { validateDashboardAccess } from "@/lib/dashboard-auth"
import { PageHeader } from "@/components/dashboard/ui"
import { MediaLibrary, type MediaRow } from "@/components/dashboard/media-library"

export const dynamic = "force-dynamic"

export const metadata = {
  title: "Media Library — Admin Dashboard",
  description: "Upload and manage images and videos.",
}

export default async function MediaPage() {
  const hasAccess = await validateDashboardAccess()
  if (!hasAccess) redirect("/dashboard/login")

  const admin = createAdminClient()
  const { data } = await admin
    .from("media_assets")
    .select("id, file_name, file_url, file_type, file_size, alt_text, created_at")
    .order("created_at", { ascending: false })

  const assets = (data || []) as MediaRow[]

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Media Library"
        description={`Upload and manage media assets. ${assets.length} files.`}
        breadcrumbs={[{ label: "Media Library" }]}
      />
      <MediaLibrary assets={assets} />
    </div>
  )
}
