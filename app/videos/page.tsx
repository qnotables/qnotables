import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { TopAd, BottomAd } from "@/components/ad-display"
import { getPublishedVideos } from "@/app/actions/video-actions"
import { VideosClient } from "./videos-client"

export const dynamic = "force-dynamic"

export const metadata = {
  title: "Videos | Qnotables",
  description: "Watch Qnotables video reports, updates, and featured media.",
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default async function VideosPage() {
  const videos = await getPublishedVideos()

  return (
    <div id="top" className="min-h-screen tactical-grid flex flex-col">
      <SiteHeader />
      <TopAd />

      <main className="flex-1">
        {/* Page header */}
        <div className="border-b border-border bg-card">
          <div className="mx-auto max-w-7xl px-4 py-12 md:px-6 md:py-16">
            <div className="flex items-center gap-3 mb-4">
              <span className="h-2 w-2 bg-primary" aria-hidden="true" />
              <span className="label-mono text-xs text-primary">MEDIA</span>
            </div>
            <h1 className="stencil text-5xl md:text-6xl text-foreground text-balance">Videos</h1>
            <p className="label-mono mt-3 text-sm text-muted-foreground max-w-2xl">
              Watch Qnotables video reports, updates, and featured media.
            </p>
          </div>
        </div>

        <VideosClient videos={videos} />
      </main>

      <BottomAd />
      <SiteFooter />
    </div>
  )
}
