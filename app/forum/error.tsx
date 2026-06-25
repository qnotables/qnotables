"use client"

import { useEffect } from "react"
import Link from "next/link"
import { AlertTriangle, RotateCcw } from "lucide-react"

export default function ForumError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("[forum/page] render error:", error)
  }, [error])

  return (
    <div className="min-h-screen tactical-grid">
      <main className="mx-auto flex min-h-screen max-w-2xl flex-col items-center justify-center px-4 py-10 text-center md:px-6">
        <div className="corner-frame w-full border border-border bg-card p-10">
          <AlertTriangle className="mx-auto h-10 w-10 text-primary" />
          <h1 className="stencil mt-4 text-2xl text-foreground">The Town Hall went dark.</h1>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Something broke while loading the forum. The signal will be back shortly.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={reset}
              className="label-mono inline-flex items-center gap-2 bg-primary px-4 py-2 font-semibold text-primary-foreground transition-opacity hover:opacity-90"
            >
              <RotateCcw className="h-4 w-4" /> Try again
            </button>
            <Link
              href="/forum"
              className="label-mono inline-flex items-center gap-2 border border-border px-4 py-2 text-foreground transition-colors hover:border-primary hover:text-primary"
            >
              Back to forum
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}
