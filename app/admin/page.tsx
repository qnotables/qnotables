import { redirect } from "next/navigation"
import Link from "next/link"
import { ArrowRight, BarChart3, MessageSquare, BookOpen, Lock, Megaphone } from "lucide-react"
import { createClient } from "@/lib/supabase/server"
import { isAdminEmail } from "@/lib/admin"

export const metadata = {
  title: "Editorial Dashboard | qnotables.ai",
}

async function getStats() {
  const supabase = await createClient()

  const [threadsResult, repliesResult, postsResult] = await Promise.all([
    supabase.from("forum_threads").select("count", { count: "exact" }),
    supabase.from("forum_replies").select("count", { count: "exact" }),
    supabase.from("blog_posts").select("count", { count: "exact" }).eq("published", true),
  ])

  return {
    threads: threadsResult.count ?? 0,
    replies: repliesResult.count ?? 0,
    blogPosts: postsResult.count ?? 0,
  }
}

export default async function AdminPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user || !isAdminEmail(user.email)) {
    redirect("/")
  }

  const stats = await getStats()

  return (
    <div className="min-h-screen tactical-grid bg-background">
      <header className="border-b border-border bg-background/95 backdrop-blur">
        <div className="mx-auto max-w-5xl px-4 py-6 md:px-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="stencil text-3xl text-foreground">Editorial Dashboard</h1>
              <p className="label-mono mt-1 text-muted-foreground">// ADMIN CONTROLS</p>
            </div>
            <Link
              href="/"
              className="label-mono flex items-center gap-2 border border-border px-3 py-2 text-muted-foreground transition-colors hover:border-primary hover:text-primary"
            >
              Exit <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8 md:px-6">
        {/* Welcome */}
        <div className="mb-8">
          <p className="label-mono text-muted-foreground">
            Welcome back, <span className="text-foreground">{user.email}</span>
          </p>
        </div>

        {/* Stats Grid */}
        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="border border-border bg-card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="label-mono text-muted-foreground">FORUM THREADS</p>
                <p className="stencil mt-2 text-2xl text-foreground">{stats.threads}</p>
              </div>
              <MessageSquare className="h-8 w-8 text-primary opacity-50" />
            </div>
          </div>

          <div className="border border-border bg-card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="label-mono text-muted-foreground">FORUM REPLIES</p>
                <p className="stencil mt-2 text-2xl text-foreground">{stats.replies}</p>
              </div>
              <MessageSquare className="h-8 w-8 text-primary opacity-50" />
            </div>
          </div>

          <div className="border border-border bg-card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="label-mono text-muted-foreground">PUBLISHED POSTS</p>
                <p className="stencil mt-2 text-2xl text-foreground">{stats.blogPosts}</p>
              </div>
              <BookOpen className="h-8 w-8 text-primary opacity-50" />
            </div>
          </div>
        </div>

        {/* Admin Sections */}
        <div className="space-y-6">
          <div>
            <h2 className="stencil mb-4 text-lg text-foreground">Moderation & Management</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {/* Forum Moderation */}
              <Link
                href="/admin/forum"
                className="group border border-border bg-card p-6 transition-colors hover:border-primary"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="stencil text-foreground group-hover:text-primary">
                      Forum Moderation
                    </h3>
                    <p className="label-mono mt-2 text-sm text-muted-foreground">
                      Review threads, manage replies, user actions
                    </p>
                  </div>
                  <ArrowRight className="h-5 w-5 text-muted-foreground transition-colors group-hover:text-primary" />
                </div>
              </Link>

              {/* Archives Management */}
              <Link
                href="/archives/admin"
                className="group border border-border bg-card p-6 transition-colors hover:border-primary"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="stencil text-foreground group-hover:text-primary">
                      Archives Management
                    </h3>
                    <p className="label-mono mt-2 text-sm text-muted-foreground">
                      Create, edit, publish field notes and research
                    </p>
                  </div>
                  <ArrowRight className="h-5 w-5 text-muted-foreground transition-colors group-hover:text-primary" />
                </div>
              </Link>

              {/* Wire Feed Stats */}
              <Link
                href="/admin/wire"
                className="group border border-border bg-card p-6 transition-colors hover:border-primary"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="stencil text-foreground group-hover:text-primary">
                      Wire Feed Stats
                    </h3>
                    <p className="label-mono mt-2 text-sm text-muted-foreground">
                      View RSS categorization, desk performance
                    </p>
                  </div>
                  <ArrowRight className="h-5 w-5 text-muted-foreground transition-colors group-hover:text-primary" />
                </div>
              </Link>

              {/* Settings */}
              <Link
                href="/admin/settings"
                className="group border border-border bg-card p-6 transition-colors hover:border-primary"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="stencil text-foreground group-hover:text-primary">Settings</h3>
                    <p className="label-mono mt-2 text-sm text-muted-foreground">
                      Admin users, permissions, config
                    </p>
                  </div>
                  <ArrowRight className="h-5 w-5 text-muted-foreground transition-colors group-hover:text-primary" />
                </div>
              </Link>

              {/* Ad Management */}
              <Link
                href="/admin/ads"
                className="group border border-border bg-card p-6 transition-colors hover:border-primary"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="stencil text-foreground group-hover:text-primary">
                      Ad Management
                    </h3>
                    <p className="label-mono mt-2 text-sm text-muted-foreground">
                      Create, edit, and manage promotional banners
                    </p>
                  </div>
                  <ArrowRight className="h-5 w-5 text-muted-foreground transition-colors group-hover:text-primary" />
                </div>
              </Link>
            </div>
          </div>
        </div>

        {/* Footer Note */}
        <div className="mt-12 border-t border-border pt-6">
          <p className="label-mono flex items-center gap-2 text-muted-foreground">
            <Lock className="h-4 w-4" /> Admin-only area. All actions are logged.
          </p>
        </div>
      </main>
    </div>
  )
}
