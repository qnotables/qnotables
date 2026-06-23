"use client"

import { ArrowLeft } from "lucide-react"

export function GoBackButton() {
  return (
    <button
      type="button"
      onClick={() => history.back()}
      className="flex items-center gap-2 border border-border bg-card px-6 py-2.5 font-heading text-sm font-bold uppercase tracking-widest text-foreground transition-colors hover:bg-muted"
    >
      <ArrowLeft className="h-4 w-4" aria-hidden="true" />
      Go Back
    </button>
  )
}
