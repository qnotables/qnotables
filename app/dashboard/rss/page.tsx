import { redirect } from "next/navigation"
import { validateDashboardAccess } from "@/lib/dashboard-auth"
import { createAdminClient } from "@/lib/supabase/admin"
import { getRssPolicy } from "@/lib/rss"
import { PageHeader, StatCard } from "@/components/dashboard/ui"
import { RssControls } from "@/components/dashboard/rss-controls"
import { RssDiagnostics } from "@/components/dashboard/rss-diagnostics"
import { RssImportButton } from "@/components/rss-import-button"
import {
  getFeedItems,
  validateRssItems,
  getSiteUrl,
  isSiteUrlConfigured,
} from "@/lib/rss-utils"
import {
  Rss,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ImageOff,
  CalendarX,
} from "lucide-react"

export const dynamic = "force-dynamic"

export const metadata = {
  title: "RSS Feed — Admin Dashboard",
  description: "Diagnostics for the public RSS feed.",
}

export default async function RssPage() {
  const hasAccess = await validateDashboardAccess()
  if (!hasAccess) redirect("/dashboard/login")

  const siteUrl = getSiteUrl()
  const feedUrl = `${siteUrl}/feed.xml`
  const siteConfigured = isSiteUrlConfigured()

  const db = createAdminClient()
  const [{ data: sourceRows }, { data: reviewRows }] = await Promise.all([
    db
      .from("rss_sources")
      .select("source_key, name, feed_url, enabled, last_fetched_at, last_success_at, last_error, item_count")
      .order("name", { ascending: true }),
    db
      .from("rss_items")
      .select("id, title, source_name, primary_category, review_status, manual_lock, published_at")
      .order("created_at", { ascending: false })
      .limit(12),
  ])
  const policy = await getRssPolicy()
  const items = await getFeedItems(50)
  const validation = validateRssItems(items)

  const latestIso = items.find((i) => i.pubDateIso)?.pubDateIso
  const lastGenerated = latestIso
    ? new Date(latestIso).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" })
    : "—"

  const missingImages = items.filter((i) => i.imageSource === "fallback")
  const invalidDates = items.filter((i) => !i.pubDateIso)

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="RSS Feed"
        description="Status, validation, and diagnostics for the public feed."
        breadcrumbs={[{ label: "RSS Feed" }]}
      />

      {!siteConfigured && (
        <div className="flex items-start gap-3 border border-amber-500/40 bg-amber-500/10 p-4">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-500" />
          <div>
            <p className="label-mono text-sm font-semibold text-amber-500">
              NEXT_PUBLIC_SITE_URL is not configured
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              RSS links and images may not resolve correctly. Set{" "}
              <code className="text-foreground">NEXT_PUBLIC_SITE_URL</code> in your project
              environment variables. Falling back to <code className="text-foreground">{siteUrl}</code>.
            </p>
          </div>
        </div>
      )}

      {/* Status cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Feed Status"
          value={validation.valid ? "Valid" : "Errors"}
          icon={validation.valid ? CheckCircle2 : XCircle}
        />
        <StatCard label="Published Items" value={validation.itemCount} icon={Rss} />
        <StatCard label="Errors" value={validation.errors.length} icon={XCircle} />
        <StatCard label="Warnings" value={validation.warnings.length} icon={AlertTriangle} />
      </div>

      {/* Diagnostics + copy URL */}
      <RssDiagnostics feedUrl={feedUrl} />

      <RssControls
        sources={(sourceRows ?? []).map((source) => ({
          source_key: source.source_key,
          name: source.name,
          feed_url: source.feed_url,
          enabled: source.enabled,
          last_fetched_at: source.last_fetched_at,
          last_success_at: source.last_success_at,
          last_error: source.last_error,
          item_count: source.item_count,
        }))}
        policy={policy}
        reviewItems={(reviewRows ?? []).map((item) => ({
          id: item.id,
          title: item.title,
          source_name: item.source_name,
          primary_category: item.primary_category,
          review_status: item.review_status === "approved" || item.review_status === "rejected" ? item.review_status : "moderation",
          manual_lock: item.manual_lock,
          published_at: item.published_at,
        }))}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="border border-border bg-card p-4">
          <p className="label-mono text-[11px] uppercase text-muted-foreground">Last Generated</p>
          <p className="mt-2 text-sm text-foreground">{lastGenerated}</p>
        </div>
        <div className="border border-border bg-card p-4">
          <p className="label-mono text-[11px] uppercase text-muted-foreground">Last Validation</p>
          <p className="mt-2 text-sm text-foreground">
            {new Date(validation.lastChecked).toLocaleString("en-US", {
              dateStyle: "medium",
              timeStyle: "short",
            })}
          </p>
        </div>
        <div className="border border-border bg-card p-4">
          <p className="label-mono text-[11px] uppercase text-muted-foreground">Missing Images</p>
          <p className="mt-2 text-sm text-foreground">{missingImages.length}</p>
        </div>
      </div>

      {/* Errors */}
      {validation.errors.length > 0 && (
        <section className="border border-destructive/40 bg-destructive/5 p-4">
          <h2 className="label-mono mb-3 flex items-center gap-2 text-sm font-semibold text-destructive">
            <XCircle className="h-4 w-4" /> Errors ({validation.errors.length})
          </h2>
          <ul className="flex flex-col gap-1 text-sm text-muted-foreground">
            {validation.errors.map((err, i) => (
              <li key={i} className="border-l-2 border-destructive/50 pl-3">
                {err}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Warnings */}
      {validation.warnings.length > 0 && (
        <section className="border border-amber-500/30 bg-amber-500/5 p-4">
          <h2 className="label-mono mb-3 flex items-center gap-2 text-sm font-semibold text-amber-500">
            <AlertTriangle className="h-4 w-4" /> Warnings ({validation.warnings.length})
          </h2>
          <ul className="flex max-h-64 flex-col gap-1 overflow-y-auto text-sm text-muted-foreground">
            {validation.warnings.map((warn, i) => (
              <li key={i} className="border-l-2 border-amber-500/40 pl-3">
                {warn}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Special warning panels */}
      {(missingImages.length > 0 || invalidDates.length > 0) && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {missingImages.length > 0 && (
            <section className="border border-border bg-card p-4">
              <h3 className="label-mono mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
                <ImageOff className="h-4 w-4 text-amber-500" /> Default Image Used ({missingImages.length})
              </h3>
              <ul className="flex flex-col gap-1 text-sm text-muted-foreground">
                {missingImages.slice(0, 10).map((item) => (
                  <li key={item.id} className="truncate">
                    {item.title}
                  </li>
                ))}
              </ul>
            </section>
          )}
          {invalidDates.length > 0 && (
            <section className="border border-border bg-card p-4">
              <h3 className="label-mono mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
                <CalendarX className="h-4 w-4 text-amber-500" /> Invalid / Missing Dates ({invalidDates.length})
              </h3>
              <ul className="flex flex-col gap-1 text-sm text-muted-foreground">
                {invalidDates.slice(0, 10).map((item) => (
                  <li key={item.id} className="truncate">
                    {item.title}
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      )}

      {/* Recent feed items */}
      <section>
        <h2 className="stencil mb-4 text-lg text-foreground">Recent Feed Items</h2>
        {items.length === 0 ? (
          <div className="border border-border bg-card p-6 text-center text-sm text-muted-foreground">
            No published RSS-eligible records found. The feed is currently empty but valid.
          </div>
        ) : (
          <div className="overflow-x-auto border border-border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30 text-left">
                  <th className="px-4 py-3 font-semibold">Title</th>
                  <th className="px-4 py-3 font-semibold">Category</th>
                  <th className="px-4 py-3 font-semibold">Published</th>
                  <th className="px-4 py-3 font-semibold">Image</th>
                  <th className="px-4 py-3 font-semibold">Flags</th>
                  <th className="px-4 py-3 font-semibold">Town Hall</th>
                </tr>
              </thead>
              <tbody>
                {items.slice(0, 20).map((item) => (
                  <tr key={item.id} className="border-b border-border hover:bg-muted/20">
                    <td className="px-4 py-3">
                      <span className="font-semibold text-foreground">{item.title}</span>
                      <span className="label-mono block text-xs text-muted-foreground">/{item.slug}</span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{item.category}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {item.pubDateIso
                        ? new Date(item.pubDateIso).toLocaleDateString("en-US", { dateStyle: "medium" } as Intl.DateTimeFormatOptions)
                        : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <span className="label-mono text-xs text-muted-foreground">{item.imageSource}</span>
                    </td>
                    <td className="px-4 py-3">
                      {item.warnings.length > 0 ? (
                        <span className="label-mono inline-flex items-center gap-1 text-xs text-amber-500">
                          <AlertTriangle className="h-3 w-3" /> {item.warnings.length}
                        </span>
                      ) : (
                        <span className="label-mono inline-flex items-center gap-1 text-xs text-primary">
                          <CheckCircle2 className="h-3 w-3" /> ok
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <RssImportButton
                        title={item.title}
                        content={item.contentSnippet || item.description}
                        sourceUrl={item.sourceUrl || item.link}
                        sourceName={item.sourceName}
                        author={item.author}
                        publishedAt={item.pubDateIso}
                        imageUrl={item.imageUrl}
                        category={item.category}
                        tags={item.tags}
                        isLoggedIn={true}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}
