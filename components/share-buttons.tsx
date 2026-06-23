"use client"

import { Share2, Mail, MessageCircle, Link2, Check } from "lucide-react"
import { useState, useRef, useEffect, useCallback } from "react"
import { createShareUrl, type SharePlatform } from "@/lib/rss-utils"

export interface ShareButtonsProps {
  /** Post title used in share text. */
  title?: string
  /** Backward-compatible alias for title. */
  headline?: string
  /** Canonical URL of the post. Falls back to current page URL on the client. */
  url?: string
  /** Short excerpt included in share text where supported. */
  excerpt?: string
  /** Backward-compatible source label, appended to share text. */
  source?: string
  /** Hashtags (without leading #) for platforms that support them. */
  hashtags?: string[]
  className?: string
}

const PLATFORMS: {
  id: SharePlatform
  label: string
  icon: React.ReactNode
}[] = [
  {
    id: "twitter",
    label: "Share on X",
    icon: <span className="label-mono w-4 text-center text-xs font-bold leading-none">X</span>,
  },
  {
    id: "truthsocial",
    label: "Truth Social",
    icon: <span className="label-mono w-4 text-center text-[10px] font-bold leading-none">TS</span>,
  },
  {
    id: "facebook",
    label: "Facebook",
    icon: <span className="label-mono w-4 text-center text-xs font-bold leading-none">f</span>,
  },
  {
    id: "telegram",
    label: "Telegram",
    icon: <MessageCircle className="h-4 w-4 shrink-0" />,
  },
  {
    id: "gab",
    label: "Gab",
    icon: <span className="label-mono w-4 text-center text-xs font-bold leading-none">G</span>,
  },
  {
    id: "gettr",
    label: "Gettr",
    icon: <span className="label-mono w-4 text-center text-[10px] font-bold leading-none">GT</span>,
  },
  {
    id: "email",
    label: "Email",
    icon: <Mail className="h-4 w-4 shrink-0" />,
  },
]

export function ShareButtons({
  title,
  headline,
  url,
  excerpt,
  source,
  hashtags = [],
  className = "",
}: ShareButtonsProps) {
  const [showMenu, setShowMenu] = useState(false)
  const [copied, setCopied] = useState(false)
  const [canNativeShare, setCanNativeShare] = useState(false)
  // Resolve the share URL client-side to avoid hydration mismatches.
  const [shareUrl, setShareUrl] = useState(url || "")

  const containerRef = useRef<HTMLDivElement>(null)

  const shareTitle = title || headline || "HOT AND FRESH"
  const shareExcerpt = excerpt || source

  useEffect(() => {
    if (typeof window !== "undefined") {
      let finalUrl = url || window.location.href
      // Convert relative paths to absolute URLs
      if (finalUrl && !finalUrl.startsWith("http")) {
        finalUrl = `${window.location.origin}${finalUrl}`
      }
      setShareUrl(finalUrl)
    }
    if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
      setCanNativeShare(true)
    }
  }, [url])

  const openShare = useCallback(
    (platform: SharePlatform) => {
      const link = createShareUrl(platform, {
        url: shareUrl,
        title: shareTitle,
        excerpt: shareExcerpt,
        hashtags,
      })
      if (platform === "email") {
        window.location.href = link
      } else {
        window.open(link, "_blank", "noopener,noreferrer,nofollow")
      }
      setShowMenu(false)
    },
    [shareUrl, shareTitle, shareExcerpt, hashtags],
  )

  const copyLink = useCallback(async () => {
    const target = shareUrl || (typeof window !== "undefined" ? window.location.href : "")
    try {
      await navigator.clipboard.writeText(target)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback for older browsers
      try {
        const ta = document.createElement("textarea")
        ta.value = target
        ta.style.position = "fixed"
        ta.style.opacity = "0"
        document.body.appendChild(ta)
        ta.focus()
        ta.select()
        document.execCommand("copy")
        document.body.removeChild(ta)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      } catch {
        // silent fail
      }
    }
    setShowMenu(false)
  }, [shareUrl])

  const nativeShare = useCallback(async () => {
    try {
      await navigator.share({
        title: shareTitle,
        text: shareExcerpt || shareTitle,
        url: shareUrl || window.location.href,
      })
      setShowMenu(false)
    } catch {
      // User cancelled or API unavailable — ignore.
    }
  }, [shareTitle, shareExcerpt, shareUrl])

  // Close on outside click or Escape key.
  useEffect(() => {
    if (!showMenu) return
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowMenu(false)
      }
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") setShowMenu(false)
    }
    document.addEventListener("mousedown", handleClick)
    document.addEventListener("keydown", handleKey)
    return () => {
      document.removeEventListener("mousedown", handleClick)
      document.removeEventListener("keydown", handleKey)
    }
  }, [showMenu])

  const itemClass =
    "flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:bg-muted"

  return (
    <div ref={containerRef} className={`relative inline-block ${className}`}>
      <button
        type="button"
        onClick={() => setShowMenu((s) => !s)}
        className="label-mono flex items-center gap-1.5 text-muted-foreground transition-colors hover:text-primary"
        aria-haspopup="menu"
        aria-expanded={showMenu}
        aria-label="Share this post"
        title="Share this post"
      >
        <Share2 className="h-4 w-4" />
        <span>SHARE</span>
      </button>

      {showMenu && (
        <div
          role="menu"
          aria-label="Share options"
          // Render above or below the trigger — using bottom-full prevents viewport overflow on mobile.
          className="absolute bottom-full left-0 z-50 mb-2 flex min-w-[200px] flex-col rounded border border-border bg-card py-1 shadow-lg"
        >
          {/* Copy link */}
          <button
            type="button"
            onClick={copyLink}
            className={itemClass}
            role="menuitem"
            aria-label={copied ? "Link copied" : "Copy link to clipboard"}
          >
            {copied ? (
              <Check className="h-4 w-4 shrink-0 text-primary" />
            ) : (
              <Link2 className="h-4 w-4 shrink-0" />
            )}
            <span>{copied ? "Copied!" : "Copy Link"}</span>
          </button>

          {/* Native share — only shown when browser supports it */}
          {canNativeShare && (
            <button
              type="button"
              onClick={nativeShare}
              className={itemClass}
              role="menuitem"
              aria-label="Share using device share sheet"
            >
              <Share2 className="h-4 w-4 shrink-0" />
              <span>Share via Device</span>
            </button>
          )}

          <div className="my-1 border-t border-border" role="separator" />

          {/* All platforms */}
          {PLATFORMS.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => openShare(p.id)}
              className={itemClass}
              role="menuitem"
              aria-label={`Share on ${p.label}`}
            >
              {p.icon}
              <span>{p.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
