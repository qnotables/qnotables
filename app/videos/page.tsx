import Link from "next/link"
import { Play, Calendar, Tag } from "lucide-react"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"

export const metadata = {
  title: "Videos | Qnotables",
  description: "Watch Qnotables video reports, updates, and featured media.",
}

// ---------------------------------------------------------------------------
// Video data — add new entries here without rebuilding the page.
// Each entry supports YouTube, Rumble, or any iframe-embeddable URL.
// Set `embedUrl` to enable inline playback, or leave blank to use `watchUrl`.
// ---------------------------------------------------------------------------
const videos = [
  {
    id: 1,
    title: "Qnotables 4AM Talking Points",
    description:
      "Early morning briefing covering the top developments and story threads from the overnight intelligence cycle.",
    date: "2025-06-10",
    category: "Briefing",
    watchUrl: "#",
    embedUrl: "https://rumble.com/qnotables/live",
  },
  {
    id: 2,
    title: "Situation Report",
    description:
      "A structured breakdown of active stories, verified source links, and field notes from the research desk.",
    date: "2025-06-08",
    category: "Situation Report",
    watchUrl: "#",
    embedUrl: "https://rumble.com/embed/viwa2j/?pub=25xjr",
  },
  {
    id: 3,
    title: "Archive Briefing",
    description:
      "Deep dive into the historical archive — connecting older records to current developments with source documentation.",
    date: "2025-06-05",
    category: "Archive",
    watchUrl: "#",
    embedUrl: "https://rumble.com/embed/vieoy1/?pub=25xjr",
  },
  {
    id: 4,
    title: "Featured Investigation",
    description:
      "An in-depth look at a developing investigation with primary sources, timeline reconstruction, and analysis.",
    date: "2025-06-01",
    category: "Investigation",
    watchUrl: "#",
    embedUrl: "",
  },
]

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  })
}

export default function VideosPage() {
  return (
    <div id="top" className="min-h-screen tactical-grid flex flex-col">
      <SiteHeader />

      <main className="flex-1">
        {/* Page header */}
        <div className="border-b border-border bg-card">
          <div className="mx-auto max-w-7xl px-4 py-12 md:px-6 md:py-16">
            <div className="flex items-center gap-3 mb-4">
              <span className="h-2 w-2 bg-primary" />
              <span className="label-mono text-xs text-primary">MEDIA</span>
            </div>
            <h1 className="stencil text-5xl md:text-6xl text-foreground text-balance">Videos</h1>
            <p className="label-mono mt-3 text-sm text-muted-foreground max-w-2xl">
              Watch Qnotables video reports, updates, and featured media.
            </p>
          </div>
        </div>

        {/* Video grid */}
        <div className="mx-auto max-w-7xl px-4 py-10 md:px-6 md:py-12">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4">
            {videos.map((video) => (
              <VideoCard key={video.id} video={video} />
            ))}
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  )
}

// ---------------------------------------------------------------------------
// VideoCard — isolated component so the page stays easy to scan.
// ---------------------------------------------------------------------------
interface VideoEntry {
  id: number
  title: string
  description: string
  date: string
  category: string
  watchUrl: string
  embedUrl: string
}

function VideoCard({ video }: { video: VideoEntry }) {
  return (
    <article className="group flex flex-col border border-border bg-card hover:border-primary transition-colors">
      {/* Thumbnail */}
      <div className="relative aspect-video bg-muted flex items-center justify-center overflow-hidden border-b border-border">
        {video.embedUrl ? (
          <iframe
            src={video.embedUrl}
            title={video.title}
            className="absolute inset-0 h-full w-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        ) : (
          <>
            {/* Placeholder background */}
            <div className="absolute inset-0 bg-muted/60 tactical-grid" aria-hidden="true" />
            {/* Play button */}
            <div className="relative z-10 flex h-14 w-14 items-center justify-center rounded-full border-2 border-primary bg-card/80 backdrop-blur-sm transition-transform group-hover:scale-110">
              <Play className="h-6 w-6 text-primary fill-primary" aria-hidden="true" />
            </div>
          </>
        )}
      </div>

      {/* Card body */}
      <div className="flex flex-1 flex-col gap-3 p-4">
        {/* Meta row */}
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1 label-mono text-xs text-primary">
            <Tag className="h-3 w-3" aria-hidden="true" />
            {video.category}
          </span>
          <span className="flex items-center gap-1 label-mono text-xs text-muted-foreground ml-auto">
            <Calendar className="h-3 w-3" aria-hidden="true" />
            {formatDate(video.date)}
          </span>
        </div>

        {/* Title */}
        <h2 className="stencil text-base text-foreground leading-snug group-hover:text-primary transition-colors">
          {video.title}
        </h2>

        {/* Description */}
        <p className="text-xs leading-relaxed text-muted-foreground flex-1">
          {video.description}
        </p>

        {/* Watch button */}
        <Link
          href={video.watchUrl}
          className="label-mono mt-auto flex items-center gap-2 border border-border bg-background px-3 py-2 text-xs text-foreground hover:border-primary hover:text-primary transition-colors"
        >
          <Play className="h-3.5 w-3.5" aria-hidden="true" />
          Watch Video
        </Link>
      </div>
    </article>
  )
}
