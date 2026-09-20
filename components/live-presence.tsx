"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"

const PRESENCE_CHANNEL = "qnotables-live-presence"
const PRESENCE_ID_KEY = "qnotables-presence-id"
const HEARTBEAT_MS = 60_000
const ACTIVITY_THROTTLE_MS = 30_000

function getPresenceId() {
  try {
    const existing = window.localStorage.getItem(PRESENCE_ID_KEY)
    if (existing) return existing
    const id = crypto.randomUUID()
    window.localStorage.setItem(PRESENCE_ID_KEY, id)
    return id
  } catch {
    return crypto.randomUUID()
  }
}

function countPresence(state: Record<string, unknown[]>) {
  return Object.keys(state).length
}

export function useLivePresence() {
  const [onlineCount, setOnlineCount] = useState<number | null>(null)

  useEffect(() => {
    const supabase = createClient()
    const presenceId = getPresenceId()
    const channel = supabase.channel(PRESENCE_CHANNEL, {
      config: { presence: { key: presenceId } },
    })
    let lastTrackedAt = 0
    let heartbeat: number | undefined

    const updateCount = () => {
      setOnlineCount(countPresence(channel.presenceState()))
    }

    const trackActivity = async (force = false) => {
      if (document.visibilityState !== "visible") return
      const now = Date.now()
      if (!force && now - lastTrackedAt < ACTIVITY_THROTTLE_MS) return
      lastTrackedAt = now
      try {
        await channel.track({ active: true })
        updateCount()
      } catch {
        setOnlineCount(null)
      }
    }

    const handleActivity = () => {
      void trackActivity().catch(() => undefined)
    }

    const handleVisibility = () => {
      if (document.visibilityState === "visible") void trackActivity(true).catch(() => undefined)
      else void channel.untrack().catch(() => undefined)
    }

    channel
      .on("presence", { event: "sync" }, updateCount)
      .on("presence", { event: "join" }, updateCount)
      .on("presence", { event: "leave" }, updateCount)
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          void trackActivity(true).catch(() => undefined)
          heartbeat = window.setInterval(() => void trackActivity(true).catch(() => undefined), HEARTBEAT_MS)
        }
      })

    const events = ["pointermove", "scroll", "keydown", "touchstart"] as const
    events.forEach((event) => window.addEventListener(event, handleActivity, { passive: true }))
    document.addEventListener("visibilitychange", handleVisibility)

    return () => {
      if (heartbeat) window.clearInterval(heartbeat)
      events.forEach((event) => window.removeEventListener(event, handleActivity))
      document.removeEventListener("visibilitychange", handleVisibility)
      void channel.untrack().catch(() => undefined)
      void supabase.removeChannel(channel).catch(() => undefined)
    }
  }, [])

  return onlineCount
}

export function LivePresenceLabel({ onlineCount, compact = false }: { onlineCount: number | null; compact?: boolean }) {
  const countLabel = onlineCount === null ? "—" : onlineCount
  const noun = onlineCount === 1 ? "Anon" : "Anons"

  return (
    <span
      className="label-mono inline-flex items-center gap-1 text-[10px] text-muted-foreground"
      aria-label={onlineCount === null ? "Visitor count unavailable" : `${onlineCount} visitors active within the last 15 minutes`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-primary" aria-hidden="true" />
      <span>{compact ? `${countLabel} Online` : `${countLabel} ${noun} Online`}</span>
    </span>
  )
}
