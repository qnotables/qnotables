import { redirect } from "next/navigation"
import Link from "next/link"
import { createAdminClient } from "@/lib/supabase/admin"
import { validateDashboardAccess } from "@/lib/dashboard-auth"
import { PageHeader, StatCard } from "@/components/dashboard/ui"
import { FileText, CheckCircle2, FileEdit, Star } from "lucide-react"

export const dynamic = "force-dynamic"

export const metadata = {
  title: "Posts Analytics — Admin Dashboard",
  description: "View post statistics and analytics.",
}

function BarRow({ label, value, max }: { label: string; value: number; max: number }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0
  return (
    <div className="flex items-center gap-3">
      <span className="label-mono w-32 shrink-0 truncate text-sm text-muted-foreground" title={label}>
        {label}
      </span>
      <div className="h-5 flex-1 overflow-hidden bg-muted">
        <div className="h-full bg-primary" style={{ width: `${pct}%` }} />
      </div>
      <span className="label-mono w-10 shrink-0 text-right text-sm text-foreground">{value}</span>
    </div>
  )
}

export default async function PostsPage() {
  const hasAccess = await validateDashboardAccess()
  if (!hasAccess) redirect("/dashboard/login")

  const admin = createAdminClient()
  const { data } = await admin
    .from("blog_posts")
    .select("id, title, slug, status, category, tag, featured, published, published_at, created_at")
    .order("created_at", { ascending: false })

  const posts = data || []
  const published = posts.filter((p: any) => p.status === "published" || p.published).length
  const drafts = posts.filter((p: any) => p.status === "draft").length
  const featured = posts.filter((p: any) => p.featured).length

  // group by category
  const byCategory = new Map<string, number>()
  for (const p of posts) {
    const key = p.category || p.tag || "Uncategorized"
    byCategory.set(key, (byCategory.get(key) ?? 0) + 1)
  }
  const categories = Array.from(byCategory.entries()).sort((a, b) => b[1] - a[1]).slice(0, 8)
  const maxCat = Math.max(1, ...categories.map(([, v]) => v))

  // group by status
  const byStatus = new Map<string, number>()
  for (const p of posts) {
    const key = p.status || (p.published ? "published" : "draft")
    byStatus.set(key, (byStatus.get(key) ?? 0) + 1)
  }
  const statuses = Array.from(byStatus.entries()).sort((a, b) => b[1] - a[1])
  const maxStatus = Math.max(1, ...statuses.map(([, v]) => v))

  const recent = posts.slice(0, 8)

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Posts Analytics"
        description="A statistical overview of all editorial content."
        breadcrumbs={[{ label: "Posts" }]}
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Total Posts" value={posts.length} icon={FileText} />
        <StatCard label="Published" value={published} icon={CheckCircle2} />
        <StatCard label="Drafts" value={drafts} icon={FileEdit} />
        <StatCard label="Featured" value={featured} icon={Star} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="border border-border bg-card p-6">
          <h2 className="stencil mb-4 text-lg text-foreground">By Category</h2>
          <div className="flex flex-col gap-3">
            {categories.length > 0 ? (
              categories.map(([label, value]) => <BarRow key={label} label={label} value={value} max={maxCat} />)
            ) : (
              <p className="label-mono text-sm text-muted-foreground">No data yet.</p>
            )}
          </div>
        </div>

        <div className="border border-border bg-card p-6">
          <h2 className="stencil mb-4 text-lg text-foreground">By Status</h2>
          <div className="flex flex-col gap-3">
            {statuses.length > 0 ? (
              statuses.map(([label, value]) => <BarRow key={label} label={label} value={value} max={maxStatus} />)
            ) : (
              <p className="label-mono text-sm text-muted-foreground">No data yet.</p>
            )}
          </div>
        </div>
      </div>

      <div className="border border-border bg-card">
        <div className="border-b border-border px-6 py-4">
          <h2 className="stencil text-lg text-foreground">Recent Posts</h2>
        </div>
        <div className="divide-y divide-border">
          {recent.length > 0 ? (
            recent.map((p: any) => (
              <Link
                key={p.id}
                href={`/dashboard/blog/${p.id}/edit`}
                className="flex items-center justify-between px-6 py-3 transition-colors hover:bg-muted/20"
              >
                <span className="truncate font-semibold text-foreground">{p.title}</span>
                <span className="label-mono shrink-0 text-xs text-muted-foreground">{p.status || "draft"}</span>
              </Link>
            ))
          ) : (
            <p className="label-mono px-6 py-4 text-sm text-muted-foreground">No posts yet.</p>
          )}
        </div>
      </div>
    </div>
  )
}
