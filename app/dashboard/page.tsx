import { redirect } from "next/navigation"
import Link from "next/link"
import {
  BookOpen,
  FileText,
  FileEdit,
  Archive,
  MessageSquare,
  MessagesSquare,
  ShieldAlert,
  Users,
  Rss,
  Megaphone,
  ShoppingCart,
  ImageIcon,
  Plus,
  Upload,
  PlusCircle,
  Music,
} from "lucide-react"
import { validateDashboardAccess } from "@/lib/dashboard-auth"
import { getDashboardStats, getRecentActivity } from "@/lib/dashboard-data"
import { getAllPostsAdmin, formatDate } from "@/lib/blog-posts"
import { PageHeader, StatCard } from "@/components/dashboard/ui"
import { StatusBadge } from "@/components/dashboard/ui"

export const metadata = {
  title: "Overview — Control Room",
  description: "Admin overview for HOT AND FRESH.",
}

const QUICK_ACTIONS = [
  { label: "New Blog Post", href: "/dashboard/blog/new", icon: Plus },
  { label: "Import Archive", href: "/dashboard/import", icon: Upload },
  { label: "New Forum Thread", href: "/dashboard/forum", icon: MessageSquare },
  { label: "Upload Media", href: "/dashboard/media", icon: ImageIcon },
  { label: "Create Ad", href: "/dashboard/ads", icon: Megaphone },
  { label: "Add Product", href: "/dashboard/shop", icon: PlusCircle },
  { label: "Upload Audio", href: "/dashboard/audio", icon: Music },
]

export default async function DashboardPage() {
  const hasAccess = await validateDashboardAccess()
  if (!hasAccess) redirect("/dashboard/login")

  const [stats, activity, posts] = await Promise.all([
    getDashboardStats(),
    getRecentActivity(6),
    getAllPostsAdmin(),
  ])

  const latestPublished = posts.filter((p) => p.status === "published").slice(0, 5)
  const drafts = posts.filter((p) => p.status === "draft").slice(0, 5)

  return (
    <div className="mx-auto max-w-7xl">
      <PageHeader
        title="Overview"
        description="Control room for the entire HOT AND FRESH operation."
      />

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        <StatCard label="Total Posts" value={stats.totalPosts} icon={BookOpen} href="/dashboard/blog" />
        <StatCard label="Published" value={stats.publishedPosts} icon={FileText} href="/dashboard/blog" />
        <StatCard label="Drafts" value={stats.draftPosts} icon={FileEdit} href="/dashboard/blog" />
        <StatCard label="Archived" value={stats.archivedPosts} icon={Archive} href="/dashboard/archives" />
        <StatCard label="Forum Threads" value={stats.forumThreads} icon={MessageSquare} href="/dashboard/forum" />
        <StatCard label="Forum Replies" value={stats.forumReplies} icon={MessagesSquare} href="/dashboard/forum" />
        <StatCard label="Flagged Items" value={stats.flaggedItems} icon={ShieldAlert} href="/dashboard/moderation" />
        <StatCard label="Users" value={stats.registeredUsers} icon={Users} href="/dashboard/users" />
        <StatCard label="Active Ads" value={stats.activeAds} icon={Megaphone} href="/dashboard/ads" />
        <StatCard label="Shop Products" value={stats.shopProducts} icon={ShoppingCart} href="/dashboard/shop" />
        <StatCard label="Media Assets" value={stats.mediaAssets} icon={ImageIcon} href="/dashboard/media" />
        <StatCard label="Audio Tracks" value="Manage" icon={Music} href="/dashboard/audio" />
        <StatCard label="RSS Feed" value="Live" icon={Rss} href="/dashboard/rss" />
      </div>

      {/* Quick actions */}
      <div className="mt-8">
        <h2 className="stencil mb-3 text-lg text-foreground">Quick Actions</h2>
        <div className="flex flex-wrap gap-2">
          {QUICK_ACTIONS.map((a) => {
            const Icon = a.icon
            return (
              <Link
                key={a.href + a.label}
                href={a.href}
                className="label-mono inline-flex items-center gap-2 border border-border bg-card px-3 py-2 text-sm text-muted-foreground transition-colors hover:border-primary hover:text-foreground"
              >
                <Icon className="h-4 w-4 text-primary" />
                {a.label}
              </Link>
            )
          })}
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Latest published */}
        <section className="border border-border bg-card">
          <div className="border-b border-border px-4 py-3">
            <h2 className="stencil text-sm text-foreground">Latest Published</h2>
          </div>
          <ul className="divide-y divide-border">
            {latestPublished.length === 0 ? (
              <li className="label-mono px-4 py-6 text-sm text-muted-foreground">No published posts.</li>
            ) : (
              latestPublished.map((p) => (
                <li key={p.id} className="px-4 py-3">
                  <Link href={`/blog/${p.slug}`} className="text-sm font-semibold text-foreground hover:text-primary">
                    {p.title}
                  </Link>
                  <p className="label-mono mt-1 text-[11px] text-muted-foreground">
                    {p.publishedAt ? formatDate(p.publishedAt) : "—"}
                  </p>
                </li>
              ))
            )}
          </ul>
        </section>

        {/* Drafts needing review */}
        <section className="border border-border bg-card">
          <div className="border-b border-border px-4 py-3">
            <h2 className="stencil text-sm text-foreground">Drafts Needing Review</h2>
          </div>
          <ul className="divide-y divide-border">
            {drafts.length === 0 ? (
              <li className="label-mono px-4 py-6 text-sm text-muted-foreground">No drafts.</li>
            ) : (
              drafts.map((p) => (
                <li key={p.id} className="flex items-center justify-between px-4 py-3">
                  <Link
                    href={`/dashboard/blog/${p.id}/edit`}
                    className="text-sm font-semibold text-foreground hover:text-primary"
                  >
                    {p.title}
                  </Link>
                  <StatusBadge status="draft" />
                </li>
              ))
            )}
          </ul>
        </section>

        {/* Recent activity */}
        <section className="border border-border bg-card">
          <div className="border-b border-border px-4 py-3">
            <h2 className="stencil text-sm text-foreground">Recent Activity</h2>
          </div>
          <ul className="divide-y divide-border">
            {activity.length === 0 ? (
              <li className="label-mono px-4 py-6 text-sm text-muted-foreground">
                No activity logged yet.
              </li>
            ) : (
              activity.map((a) => (
                <li key={a.id} className="px-4 py-3">
                  <p className="text-sm text-foreground">
                    <span className="font-semibold">{a.actor_label ?? "Admin"}</span> {a.action}
                  </p>
                  <p className="label-mono mt-1 text-[11px] text-muted-foreground">
                    {formatDate(a.created_at)}
                    {a.target_type ? ` · ${a.target_type}` : ""}
                  </p>
                </li>
              ))
            )}
          </ul>
        </section>
      </div>
    </div>
  )
}
