import Link from "next/link"
import { redirect } from "next/navigation"
import { ArrowLeft, Plus, Pencil, Eye, EyeOff } from "lucide-react"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { BlogDeleteButton } from "@/components/blog-delete-button"
import { createClient } from "@/lib/supabase/server"
import { isAdminEmail } from "@/lib/admin"
import { getAllPostsAdmin, formatDate } from "@/lib/blog-posts"

export const metadata = {
  title: "Blog Admin — Hot and Fresh",
}

export default async function BlogAdminPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect("/auth/login")
  if (!isAdminEmail(user.email)) redirect("/blog")

  const posts = await getAllPostsAdmin()

  return (
    <div id="top" className="min-h-screen tactical-grid">
      <SiteHeader />

      <main className="mx-auto max-w-5xl px-4 py-10 md:px-6">
        <Link
          href="/blog"
          className="label-mono mb-8 inline-flex items-center gap-2 text-muted-foreground transition-colors hover:text-primary"
        >
          <ArrowLeft className="h-4 w-4" /> Field Notes
        </Link>

        <div className="mb-8 flex flex-wrap items-center gap-3">
          <span className="h-2 w-2 bg-primary" />
          <h1 className="stencil text-3xl text-foreground md:text-4xl">Blog Admin</h1>
          <Link
            href="/blog/admin/new"
            className="label-mono ml-auto inline-flex items-center gap-2 bg-primary px-4 py-2.5 font-semibold text-primary-foreground transition-opacity hover:opacity-90"
          >
            <Plus className="h-4 w-4" /> New Post
          </Link>
        </div>

        {posts.length === 0 ? (
          <div className="border border-dashed border-border p-10 text-center">
            <p className="text-muted-foreground">No posts yet.</p>
            <Link
              href="/blog/admin/new"
              className="label-mono mt-4 inline-flex items-center gap-2 text-primary hover:underline"
            >
              <Plus className="h-4 w-4" /> Write your first post
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {posts.map((post) => (
              <div
                key={post.id}
                className="flex flex-col gap-3 border border-border bg-card p-4 sm:flex-row sm:items-center"
              >
                {post.coverImage ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={post.coverImage || "/placeholder.svg"}
                    alt=""
                    className="h-16 w-24 shrink-0 border border-border object-cover"
                  />
                ) : (
                  <div className="flex h-16 w-24 shrink-0 items-center justify-center border border-border bg-muted/30">
                    <span className="label-mono text-muted-foreground">NO ART</span>
                  </div>
                )}

                <div className="min-w-0 flex-1">
                  <div className="label-mono mb-1 flex items-center gap-2 text-primary">
                    <span>{post.tag}</span>
                    <span className="text-muted-foreground">{formatDate(post.date)}</span>
                    {post.published ? (
                      <span className="inline-flex items-center gap-1 text-foreground">
                        <Eye className="h-3 w-3" /> live
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-muted-foreground">
                        <EyeOff className="h-3 w-3" /> draft
                      </span>
                    )}
                  </div>
                  <h2 className="stencil truncate text-lg text-foreground">{post.title}</h2>
                </div>

                <div className="flex items-center gap-2">
                  <Link
                    href={`/blog/admin/${post.id}`}
                    className="flex items-center gap-1 border border-border px-2.5 py-1.5 text-muted-foreground transition-colors hover:border-primary hover:text-primary"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    <span className="label-mono">Edit</span>
                  </Link>
                  <BlogDeleteButton id={post.id!} title={post.title} />
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <SiteFooter />
    </div>
  )
}
