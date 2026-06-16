import Link from "next/link"
import { redirect, notFound } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { BlogPostForm } from "@/components/blog-post-form"
import { PostPreviewPanel } from "@/components/post-preview-panel"
import { createClient } from "@/lib/supabase/server"
import { isAdminEmail } from "@/lib/admin"
import { getPostByIdAdmin } from "@/lib/blog-posts"

export const dynamic = "force-dynamic"

export const metadata = {
  title: "Edit Post — Blog Admin",
}

export default async function EditBlogPostPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect("/auth/login")
  if (!isAdminEmail(user.email)) redirect("/archives")

  const post = await getPostByIdAdmin(id)
  if (!post) notFound()

  return (
    <div id="top" className="min-h-screen tactical-grid">
      <SiteHeader />

      <main className="mx-auto max-w-7xl px-4 py-10 md:px-6">
        <div className="mb-8 flex flex-wrap items-center gap-3">
          <Link
            href="/blog/admin"
            className="label-mono inline-flex items-center gap-2 text-muted-foreground transition-colors hover:text-primary"
          >
            <ArrowLeft className="h-4 w-4" /> Admin
          </Link>
          <span className="h-4 w-px bg-border" />
          <span className="h-2 w-2 bg-primary" />
          <h1 className="stencil text-2xl text-foreground md:text-3xl">Edit Dispatch</h1>
          <span className="label-mono ml-2 truncate text-sm text-muted-foreground">
            {post.title}
          </span>
        </div>

        <div className="grid grid-cols-1 gap-8 xl:grid-cols-[1fr_380px]">
          <div>
            <BlogPostForm post={post} />
          </div>

          <div className="hidden xl:block">
            <PostPreviewPanel initialTitle={post.title} initialBody={post.content} />
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  )
}
