import Link from "next/link"
import { redirect } from "next/navigation"
import { ArrowLeft, Plus, Pencil, Eye, EyeOff, Filter } from "lucide-react"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { BlogDeleteButton } from "@/components/blog-delete-button"
import { createClient } from "@/lib/supabase/server"
import { isAdminEmail } from "@/lib/admin"
import { getAllPostsAdmin, formatDate } from "@/lib/blog-posts"

export const metadata = {
  title: "Blog Admin — Hot and Fresh",
}

interface BlogAdminPageProps {
  searchParams: Promise<{
    status?: string
    category?: string
    tag?: string
    sort?: string
  }>
}

export default async function BlogAdminPage({ searchParams }: BlogAdminPageProps) {
  const params = await searchParams
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect("/auth/login")
  if (!isAdminEmail(user.email)) redirect("/blog")

  let posts = await getAllPostsAdmin()

  // Ensure posts is always an array
  if (!Array.isArray(posts)) {
    posts = []
  }

  // Filter by status if specified
  if (params.status) {
    posts = posts.filter((p) => p.status === params.status)
  }

  // Filter by category if specified
  if (params.category) {
    posts = posts.filter((p) => p.category === params.category)
  }

  // Filter by tag if specified
  if (params.tag) {
    posts = posts.filter((p) => p.tags?.includes(params.tag!))
  }

  // Sort by date (newest first is default, or by title)
  if (params.sort === "title") {
    posts.sort((a, b) => a.title.localeCompare(b.title))
  }

  // Get unique categories and tags for filter UI
  const categories = Array.from(new Set(posts.map((p) => p.category).filter(Boolean)))
  const allTags = Array.from(new Set(posts.flatMap((p) => p.tags || [])))

  const statusOptions = [
    { value: "draft", label: "Draft" },
    { value: "published", label: "Published" },
    { value: "scheduled", label: "Scheduled" },
    { value: "hidden", label: "Hidden" },
    { value: "archived", label: "Archived" },
  ]

  return (
    <div id="top" className="min-h-screen tactical-grid">
      <SiteHeader />

      <main className="mx-auto max-w-6xl px-4 py-10 md:px-6">
        <Link
          href="/blog"
          className="label-mono mb-8 inline-flex items-center gap-2 text-muted-foreground transition-colors hover:text-primary"
        >
          <ArrowLeft className="h-4 w-4" /> Archives
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

        {/* Filters */}
        <div className="mb-6 flex flex-wrap gap-3 border-b border-border pb-4">
          <Filter className="h-5 w-5 text-muted-foreground" />

          <form method="GET" className="contents">
            {/* Status Filter */}
            <select
              name="status"
              defaultValue={params.status || ""}
              className="label-mono border border-border bg-background px-2.5 py-1.5 text-sm text-foreground"
              onChange={(e) => e.target.form?.submit()}
            >
              <option value="">All Status</option>
              {statusOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>

            {/* Category Filter */}
            {categories.length > 0 && (
              <select
                name="category"
                defaultValue={params.category || ""}
                className="label-mono border border-border bg-background px-2.5 py-1.5 text-sm text-foreground"
                onChange={(e) => e.target.form?.submit()}
              >
                <option value="">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            )}

            {/* Tag Filter */}
            {allTags.length > 0 && (
              <select
                name="tag"
                defaultValue={params.tag || ""}
                className="label-mono border border-border bg-background px-2.5 py-1.5 text-sm text-foreground"
                onChange={(e) => e.target.form?.submit()}
              >
                <option value="">All Tags</option>
                {allTags.map((tag) => (
                  <option key={tag} value={tag}>
                    {tag}
                  </option>
                ))}
              </select>
            )}

            {/* Sort */}
            <select
              name="sort"
              defaultValue={params.sort || "date"}
              className="label-mono ml-auto border border-border bg-background px-2.5 py-1.5 text-sm text-foreground"
              onChange={(e) => e.target.form?.submit()}
            >
              <option value="date">Date (Newest)</option>
              <option value="title">Title (A-Z)</option>
            </select>
          </form>
        </div>

        {posts.length === 0 ? (
          <div className="border border-dashed border-border p-10 text-center">
            <p className="text-muted-foreground">
              {params.status || params.category || params.tag
                ? "No posts match these filters."
                : "No posts yet."}
            </p>
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
                  <div className="label-mono mb-1 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                    <span className="text-primary">{post.tag}</span>
                    {post.category && (
                      <>
                        <span>•</span>
                        <span>{post.category}</span>
                      </>
                    )}
                    {post.postType && (
                      <>
                        <span>•</span>
                        <span>{post.postType}</span>
                      </>
                    )}
                    <span>•</span>
                    <span>{formatDate(post.date)}</span>
                    {post.status === "published" ? (
                      <span className="inline-flex items-center gap-1 text-foreground">
                        <Eye className="h-3 w-3" /> live
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1">
                        <EyeOff className="h-3 w-3" /> {post.status}
                      </span>
                    )}
                    {post.featured && (
                      <span className="rounded bg-primary/20 px-1.5 text-primary">★ Featured</span>
                    )}
                  </div>
                  <h2 className="stencil truncate text-lg text-foreground">{post.title}</h2>
                  {post.subtitle && (
                    <p className="mt-0.5 line-clamp-1 text-sm text-muted-foreground">{post.subtitle}</p>
                  )}
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
