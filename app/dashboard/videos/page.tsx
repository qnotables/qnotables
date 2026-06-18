import { redirect } from "next/navigation"
import Link from "next/link"
import { Plus, Pencil, Play, Video, ExternalLink, Eye } from "lucide-react"
import { validateDashboardAccess } from "@/lib/dashboard-auth"
import { getAllVideosAdmin } from "@/app/actions/video-actions"
import { DeleteVideoButton, TogglePublishedButton } from "./video-actions-client"
import { PageHeader, StatCard } from "@/components/dashboard/ui"

export const dynamic = "force-dynamic"

export const metadata = {
  title: "Videos — Dashboard",
  description: "Manage video posts and uploads.",
}

export default async function DashboardVideosPage() {
  const hasAccess = await validateDashboardAccess()
  if (!hasAccess) redirect("/dashboard/login")

  const videos = await getAllVideosAdmin()
  const published = videos.filter((v) => v.published).length
  const drafts = videos.filter((v) => !v.published).length
  const withUploads = videos.filter((v) => v.video_url).length

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <PageHeader
        title="Videos"
        description={`${videos.length} total · ${published} published · ${drafts} drafts`}
        breadcrumbs={[{ label: "Videos" }]}
        action={
          <Link
            href="/dashboard/videos/new"
            className="label-mono inline-flex items-center gap-2 bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
          >
            <Plus className="h-4 w-4" />
            New Video
          </Link>
        }
      />

      {/* Stats row */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Total" value={videos.length} icon={Video} />
        <StatCard label="Published" value={published} icon={Eye} />
        <StatCard label="Drafts" value={drafts} icon={Play} />
        <StatCard label="Uploaded Files" value={withUploads} icon={Play} />
      </div>

      {/* DB setup notice */}
      {videos.length === 0 && (
        <div className="border border-primary/30 bg-primary/5 px-5 py-4">
          <p className="label-mono text-sm font-semibold text-foreground">Database setup required</p>
          <p className="label-mono mt-1 text-xs text-muted-foreground">
            Run the SQL in{" "}
            <code className="bg-muted px-1 py-0.5 text-xs">docs/videos-schema.sql</code> in your
            Supabase SQL editor (Database → SQL Editor), then add your first video.
          </p>
        </div>
      )}

      {/* Table */}
      {videos.length === 0 ? (
        <div className="flex flex-col items-center justify-center border border-dashed border-border bg-card/50 px-6 py-20 text-center">
          <Video className="mx-auto mb-4 h-12 w-12 text-muted-foreground/40" />
          <p className="stencil text-2xl text-foreground">No videos yet</p>
          <p className="label-mono mt-2 mb-6 max-w-xs text-sm text-muted-foreground">
            Add your first video to publish it on the public /videos page.
          </p>
          <Link
            href="/dashboard/videos/new"
            className="label-mono inline-flex items-center gap-2 bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
          >
            <Plus className="h-4 w-4" />
            Add Video
          </Link>
        </div>
      ) : (
        <div className="border border-border bg-card">
          {/* Table header */}
          <div className="hidden border-b border-border bg-muted/40 px-4 py-2 sm:grid sm:grid-cols-[auto_1fr_auto_auto_auto] sm:gap-4">
            <span className="label-mono text-[10px] text-muted-foreground w-20">Thumbnail</span>
            <span className="label-mono text-[10px] text-muted-foreground">Title / Info</span>
            <span className="label-mono text-[10px] text-muted-foreground">Status</span>
            <span className="label-mono text-[10px] text-muted-foreground">Source</span>
            <span className="label-mono text-[10px] text-muted-foreground">Actions</span>
          </div>

          <div className="divide-y divide-border">
            {videos.map((video) => (
              <div
                key={video.id}
                className="flex flex-col gap-3 px-4 py-4 sm:grid sm:grid-cols-[80px_1fr_auto_auto_auto] sm:items-center sm:gap-4"
              >
                {/* Thumbnail */}
                <div className="relative h-11 w-20 shrink-0 overflow-hidden border border-border bg-muted">
                  {video.thumbnail_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={video.thumbnail_url}
                      alt={video.title}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <Play className="h-4 w-4 text-muted-foreground/30" aria-hidden="true" />
                    </div>
                  )}
                </div>

                {/* Title + meta */}
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-foreground">{video.title}</p>
                  <div className="mt-0.5 flex flex-wrap items-center gap-2">
                    {video.category && (
                      <span className="label-mono text-[10px] text-muted-foreground">
                        {video.category}
                      </span>
                    )}
                    {video.date && (
                      <span className="label-mono text-[10px] text-muted-foreground">
                        {new Date(video.date).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                    )}
                  </div>
                  {video.description && (
                    <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">
                      {video.description}
                    </p>
                  )}
                </div>

                {/* Status badge */}
                <div className="flex items-center">
                  <span
                    className={`label-mono border px-2 py-0.5 text-[10px] uppercase ${
                      video.published
                        ? "border-primary/30 bg-primary/10 text-primary"
                        : "border-border bg-muted text-muted-foreground"
                    }`}
                  >
                    {video.published ? "Published" : "Draft"}
                  </span>
                </div>

                {/* Source links */}
                <div className="flex items-center gap-2">
                  {video.external_url && (
                    <a
                      href={video.external_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="Open external link"
                      className="flex h-7 w-7 items-center justify-center border border-border text-muted-foreground hover:border-primary hover:text-primary transition-colors"
                      aria-label="Open external link"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  )}
                  {video.video_url && (
                    <a
                      href={video.video_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="Play uploaded video"
                      className="flex h-7 w-7 items-center justify-center border border-border text-muted-foreground hover:border-primary hover:text-primary transition-colors"
                      aria-label="Play uploaded video"
                    >
                      <Play className="h-3.5 w-3.5" />
                    </a>
                  )}
                  {!video.external_url && !video.video_url && (
                    <span className="label-mono text-[10px] text-muted-foreground/50">—</span>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1">
                  <TogglePublishedButton id={video.id} published={video.published} />
                  <Link
                    href={`/dashboard/videos/${video.id}/edit`}
                    className="flex h-8 w-8 items-center justify-center border border-border text-muted-foreground hover:border-primary hover:text-foreground transition-colors"
                    aria-label="Edit video"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Link>
                  <DeleteVideoButton id={video.id} title={video.title} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Footer hint */}
      {videos.length > 0 && (
        <p className="label-mono text-right text-[10px] text-muted-foreground/60">
          Published videos appear on{" "}
          <Link href="/videos" className="underline hover:text-foreground">
            /videos
          </Link>
        </p>
      )}
    </div>
  )
}
