"use client"

import { useEffect, useRef } from "react"
import { incrementThreadViewCount } from "@/app/forum/actions"

/**
 * Fires a single best-effort view-count increment when a thread page mounts.
 * Deduped per-thread within a browser session via sessionStorage so a refresh
 * or client navigation back to the same thread doesn't keep inflating the
 * count. Renders nothing.
 */
export function ThreadViewCounter({ threadId }: { threadId: string }) {
  const fired = useRef(false)

  useEffect(() => {
    if (fired.current) return
    fired.current = true

    const key = `forum-viewed-${threadId}`
    try {
      if (sessionStorage.getItem(key)) return
      sessionStorage.setItem(key, "1")
    } catch {
      // sessionStorage may be unavailable (private mode / SSR edge) — still count once per mount
    }

    void incrementThreadViewCount(threadId)
  }, [threadId])

  return null
}
