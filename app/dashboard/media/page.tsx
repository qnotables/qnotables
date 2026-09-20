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

  const rows = (data || []) as MediaRow[]
  const urls = rows.map((asset) => asset.file_url)
  const { data: analyses } = urls.length
    ? await admin.from("media_ai_analysis").select("id, media_url, status, summary, description, visible_text, topics, tags, media_type, locations, organizations, objects, people_mentioned, visual_style, error_message, reviewed, reviewed_by, reviewed_at, review_status, review_notes").in("media_url", urls)
    : { data: [] }
  const analysisByUrl = new Map((analyses || []).map((analysis) => [analysis.media_url, analysis]))
  const assets = rows.map((asset) => ({ ...asset, analysis: analysisByUrl.get(asset.file_url) ?? null }))

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
