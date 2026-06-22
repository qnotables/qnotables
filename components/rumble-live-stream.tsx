"use client"

import { useState } from "react"
import { Radio } from "lucide-react"

interface RumbleLiveStreamProps {
  channelUrl?: string
  channelName?: string
}

export function RumbleLiveStream({
  channelUrl = "https://rumble.com/c/Qnotables/live",
  channelName = "Qnotables",
}: RumbleLiveStreamProps) {
  const [dismissed, setDismissed] = useState(false)

  if (dismissed) return null

  // Rumble channel live stream embed URL
  const embedUrl = `https://rumble.com/embed/live_stream?url=${encodeURIComponent(channelUrl)}`

  return (
    <div className="border border-primary/40 bg-background mb-6">
      {/* Header bar */}
      <div className="flex items-center gap-2 border-b border-primary/30 bg-primary/5 px-4 py-2">
        <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-primary flex-shrink-0" />
        <span className="label-mono text-xs font-bold text-primary tracking-widest">LIVE STREAM</span>
        <span className="label-mono text-xs text-muted-foreground ml-1">— {channelName} on Rumble</span>
        <a
          href={channelUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="label-mono ml-auto text-xs text-primary hover:underline whitespace-nowrap"
        >
          OPEN CHANNEL →
        </a>
        <button
          onClick={() => setDismissed(true)}
          aria-label="Dismiss live stream"
          className="ml-2 text-muted-foreground hover:text-foreground transition-colors text-lg leading-none"
        >
          ×
        </button>
      </div>

      {/* Embed */}
      <div className="relative w-full" style={{ paddingTop: "56.25%" }}>
        <iframe
          src={embedUrl}
          title={`${channelName} Live Stream on Rumble`}
          allowFullScreen
          allow="autoplay; encrypted-media; picture-in-picture"
          referrerPolicy="no-referrer-when-downgrade"
          sandbox="allow-scripts allow-same-origin allow-popups allow-presentation allow-forms"
          className="absolute inset-0 h-full w-full border-0"
        />
      </div>
    </div>
  )
}
