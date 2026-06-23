import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { TopAd, BottomAd } from "@/components/ad-display"
import { getPublishedVideos } from "@/app/actions/video-actions"
import { VideosClient } from "./videos-client"
import { EmbedSwitcher, type EmbedItem } from "@/components/qnotables-embed"
import { generateEmbedUrl, detectVideoPlatform } from "@/lib/video-embed-utils"

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
  
  // Platform display name map
  const platformLabels: Record<string, string> = {
    youtube: "YouTube",
    rumble: "Rumble",
    odysee: "Odysee",
    vimeo: "Vimeo",
    x: "X / Twitter",
    direct: "Video",
    external: "Video",
  }

  // Convert videos to embed items for the switcher.
  // Priority: external_url (platform link) → video_url (blob file).
  // Only include videos that have at least one embeddable URL.
  const embedItems: EmbedItem[] = videos
    .filter(video => video.external_url || video.video_url)
    .map(video => {
      const sourceUrl = video.external_url || video.video_url || ""
      const platform = detectVideoPlatform(sourceUrl)
      const embedUrl = generateEmbedUrl(sourceUrl, platform)

      return {
        id: video.id,
        title: video.title,
        source: platformLabels[platform] ?? "Video",
        description: video.description || "",
        embedUrl: embedUrl,
        externalUrl: video.external_url || video.video_url || undefined,
      }
    })

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

        {/* Embed switcher section */}
        {embedItems.length > 0 && (
          <div className="border-b border-border bg-background">
            <div className="mx-auto max-w-7xl px-4 py-10 md:px-6 md:py-12">
              <div className="mb-6">
                <div className="flex items-center gap-3 mb-2">
                  <span className="h-2 w-2 bg-primary" aria-hidden="true" />
                  <span className="label-mono text-xs text-primary">LIBRARY</span>
                </div>
                <h2 className="stencil text-3xl md:text-4xl text-foreground text-balance">Video Switcher</h2>
                <p className="label-mono mt-2 text-sm text-muted-foreground max-w-2xl">
                  Click items below to switch between different videos and platforms.
                </p>
              </div>
              <EmbedSwitcher items={embedItems} />
            </div>
          </div>
        )}

        <VideosClient videos={videos} />
      </main>

      <BottomAd />
      <SiteFooter />
    </div>
  )
}
