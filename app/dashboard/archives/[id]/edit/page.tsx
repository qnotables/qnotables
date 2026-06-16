import { redirect } from "next/navigation"
import { ArchiveEditor } from "@/components/archive-editor"
import { getArchiveForEdit } from "@/lib/archive"
import { validateDashboardAccess } from "@/lib/dashboard-auth"

export const dynamic = "force-dynamic"

export const metadata = {
  title: "Edit Archive — Dashboard",
  description: "Edit archive post",
}

export default async function EditArchivePage({ params }: { params: { id: string } }) {
  const hasAccess = await validateDashboardAccess()
  if (!hasAccess) {
    redirect("/dashboard/login")
  }

  const post = await getArchiveForEdit(params.id)
  if (!post) {
    redirect("/dashboard/archives")
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border px-6 py-8">
        <h1 className="text-3xl font-bold text-foreground">Edit Archive Post</h1>
        <p className="label-mono mt-2 text-sm text-muted-foreground">
          Last updated: {post.updated_at ? new Date(post.updated_at).toLocaleDateString() : "Never"}
        </p>
      </div>

      <div className="px-6 py-8">
        <ArchiveEditor
          initialPost={post}
          onSave={() => {
            // Show success toast or redirect
          }}
          onPublish={() => {
            // Navigate to published post
          }}
        />
      </div>
    </div>
  )
}
