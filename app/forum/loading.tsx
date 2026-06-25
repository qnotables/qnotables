import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"

function SkeletonCard() {
  return (
    <div className="flex gap-0 border border-border bg-card">
      <div className="hidden w-24 flex-shrink-0 animate-pulse bg-muted/40 sm:block" />
      <div className="flex w-14 flex-shrink-0 flex-col items-center justify-center gap-1 border-r border-border bg-muted/30 px-2 py-4">
        <div className="h-5 w-6 animate-pulse bg-muted" />
        <div className="h-2 w-8 animate-pulse bg-muted/60" />
      </div>
      <div className="min-w-0 flex-1 space-y-3 p-4">
        <div className="flex gap-1.5">
          <div className="h-4 w-16 animate-pulse bg-muted/60" />
          <div className="h-4 w-12 animate-pulse bg-muted/40" />
        </div>
        <div className="h-5 w-3/4 animate-pulse bg-muted" />
        <div className="h-3 w-full animate-pulse bg-muted/50" />
        <div className="h-3 w-2/3 animate-pulse bg-muted/50" />
      </div>
    </div>
  )
}

export default function ForumLoading() {
  return (
    <div className="min-h-screen tactical-grid">
      <SiteHeader />
      <main className="mx-auto max-w-7xl px-4 py-10 md:px-6">
        <div className="mb-8 flex items-center gap-3">
          <span className="h-2 w-2 bg-primary" />
          <div className="h-8 w-48 animate-pulse bg-muted" />
          <span className="ml-auto h-px flex-1 bg-border" />
        </div>
        <div className="flex flex-col gap-2" aria-busy="true" aria-label="Loading threads">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      </main>
      <SiteFooter />
    </div>
  )
}
