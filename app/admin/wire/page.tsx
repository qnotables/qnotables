import { redirect } from "next/navigation"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { createClient } from "@/lib/supabase/server"
import { isAdminEmail } from "@/lib/admin"
import { getNews } from "@/lib/rss"
import { categories } from "@/lib/news-data"

export const metadata = {
  title: "Wire Feed Stats | qnotables.ai",
}

export default async function WireStatsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user || !isAdminEmail(user.email)) {
    redirect("/")
  }

  const { featured, topStories, feed, live } = await getNews()
  const allStories = [featured, ...topStories, ...feed]

  // Count stories by category
  const byCategory = categories.map((cat) => ({
    cat,
    count: allStories.filter((s) => s.category === cat).length,
  }))

  const totalReports = allStories.reduce((sum, s) => sum + s.reports, 0)
  const avgReports = allStories.length > 0 ? Math.round(totalReports / allStories.length) : 0

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
            <h1 className="stencil text-xl text-foreground">Wire Feed Stats</h1>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8 md:px-6">
        {/* Feed Status */}
        <div className="mb-8 border border-border bg-card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="label-mono text-muted-foreground">FEED STATUS</p>
              <p className="stencil mt-1 text-2xl text-foreground">
                {live ? "🟢 LIVE" : "🔴 CACHED"}
              </p>
            </div>
            <div className="text-right">
              <p className="label-mono text-muted-foreground">TOTAL STORIES</p>
              <p className="stencil mt-1 text-2xl text-foreground">{allStories.length}</p>
            </div>
            <div className="text-right">
              <p className="label-mono text-muted-foreground">AVG REPORTS</p>
              <p className="stencil mt-1 text-2xl text-foreground">{avgReports}</p>
            </div>
          </div>
        </div>

        {/* By Desk */}
        <div className="mb-8">
          <h2 className="stencil mb-4 text-lg text-foreground">Stories by Desk</h2>
          <div className="space-y-2">
            {byCategory.map(({ cat, count }) => (
              <div
                key={cat}
                className="flex items-center justify-between border border-border bg-card p-3"
              >
                <p className="label-mono text-foreground">{cat}</p>
                <p className="stencil text-primary">{String(count).padStart(2, "0")}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Top Stories */}
        <div>
          <h2 className="stencil mb-4 text-lg text-foreground">Top 10 Stories (by reports)</h2>
          <div className="space-y-2">
            {allStories
              .sort((a, b) => b.reports - a.reports)
              .slice(0, 10)
              .map((s, i) => (
                <div key={s.id} className="flex items-center justify-between border border-border bg-card p-3">
                  <div className="min-w-0 flex-1">
                    <p className="stencil truncate text-foreground">{s.headline}</p>
                    <p className="label-mono text-xs text-muted-foreground">{s.category}</p>
                  </div>
                  <p className="label-mono ml-4 flex-shrink-0 text-primary">{s.reports}</p>
                </div>
              ))}
          </div>
        </div>
      </main>
    </div>
  )
}
