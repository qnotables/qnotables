"use client"

import {
  Share2,
  Share,
  Mail,
  MessageCircle,
} from "lucide-react"
import { useState, useRef, useEffect } from "react"

interface ShareButtonsProps {
  headline: string
  url?: string
  source?: string
}

export function ShareButtons({ headline, url, source }: ShareButtonsProps) {
  const [showMenu, setShowMenu] = useState(false)
  const [menuPosition, setMenuPosition] = useState<{ top: string; left: string }>({ top: "0", left: "0" })
  const buttonRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  // The story URL — if not provided, link back to qnotables.ai
  const storyUrl = url || "https://qnotables.ai"
  const baseUrl = "https://qnotables.ai"

  // Share text: "Headline - Source via @qnotables"
  const shareText = `${headline}${source ? ` - ${source}` : ""} via @qnotables`

  // Build share URLs for each platform
  const shareLinks = {
    twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(storyUrl)}&via=qnotables`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(storyUrl)}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(storyUrl)}`,
    reddit: `https://reddit.com/submit?url=${encodeURIComponent(storyUrl)}&title=${encodeURIComponent(headline)}`,
    truthsocial: `https://truthsocial.com/@qnotables/posts/new?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(storyUrl)}`,
    telegram: `https://t.me/share/url?url=${encodeURIComponent(storyUrl)}&text=${encodeURIComponent(headline)}`,
    email: `mailto:?subject=${encodeURIComponent(`${headline} - via qnotables.ai`)}&body=${encodeURIComponent(`${headline}\n\n${storyUrl}\n\nShared via qnotables.ai`)}`,
  }

  const openShare = (platform: string) => {
    const url = shareLinks[platform as keyof typeof shareLinks]
    if (url) {
      window.open(url, "_blank", "noopener,noreferrer")
    }
  }

  // Calculate position when menu shows
  useEffect(() => {
    if (showMenu && buttonRef.current && menuRef.current) {
      const rect = buttonRef.current.getBoundingClientRect()
      const menuHeight = menuRef.current.offsetHeight || 50
      
      // Position menu below button, adjusted so it doesn't go off-screen
      const top = rect.top + rect.height + window.scrollY + 8
      const left = Math.max(8, rect.right - 200 + window.scrollX)
      
      setMenuPosition({
        top: `${top}px`,
        left: `${left}px`,
      })
    }
  }, [showMenu])

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        onClick={() => setShowMenu(!showMenu)}
        className="label-mono flex items-center gap-1 text-muted-foreground transition-colors hover:text-primary"
        title="Share this story"
      >
        <Share2 className="h-4 w-4" /> SHARE
      </button>

      {showMenu && (
        <div 
          ref={menuRef}
          className="fixed z-50 flex flex-wrap gap-2 rounded border border-border bg-card p-2 shadow-lg sm:flex-nowrap sm:gap-1"
          style={{
            top: menuPosition.top,
            left: menuPosition.left,
          }}
        >
          <button
            onClick={() => openShare("twitter")}
            className="flex items-center justify-center gap-1 rounded p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-primary"
            title="Share on Twitter"
          >
            <span className="label-mono text-xs font-bold">X</span>
          </button>

          <button
            onClick={() => openShare("facebook")}
            className="flex items-center justify-center gap-1 rounded p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-primary"
            title="Share on Facebook"
          >
            <span className="label-mono text-xs font-bold">FB</span>
          </button>

          <button
            onClick={() => openShare("linkedin")}
            className="flex items-center justify-center gap-1 rounded p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-primary"
            title="Share on LinkedIn"
          >
            <span className="label-mono text-xs font-bold">LI</span>
          </button>

          <button
            onClick={() => openShare("reddit")}
            className="flex items-center justify-center gap-1 rounded p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-primary"
            title="Share on Reddit"
          >
            <MessageCircle className="h-4 w-4" />
            <span className="label-mono text-xs hidden sm:inline">RD</span>
          </button>

          <button
            onClick={() => openShare("truthsocial")}
            className="flex items-center justify-center gap-1 rounded p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-primary"
            title="Share on Truth Social"
          >
            <span className="label-mono text-xs font-bold">TS</span>
          </button>

          <button
            onClick={() => openShare("telegram")}
            className="flex items-center justify-center gap-1 rounded p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-primary"
            title="Share on Telegram"
          >
            <MessageCircle className="h-4 w-4" />
            <span className="label-mono text-xs hidden sm:inline">TG</span>
          </button>

          <button
            onClick={() => openShare("email")}
            className="flex items-center justify-center gap-1 rounded p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-primary"
            title="Share via Email"
          >
            <Mail className="h-4 w-4" />
            <span className="label-mono text-xs hidden sm:inline">Email</span>
          </button>
        </div>
      )}
    </div>
  )
}
