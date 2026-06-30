import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { TopAd, BottomAd } from "@/components/ad-display"
import { NotablesFeed } from "@/components/notables/notables-feed"
import { getNotables, getNotablesBoards } from "@/app/actions/notables-actions"
import { Rss } from "lucide-react"

export const dynamic = "force-dynamic"

export const metadata = {
  title: "Notables | Qnotables.ai",
  description:
    "Browse the latest QResearch notables scraped from public 8kun board feeds. Search by keyword, filter by board or date.",
}

export default async function NotablesPage() {
  const [{ items, total }, boards] = await Promise.all([
    getNotables({ page: 1, pageSize: 20 }),
    getNotablesBoards(),
  ])

  return (
    <div className="min-h-screen tactical-grid">
      <SiteHeader />
      <TopAd />

      <main className="mx-auto w-full max-w-5xl px-4 py-10 md:px-6 lg:py-14">
        {/* Page header */}
        <header className="mb-8 border-b border-border pb-6">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <div className="mb-2 flex items-center gap-2">
                <Rss className="h-4 w-4 text-primary" />
                <span className="label-mono text-xs font-semibold uppercase text-muted-foreground">
                  Live Feed
                </span>
              </div>
              <h1 className="stencil text-3xl text-foreground md:text-4xl">NOTABLES</h1>
              <p className="label-mono mt-2 text-xs text-muted-foreground">
                QResearch notables from public 8kun board feeds. Updated every 30 minutes.
              </p>
            </div>
            <div className="flex items-center gap-4">
              {total > 0 && (
                <div className="border border-border bg-muted/30 px-4 py-2 text-center">
                  <p className="stencil text-lg text-foreground">{total.toLocaleString()}</p>
                  <p className="label-mono text-[10px] text-muted-foreground">Total Records</p>
                </div>
              )}
              {boards.length > 0 && (
                <div className="border border-border bg-muted/30 px-4 py-2 text-center">
                  <p className="stencil text-lg text-foreground">{boards.length}</p>
                  <p className="label-mono text-[10px] text-muted-foreground">Boards</p>
                </div>
              )}
            </div>
          </div>

          {/* Empty state notice */}
          {total === 0 && (
            <div className="mt-6 border border-dashed border-border bg-muted/20 px-4 py-4 text-sm text-muted-foreground">
              <p className="label-mono">
                No notables have been imported yet. The scraper runs every 30 minutes.
                An admin can also trigger a manual import from the{" "}
                <span className="text-foreground">Dashboard &rsaquo; Scraper</span> page.
              </p>
            </div>
          )}
        </header>

        {/* Feed with search + filters */}
        <NotablesFeed initialItems={items} initialTotal={total} boards={boards} />
      </main>

      <BottomAd />
      <SiteFooter />
    </div>
  )
}
