import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { TopAd, BottomAd } from "@/components/ad-display"
import { NotablesFeed } from "@/components/notables/notables-feed"
import { getNotables, getNotablesBoards } from "@/app/actions/notables-actions"
import { Rss } from "lucide-react"
import { JsonLd } from "@/components/json-ld"
import { collectionSchema, pageMetadata } from "@/lib/seo"

const description = "Browse the latest QResearch notables imported from Qnotables.com. Search by keyword, tag, or date."

export const dynamic = "force-dynamic"

export const metadata = pageMetadata({ title: "Notables", description, path: "/notables" })

export default async function NotablesPage() {
  const [result, boards] = await Promise.all([
    getNotables({ page: 1, pageSize: 20 }),
    getNotablesBoards(),
  ])
  const { items, total, error } = result

  return (
    <div className="min-h-screen tactical-grid">
      <JsonLd data={collectionSchema("QNotables Notables", description, "/notables")} />
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
                QResearch notables imported from Qnotables.com. Updated daily.
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

          {/* Availability / empty-state notice */}
          {error ? (
            <div role="status" className="mt-6 border border-primary/40 bg-primary/10 px-4 py-4 text-sm text-foreground">
              <p className="label-mono font-semibold">FEED TEMPORARILY UNAVAILABLE</p>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{error}</p>
            </div>
          ) : total === 0 ? (
            <div className="mt-6 border border-dashed border-border bg-muted/20 px-4 py-4 text-sm text-muted-foreground">
              <p className="label-mono">
                No notables have been imported yet. The scraper runs daily from the configured source.
                An admin can also trigger a manual import from the{" "}
                <span className="text-foreground">Dashboard &rsaquo; Scraper</span> page.
              </p>
            </div>
          ) : null}
        </header>

        {/* Feed with search + filters */}
        <NotablesFeed initialItems={items} initialTotal={total} boards={boards} />
      </main>

      <BottomAd />
      <SiteFooter />
    </div>
  )
}
