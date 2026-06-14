import Link from "next/link"
import { redirect } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { BlogPostForm } from "@/components/blog-post-form"
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
  if (!isAdminEmail(user.email)) redirect("/blog")

  return (
    <div id="top" className="min-h-screen tactical-grid">
      <SiteHeader />

      <main className="mx-auto max-w-3xl px-4 py-10 md:px-6">
        <Link
          href="/blog/admin"
          className="label-mono mb-8 inline-flex items-center gap-2 text-muted-foreground transition-colors hover:text-primary"
        >
          <ArrowLeft className="h-4 w-4" /> Blog Admin
        </Link>

        <div className="mb-8 flex items-center gap-3">
          <span className="h-2 w-2 bg-primary" />
          <h1 className="stencil text-3xl text-foreground md:text-4xl">New Post</h1>
        </div>

        <BlogPostForm defaultAuthor={user.email?.split("@")[0]} />
      </main>

      <SiteFooter />
    </div>
  )
}
