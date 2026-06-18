import { redirect } from "next/navigation"
import Link from "next/link"
import { Plus, Pencil, Trash2, Eye, EyeOff, ExternalLink, Play, Video } from "lucide-react"
import { validateDashboardAccess } from "@/lib/dashboard-auth"
import { getAllVideosAdmin } from "@/app/actions/video-actions"
import { DeleteVideoButton, TogglePublishedButton } from "./video-actions-client"
import { PageHeader } from "@/components/dashboard/ui"

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

  return (
    <div className="mx-auto max-w-7xl">
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

      {/* Setup notice — shown until first video exists */}
      {videos.length === 0 && (
        <div className="mb-6 border border-border bg-card/50 px-5 py-4">
          <p className="label-mono text-sm text-foreground font-semibold">Database setup required</p>
          <p className="label-mono mt-1 text-xs text-muted-foreground">
            Before adding videos, run the SQL in{" "}
            <code className="bg-muted px-1 py-0.5 text-xs">docs/videos-schema.sql</code> in your
            Supabase SQL editor (Database → SQL Editor). Then add your first video below.
          </p>
        </div>
      )}

      {videos.length === 0 ? (
        <div className="flex flex-col items-center justify-center border border-dashed border-border bg-card/50 px-6 py-16 text-center">
          <Video className="mx-auto mb-4 h-10 w-10 text-muted-foreground" />
          <p className="stencil text-xl text-foreground">No videos yet</p>
          <p className="label-mono mt-2 mb-6 text-sm text-muted-foreground">
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
          <div className="border-b border-border px-4 py-3">
            <p className="stencil text-sm text-foreground">All Videos</p>
          </div>
          <div className="divide-y divide-border">
            {videos.map((video) => (
              <div key={video.id} className="flex items-start gap-4 px-4 py-4">
                {/* Thumbnail */}
                <div className="relative hidden h-14 w-24 shrink-0 overflow-hidden border border-border bg-muted sm:block">
                  {video.thumbnail_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={video.thumbnail_url}
                      alt={video.title}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <Play className="h-5 w-5 text-muted-foreground/40" aria-hidden="true" />
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`label-mono border px-1.5 py-0.5 text-[10px] uppercase ${
                        video.published
                          ? "border-primary/30 bg-primary/10 text-primary"
                          : "border-border bg-muted text-muted-foreground"
                      }`}
                    >
                      {video.published ? "Published" : "Draft"}
                    </span>
                    {video.category && (
                      <span className="label-mono text-[10px] uppercase text-muted-foreground">
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
                  <p className="mt-1 font-semibold text-sm text-foreground truncate">{video.title}</p>
                  {video.description && (
                    <p className="label-mono mt-0.5 text-xs text-muted-foreground line-clamp-1">
                      {video.description}
                    </p>
                  )}
                  <div className="mt-1 flex flex-wrap items-center gap-3">
                    {video.external_url && (
                      <a
                        href={video.external_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="label-mono flex items-center gap-1 text-[11px] text-muted-foreground hover:text-primary"
                      >
                        <ExternalLink className="h-3 w-3" />
                        External link
                      </a>
                    )}
                    {video.video_url && (
                      <a
                        href={video.video_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="label-mono flex items-center gap-1 text-[11px] text-muted-foreground hover:text-primary"
                      >
                        <Play className="h-3 w-3" />
                        Uploaded file
                      </a>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex shrink-0 items-center gap-1">
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
    </div>
  )
}
