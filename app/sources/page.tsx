import type { Metadata } from "next"
import Link from "next/link"
import { ArrowUpRight, Radio } from "lucide-react"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { SourcesDirectory } from "@/components/sources-directory"
import { getConfiguredRssSources } from "@/lib/rss"
import { pageMetadata } from "@/lib/seo"

export const metadata: Metadata = pageMetadata({
  title: "Sources | QNotables",
  description: "Browse the monitored reporting, public records, government releases, and independent media sources tracked by QNotables.",
  path: "/sources",
})

export const dynamic = "force-dynamic"

export default async function SourcesPage() {
  const sources = await getConfiguredRssSources()

  return (
    <div id="top" className="min-h-screen tactical-grid">
      <SiteHeader />
      <main className="mx-auto flex max-w-7xl flex-col gap-10 px-4 py-12 md:px-6 md:py-16">
        <header className="max-w-3xl">
          <p className="label-mono text-primary">QNOTABLES / SOURCE DESK</p>
          <h1 className="stencil mt-2 text-5xl text-foreground md:text-6xl">Monitored Sources</h1>
          <p className="mt-5 text-base leading-7 text-muted-foreground">Reporting, public records, government releases, and independent media tracked for the QNotables signal desk.</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/" className="inline-flex items-center gap-2 border border-primary bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90">Back to the signal <ArrowUpRight className="size-4" aria-hidden="true" /></Link>
            <Link href="/about" className="inline-flex items-center gap-2 border border-border px-4 py-2 text-sm font-semibold text-foreground hover:border-primary hover:text-primary">How we work</Link>
          </div>
        </header>
        <section className="flex items-center gap-4 border-y border-border py-5">
          <span className="flex size-10 items-center justify-center bg-primary text-primary-foreground"><Radio className="size-4" aria-hidden="true" /></span>
          <div><p className="label-mono text-xs text-primary">LIVE DIRECTORY</p><p className="text-sm text-muted-foreground">{sources.length} enabled source{sources.length === 1 ? "" : "s"} in the current feed registry.</p></div>
        </section>
        <SourcesDirectory sources={sources} />
      </main>
      <SiteFooter />
    </div>
  )
}
