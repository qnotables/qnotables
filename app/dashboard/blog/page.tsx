import { redirect } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Plus, Pencil, Eye, EyeOff, Trash2 } from "lucide-react"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { BlogDeleteButton } from "@/components/blog-delete-button"
import { validateDashboardAccess } from "@/lib/dashboard-auth"
import { getAllPostsAdmin, formatDate } from "@/lib/blog-posts"

export const metadata = {
  title: "Blog Management — Admin Dashboard",
  description: "Create, edit, and manage blog posts.",
}

export default async function BlogDashboardPage() {
  const hasAccess = await validateDashboardAccess()
  if (!hasAccess) {
    redirect("/dashboard/login")
  }

  const posts = await getAllPostsAdmin()
  const postArray = Array.isArray(posts) ? posts : []

  return (
    <>
      <SiteHeader />
      <main className="min-h-screen bg-background">
        <div className="mx-auto max-w-7xl px-4 py-8 md:px-6 md:py-12">
          <Link
            href="/dashboard"
            className="label-mono mb-8 inline-flex items-center gap-2 text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Link>

          {/* Header */}
          <div className="mb-8 flex items-center justify-between border-b border-border pb-6">
            <div>
              <h1 className="stencil mb-2 text-3xl text-foreground">Blog Management</h1>
              <p className="label-mono text-muted-foreground">
                Manage {postArray.length} {postArray.length === 1 ? "post" : "posts"}
              </p>
            </div>
            <Link
              href="/blog/admin/new"
              className="label-mono flex items-center gap-2 bg-primary px-4 py-2 font-semibold text-primary-foreground transition-opacity hover:opacity-90"
            >
              <Plus className="h-4 w-4" />
              New Post
            </Link>
          </div>

          {/* Posts Table */}
          {postArray.length > 0 ? (
            <div className="overflow-x-auto border border-border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="px-4 py-3 text-left font-semibold">Title</th>
                    <th className="px-4 py-3 text-left font-semibold">Status</th>
                    <th className="px-4 py-3 text-left font-semibold">Category</th>
                    <th className="px-4 py-3 text-left font-semibold">Published</th>
                    <th className="px-4 py-3 text-right font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {postArray.map((post) => (
                    <tr key={post.id} className="border-b border-border hover:bg-muted/20">
                      <td className="px-4 py-3">
                        <Link
                          href={`/blog/${post.slug}`}
                          className="font-semibold text-primary hover:underline"
                        >
                          {post.title}
                        </Link>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`label-mono inline-block px-2 py-1 text-xs font-semibold ${
                            post.status === "published"
                              ? "bg-green-100/20 text-green-700"
                              : "bg-yellow-100/20 text-yellow-700"
                          }`}
                        >
                          {post.status || "draft"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {post.category || "—"}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {post.published_at ? formatDate(post.published_at) : "Not published"}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            href={`/blog/admin/${post.id}`}
                            className="inline-flex items-center gap-1 rounded px-2 py-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                            title="Edit post"
                          >
                            <Pencil className="h-4 w-4" />
                          </Link>
                          <Link
                            href={`/blog/${post.slug}`}
                            className="inline-flex items-center gap-1 rounded px-2 py-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                            title="View post"
                          >
                            <Eye className="h-4 w-4" />
                          </Link>
                          <BlogDeleteButton postId={post.id} postTitle={post.title} />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="border border-border bg-card p-8 text-center">
              <h2 className="mb-2 text-lg font-semibold text-muted-foreground">No posts yet</h2>
              <p className="mb-4 text-muted-foreground">Create your first blog post to get started.</p>
              <Link
                href="/blog/admin/new"
                className="label-mono inline-flex items-center gap-2 bg-primary px-4 py-2 font-semibold text-primary-foreground transition-opacity hover:opacity-90"
              >
                <Plus className="h-4 w-4" />
                Create First Post
              </Link>
            </div>
          )}
        </div>
      </main>
      <SiteFooter />
    </>
  )
}
