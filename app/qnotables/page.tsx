import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { TopAd } from "@/components/ad-display"
import { QnotablesEmbed } from "@/components/qnotables-embed"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Qnotables — Hot and Fresh News Desk",
  description: "Qnotables research and notable posts embedded directly on the desk.",
}

export default function QnotablesPage() {
  return (
    <div id="top" className="min-h-screen tactical-grid">
      <SiteHeader />
      <TopAd />

      <main className="mx-auto max-w-7xl px-4 py-6 md:px-6 md:py-8">
        {/* Section label */}
        <div className="mb-6 flex items-center gap-3">
          <span className="h-2 w-2 bg-primary" />
          <h1 className="stencil text-xl text-foreground">Qnotables</h1>
          <span className="ml-auto h-px flex-1 bg-border" />
          <span className="label-mono text-xs text-muted-foreground">LIVE RESEARCH EMBED</span>
        </div>

        <QnotablesEmbed />
      </main>

      <SiteFooter />
    </div>
  )
}
