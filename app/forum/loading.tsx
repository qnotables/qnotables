import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"

function Bar({ className }: { className: string }) {
  return <div className={`animate-pulse bg-muted ${className}`} aria-hidden="true" />
}

function SkeletonRow() {
  return (
    <div className="flex gap-0 border border-border bg-card">
      <div className="flex w-14 shrink-0 flex-col items-center justify-center gap-1 border-r border-border bg-muted/30 px-2 py-4"><Bar className="h-5 w-6" /><Bar className="h-2 w-8 opacity-60" /></div>
      <div className="min-w-0 flex-1 space-y-3 p-5"><div className="flex gap-2"><Bar className="h-4 w-16 opacity-60" /><Bar className="h-4 w-20 opacity-40" /></div><Bar className="h-5 w-3/4" /><Bar className="h-3 w-full opacity-50" /><Bar className="h-3 w-2/3 opacity-50" /></div>
    </div>
  )
}

function SidebarSkeleton() {
  return <div className="flex flex-col gap-4"><div className="space-y-3 border border-border bg-card p-4"><Bar className="h-4 w-24" /><Bar className="h-4 w-full opacity-50" /><Bar className="h-4 w-full opacity-50" /><Bar className="h-4 w-full opacity-50" /></div><div className="space-y-3 border border-border bg-card p-4"><Bar className="h-4 w-28" />{Array.from({ length: 5 }).map((_, index) => <Bar key={index} className="h-5 w-full opacity-50" />)}</div></div>
}

export default function ForumLoading() {
  return (
    <div className="min-h-screen tactical-grid">
      <SiteHeader />
      <main className="mx-auto max-w-7xl px-4 py-8 md:px-6 md:py-12">
        <section className="border-b border-border pb-8"><Bar className="h-3 w-48" /><Bar className="mt-5 h-12 w-72 md:h-16 md:w-96" /><Bar className="mt-4 h-5 w-full max-w-2xl opacity-50" /></section>
        <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_280px]">
          <div className="space-y-4" aria-busy="true" aria-label="Loading forum threads"><div className="border border-border bg-card p-3"><div className="flex flex-col gap-2 md:flex-row"><Bar className="h-10 flex-1" /><Bar className="h-10 w-full md:w-36" /><Bar className="h-10 w-full md:w-36" /></div><div className="mt-2 flex gap-2"><Bar className="h-10 flex-1" /><Bar className="h-10 flex-1" /><Bar className="h-10 flex-1" /></div></div>{Array.from({ length: 6 }).map((_, index) => <SkeletonRow key={index} />)}</div>
          <SidebarSkeleton />
        </div>
      </main>
      <SiteFooter />
    </div>
  )
}
