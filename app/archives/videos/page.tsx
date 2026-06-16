import Link from "next/link"
import { ArrowLeft, Play } from "lucide-react"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { getArchiveVideos, formatDate } from "@/lib/archive"

export const dynamic = "force-dynamic"

export const metadata = {
  title: "Video Archives — Hot and Fresh",
  description: "Video content, embeds, and multimedia from Hot and Fresh",
}

export default async function VideosPage() {
  const videos = await getArchiveVideos()

  return (
    <div className="min-h-screen tactical-grid flex flex-col">
      <SiteHeader />

      <main className="flex-1 mx-auto max-w-5xl px-4 py-10 md:px-6">
        <div className="mb-8 flex items-center gap-3">
          <Link href="/archives" className="text-primary hover:underline">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <span className="h-2 w-2 bg-primary" />
          <h1 className="stencil text-3xl text-foreground md:text-4xl">Video Archives</h1>
          <span className="ml-auto h-px flex-1 bg-border" />
          <span className="label-mono text-sm text-muted-foreground">{videos.length} VIDEOS</span>
        </div>

        {videos.length === 0 ? (
          <div className="border border-dashed border-border p-12 text-center">
            <p className="label-mono text-muted-foreground">No videos archived yet.</p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {videos.map(video => (
              <Link
                key={video.id}
                href={`/archives/${video.slug}`}
                className="group relative overflow-hidden border border-border bg-muted/30 transition-all hover:border-primary hover:bg-muted/50"
              >
                {video.cover_image_url && (
                  <img
                    src={video.cover_image_url}
                    alt={video.title}
                    className="h-40 w-full object-cover transition-transform group-hover:scale-105"
                  />
                )}
                <div className="absolute inset-0 flex items-center justify-center bg-black/30 transition-opacity group-hover:bg-black/50">
                  <Play className="h-12 w-12 text-white" />
                </div>
                <div className="p-3">
                  <h3 className="font-semibold text-foreground group-hover:text-primary line-clamp-2">{video.title}</h3>
                  {video.published_at && (
                    <p className="label-mono mt-2 text-xs text-muted-foreground">
                      {formatDate(new Date(video.published_at))}
                    </p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>

      <SiteFooter />
    </div>
  )
}
