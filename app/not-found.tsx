import Link from "next/link"
import Image from "next/image"
import { Home, ArrowLeft } from "lucide-react"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"

export const metadata = {
  title: "404 — Page Not Found | Q Notables",
  description: "The page you are looking for does not exist.",
}

export default function NotFound() {
  return (
    <div className="min-h-screen tactical-grid flex flex-col">
      <SiteHeader />

      <main className="flex flex-1 flex-col items-center justify-center px-4 py-20">
        {/* stamp border */}
        <div className="w-full max-w-lg border-2 border-border bg-card p-8 text-center shadow-md">

          {/* error code bar */}
          <div className="mb-6 inline-block border border-primary bg-primary px-4 py-1">
            <span className="font-heading text-xs font-bold tracking-[0.3em] text-primary-foreground uppercase">
              Error Code: 404
            </span>
          </div>

          {/* image */}
          <div className="mx-auto mb-6 w-52 border-2 border-border shadow-sm">
            <Image
              src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/join%20or%20404-2a8goZH6TPQCtq0lsSLJg23GOTARGt.jpg"
              alt="Join or 404 — a colonial-style woodcut of a segmented crab with the words JOIN OR 404"
              width={208}
              height={208}
              className="block w-full"
              priority
            />
          </div>

          {/* heading */}
          <h1 className="font-heading mb-2 text-4xl font-extrabold uppercase tracking-widest text-foreground">
            Page Not Found
          </h1>

          {/* divider */}
          <div className="mx-auto mb-4 h-px w-24 bg-border" />

          {/* body copy */}
          <p className="mb-2 font-mono text-sm text-muted-foreground">
            The document you requested has been moved, deleted, or never existed.
          </p>
          <p className="mb-8 font-mono text-sm text-muted-foreground">
            This is your only warning. Join or 404.
          </p>

          {/* actions */}
          <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/"
              className="flex items-center gap-2 border border-primary bg-primary px-6 py-2.5 font-heading text-sm font-bold uppercase tracking-widest text-primary-foreground transition-opacity hover:opacity-90"
            >
              <Home className="h-4 w-4" aria-hidden="true" />
              Return to Base
            </Link>
            <Link
              href="javascript:history.back()"
              className="flex items-center gap-2 border border-border bg-card px-6 py-2.5 font-heading text-sm font-bold uppercase tracking-widest text-foreground transition-colors hover:bg-muted"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              Go Back
            </Link>
          </div>
        </div>

        {/* footer note */}
        <p className="mt-6 font-mono text-xs text-muted-foreground">
          If you believe this is an error, verify the URL and try again.
        </p>
      </main>

      <SiteFooter />
    </div>
  )
}
