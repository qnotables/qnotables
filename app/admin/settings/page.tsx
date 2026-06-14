import { redirect } from "next/navigation"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { createClient } from "@/lib/supabase/server"
import { isAdminEmail } from "@/lib/admin"

export const metadata = {
  title: "Admin Settings | qnotables.ai",
}

export default async function AdminSettingsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user || !isAdminEmail(user.email)) {
    redirect("/")
  }

  return (
    <div className="min-h-screen tactical-grid bg-background">
      <header className="border-b border-border bg-background/95 backdrop-blur">
        <div className="mx-auto max-w-5xl px-4 py-6 md:px-6">
          <div className="flex items-center gap-4">
            <Link
              href="/admin"
              className="label-mono flex items-center gap-2 text-muted-foreground transition-colors hover:text-primary"
            >
              <ArrowLeft className="h-4 w-4" /> DASHBOARD
            </Link>
            <span className="text-muted-foreground">/</span>
            <h1 className="stencil text-xl text-foreground">Admin Settings</h1>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8 md:px-6">
        <div className="border border-dashed border-border p-8 text-center text-muted-foreground">
          <p className="label-mono">Admin settings coming soon.</p>
          <p className="label-mono mt-2 text-xs">Manage admin users, permissions, and system config here.</p>
        </div>
      </main>
    </div>
  )
}
