"use client"

import { useState } from "react"
import { RefreshCw, Check, AlertCircle } from "lucide-react"
import { triggerNotablesScrape } from "@/app/actions/notables-actions"
import { cn } from "@/lib/utils"

interface ScrapeState {
  status: "idle" | "running" | "success" | "error"
  message: string | null
  newItems?: number
  skippedDupes?: number
  errors?: string[]
}

export function NotablesRefreshButton() {
  const [state, setState] = useState<ScrapeState>({ status: "idle", message: null })

  async function handleRun() {
    if (state.status === "running") return

    setState({ status: "running", message: null })

    try {
      const result = await triggerNotablesScrape()
      setState({
        status: result.success ? "success" : "error",
        message: result.message,
        newItems: result.newItems,
        skippedDupes: result.skippedDupes,
        errors: result.errors,
      })
    } catch (err) {
      setState({
        status: "error",
        message: err instanceof Error ? err.message : "Unexpected error",
      })
    }

    // Reset to idle after 8 seconds
    setTimeout(() => setState({ status: "idle", message: null }), 8000)
  }

  const { status, message, newItems, skippedDupes, errors } = state

  return (
    <div className="flex flex-col items-start gap-3">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={handleRun}
          disabled={status === "running"}
          aria-label="Refresh Notables"
          className={cn(
            "label-mono inline-flex items-center gap-2 border px-4 py-2.5 text-sm font-semibold transition-opacity",
            status === "success" && "border-green-600 bg-green-600 text-white",
            status === "error" && "border-destructive bg-destructive text-destructive-foreground",
            status === "running" && "border-primary/60 bg-primary/60 text-primary-foreground cursor-not-allowed",
            status === "idle" && "border-primary bg-primary text-primary-foreground hover:opacity-90",
          )}
        >
          {status === "running" ? (
            <RefreshCw className="h-4 w-4 animate-spin" />
          ) : status === "success" ? (
            <Check className="h-4 w-4" />
          ) : status === "error" ? (
            <AlertCircle className="h-4 w-4" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
          {status === "running"
            ? "RUNNING…"
            : status === "success"
              ? "COMPLETE"
              : status === "error"
                ? "FAILED"
                : "REFRESH NOTABLES"}
        </button>
      </div>

      {/* Result summary */}
      {message && (
        <div
          className={cn(
            "label-mono max-w-sm border px-3 py-2 text-xs",
            status === "success"
              ? "border-green-600/40 bg-green-600/10 text-green-700 dark:text-green-400"
              : "border-destructive/40 bg-destructive/10 text-destructive",
          )}
        >
          <p className="font-semibold">{message}</p>
          {status === "success" && (
            <div className="mt-1 flex gap-4">
              <span>{newItems ?? 0} new</span>
              <span>{skippedDupes ?? 0} dupes skipped</span>
            </div>
          )}
          {errors && errors.length > 0 && (
            <ul className="mt-1 list-inside list-disc space-y-0.5 text-[10px] opacity-80">
              {errors.slice(0, 4).map((e, i) => (
                <li key={i}>{e}</li>
              ))}
              {errors.length > 4 && <li>…and {errors.length - 4} more</li>}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
