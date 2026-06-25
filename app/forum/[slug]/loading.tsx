import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"

export default function ThreadLoading() {
  return (
    <div className="min-h-screen tactical-grid">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-4 py-10 md:px-6" aria-busy="true" aria-label="Loading thread">
        <div className="mb-6 h-4 w-32 animate-pulse bg-muted" />

        {/* OP skeleton */}
        <div className="border border-border bg-card p-6">
          <div className="h-7 w-3/4 animate-pulse bg-muted" />
          <div className="mt-3 flex gap-3">
            <div className="h-3 w-24 animate-pulse bg-muted/60" />
            <div className="h-3 w-20 animate-pulse bg-muted/40" />
          </div>
          <div className="mt-5 space-y-2">
            <div className="h-3 w-full animate-pulse bg-muted/50" />
            <div className="h-3 w-full animate-pulse bg-muted/50" />
            <div className="h-3 w-2/3 animate-pulse bg-muted/50" />
          </div>
        </div>

        {/* Replies skeleton */}
        <div className="mt-10 flex flex-col gap-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="border border-border bg-card p-5">
              <div className="mb-3 flex gap-3">
                <div className="h-3 w-20 animate-pulse bg-muted/60" />
                <div className="h-3 w-16 animate-pulse bg-muted/40" />
              </div>
              <div className="space-y-2">
                <div className="h-3 w-full animate-pulse bg-muted/50" />
                <div className="h-3 w-4/5 animate-pulse bg-muted/50" />
              </div>
            </div>
          ))}
        </div>
      </main>
      <SiteFooter />
    </div>
  )
}
