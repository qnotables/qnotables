import { redirect } from "next/navigation"
import { validateDashboardAccess } from "@/lib/dashboard-auth"
import { getScrapeLogs, getScrapedDrafts, getScraperSources } from "@/app/actions/scraper-actions"
import { ScraperRunButton } from "@/components/scraper/scraper-run-button"
import { ScraperDraftsTable } from "@/components/scraper/scraper-drafts-table"
import { ScraperLogs } from "@/components/scraper/scraper-logs"
import { Rss, Globe, FileText, Clock, CheckCircle, AlertTriangle } from "lucide-react"

export const dynamic = "force-dynamic"

export const metadata = {
  title: "Scraper — Dashboard",
  description: "Manage RSS and HTML source ingestion and review scraped drafts",
}

export default async function ScraperPage() {
  const hasAccess = await validateDashboardAccess()
  if (!hasAccess) redirect("/dashboard/login")

  const [logs, drafts, sources] = await Promise.all([
    getScrapeLogs(30),
    getScrapedDrafts(),
    getScraperSources(),
  ])

  const lastRun = logs[0] ?? null
  const totalNewAllTime = logs.reduce((s, l) => s + l.new_posts, 0)
  const rssCount = sources.filter((s) => s.type === "rss").length
  const htmlCount = sources.filter((s) => s.type === "html").length

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border px-6 py-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">SCRAPER</h1>
            <p className="label-mono mt-2 text-sm text-muted-foreground">
              Ingest RSS feeds and public HTML sources. All content is saved as drafts only.
            </p>
          </div>
          <ScraperRunButton sourceCount={sources.length} />
        </div>
      </div>

      {/* Stats row */}
      <div className="border-b border-border px-6 py-6">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div className="border border-border bg-muted/30 p-4">
            <p className="label-mono text-xs font-semibold uppercase text-muted-foreground">
              Sources
            </p>
            <p className="mt-1 text-2xl font-bold text-foreground">{sources.length}</p>
            <p className="label-mono text-xs text-muted-foreground">
              {rssCount} RSS · {htmlCount} HTML
            </p>
          </div>
          <div className="border border-border bg-muted/30 p-4">
            <p className="label-mono text-xs font-semibold uppercase text-muted-foreground">
              Pending Drafts
            </p>
            <p className="mt-1 text-2xl font-bold text-foreground">{drafts.length}</p>
            <p className="label-mono text-xs text-muted-foreground">awaiting review</p>
          </div>
          <div className="border border-border bg-muted/30 p-4">
            <p className="label-mono text-xs font-semibold uppercase text-muted-foreground">
              All-time Imported
            </p>
            <p className="mt-1 text-2xl font-bold text-foreground">{totalNewAllTime}</p>
            <p className="label-mono text-xs text-muted-foreground">posts created</p>
          </div>
          <div className="border border-border bg-muted/30 p-4">
            <p className="label-mono text-xs font-semibold uppercase text-muted-foreground">
              Last Run
            </p>
            {lastRun ? (
              <>
                <p className="mt-1 flex items-center gap-1.5 text-sm font-semibold text-foreground">
                  {lastRun.failed > 0 ? (
                    <AlertTriangle className="h-4 w-4 text-amber-500" />
                  ) : (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  )}
                  {lastRun.failed > 0 ? `${lastRun.failed} failed` : "All OK"}
                </p>
                <p className="label-mono mt-0.5 text-xs text-muted-foreground">
                  {new Date(lastRun.started_at).toLocaleString("en-US", {
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </>
            ) : (
              <p className="label-mono mt-1 text-xs text-muted-foreground">Never run</p>
            )}
          </div>
        </div>
      </div>

      {/* Sources list */}
      <div className="border-b border-border px-6 py-6">
        <h2 className="label-mono mb-3 text-xs font-semibold uppercase text-muted-foreground">
          Configured Sources
        </h2>
        {sources.length === 0 ? (
          <div className="border border-dashed border-border bg-muted/10 px-4 py-6 text-center">
            <p className="label-mono text-sm text-muted-foreground">
              No sources configured yet.
            </p>
            <p className="label-mono mt-1 text-xs text-muted-foreground">
              Edit <code className="text-foreground">lib/scraper/sources.ts</code> to add RSS feeds or HTML pages.
            </p>
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {sources.map((src) => (
              <div
                key={src.url}
                className="flex items-center gap-2 border border-border bg-muted/20 px-3 py-2"
              >
                {src.type === "rss" ? (
                  <Rss className="h-3.5 w-3.5 shrink-0 text-primary" />
                ) : (
                  <Globe className="h-3.5 w-3.5 shrink-0 text-primary" />
                )}
                <span className="label-mono text-xs font-medium text-foreground">
                  {src.name}
                </span>
                <span className="label-mono border border-border px-1.5 py-0.5 text-[10px] uppercase text-muted-foreground">
                  {src.type}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Tabs: Drafts / Logs */}
      <div className="px-6 py-6">
        <div className="flex flex-col gap-8">
          {/* Scraped Drafts */}
          <section>
            <div className="mb-3 flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary" />
              <h2 className="label-mono text-xs font-semibold uppercase text-muted-foreground">
                Scraped Drafts
              </h2>
              {drafts.length > 0 && (
                <span className="label-mono border border-border px-1.5 py-0.5 text-[10px] text-muted-foreground">
                  {drafts.length}
                </span>
              )}
            </div>
            <ScraperDraftsTable initialDrafts={drafts} />
          </section>

          {/* Run Logs */}
          <section>
            <div className="mb-3 flex items-center gap-2">
              <Clock className="h-4 w-4 text-primary" />
              <h2 className="label-mono text-xs font-semibold uppercase text-muted-foreground">
                Run Logs
              </h2>
              {logs.length > 0 && (
                <span className="label-mono border border-border px-1.5 py-0.5 text-[10px] text-muted-foreground">
                  last {logs.length}
                </span>
              )}
            </div>
            <ScraperLogs logs={logs} />
          </section>
        </div>
      </div>
    </div>
  )
}
