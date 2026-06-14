import Link from "next/link"
import { redirect } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { BlogPostForm } from "@/components/blog-post-form"
import { PostPreviewPanel } from "@/components/post-preview-panel"
import { createClient } from "@/lib/supabase/server"
import { isAdminEmail } from "@/lib/admin"

export const metadata = {
  title: "New Post — Blog Admin",
}

export default async function NewBlogPostPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect("/auth/login")
  if (!isAdminEmail(user.email)) redirect("/archives")

  return (
    <div id="top" className="min-h-screen tactical-grid">
      <SiteHeader />

      <main className="mx-auto max-w-7xl px-4 py-10 md:px-6">
        {/* Header row */}
        <div className="mb-8 flex flex-wrap items-center gap-3">
          <Link
            href="/blog/admin"
            className="label-mono inline-flex items-center gap-2 text-muted-foreground transition-colors hover:text-primary"
          >
            <ArrowLeft className="h-4 w-4" /> Admin
          </Link>
          <span className="h-4 w-px bg-border" />
          <span className="h-2 w-2 bg-primary" />
          <h1 className="stencil text-2xl text-foreground md:text-3xl">New Dispatch</h1>
          <span className="label-mono ml-auto text-sm text-muted-foreground">
            Fields marked optional can be filled later.
          </span>
        </div>

        {/* Two-column layout: form | preview */}
        <div className="grid grid-cols-1 gap-8 xl:grid-cols-[1fr_380px]">
          <div>
            <BlogPostForm defaultAuthor={user.email?.split("@")[0]} />
          </div>

          {/* Preview panel — hidden on small screens, sticky on large */}
          <div className="hidden xl:block">
            <PostPreviewPanel />
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  )
}
