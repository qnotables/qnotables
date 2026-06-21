import { redirect } from "next/navigation"
import { ArchiveEditor } from "@/components/archive-editor"
import { validateDashboardAccess } from "@/lib/dashboard-auth"

export const dynamic = "force-dynamic"

export const metadata = {
  title: "New Archive — Dashboard",
  description: "Create a new archive post",
}

export default async function NewArchivePage() {
  const hasAccess = await validateDashboardAccess()
  if (!hasAccess) {
    redirect("/dashboard/login")
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border px-6 py-8">
        <h1 className="text-3xl font-bold text-foreground">Create Archive Post</h1>
        <p className="label-mono mt-2 text-sm text-muted-foreground">
          Research threads, source records, videos, documents, and more
        </p>
      </div>

      <div className="px-6 py-8">
        <ArchiveEditor />
      </div>
    </div>
  )
}
