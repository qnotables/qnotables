"use client"

import { useState } from "react"
import { RefreshCw, Check, AlertCircle } from "lucide-react"
import { triggerManualScrape } from "@/app/actions/scraper-actions"
import { cn } from "@/lib/utils"

export function ScraperRunButton({ sourceCount }: { sourceCount: number }) {
  const [status, setStatus] = useState<"idle" | "running" | "success" | "error">("idle")
  const [message, setMessage] = useState<string | null>(null)

  async function handleRun() {
    if (status === "running") return
    setStatus("running")
    setMessage(null)

    try {
      const result = await triggerManualScrape()
      setStatus(result.success ? "success" : "error")
      setMessage(result.message)
    } catch (err) {
      setStatus("error")
      setMessage(err instanceof Error ? err.message : "Unexpected error")
    }

    // Reset to idle after 6 seconds
    setTimeout(() => {
      setStatus("idle")
      setMessage(null)
    }, 6000)
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <button
        type="button"
        onClick={handleRun}
        disabled={status === "running" || sourceCount === 0}
        className={cn(
          "label-mono inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold transition-opacity",
          status === "success" && "bg-green-600 text-white",
          status === "error" && "bg-destructive text-destructive-foreground",
          status === "running" && "bg-primary/60 text-primary-foreground cursor-not-allowed",
          status === "idle" && "bg-primary text-primary-foreground hover:opacity-90",
          sourceCount === 0 && "cursor-not-allowed opacity-40",
        )}
        aria-label="Run scraper now"
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
            ? "DONE"
            : status === "error"
              ? "FAILED"
              : "RUN NOW"}
      </button>

      {message && (
        <p
          className={cn(
            "label-mono max-w-xs text-right text-xs",
            status === "success" ? "text-green-600" : "text-destructive",
          )}
        >
          {message}
        </p>
      )}

      {sourceCount === 0 && (
        <p className="label-mono text-xs text-muted-foreground">
          No sources configured in sources.ts
        </p>
      )}
    </div>
  )
}
