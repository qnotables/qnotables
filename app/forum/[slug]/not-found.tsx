import Link from "next/link"
import { FileQuestion, ArrowLeft } from "lucide-react"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"

export default function ThreadNotFound() {
  return (
    <div className="min-h-screen tactical-grid">
      <SiteHeader />
      <main className="mx-auto flex max-w-2xl flex-col items-center justify-center px-4 py-24 text-center md:px-6">
        <div className="corner-frame w-full border border-border bg-card p-10">
          <FileQuestion className="mx-auto h-10 w-10 text-muted-foreground opacity-60" />
          <h1 className="stencil mt-4 text-2xl text-foreground">Thread not found.</h1>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            This thread was removed, never existed, or the link is broken.
          </p>
          <Link
            href="/forum"
            className="label-mono mt-6 inline-flex items-center gap-2 border border-primary px-4 py-2 text-primary transition-colors hover:bg-primary hover:text-primary-foreground"
          >
            <ArrowLeft className="h-4 w-4" /> Back to The Town Hall
          </Link>
        </div>
      </main>
      <SiteFooter />
    </div>
  )
}
