"use client"

import { Share2, Mail, MessageCircle, Link2, Check } from "lucide-react"
import { useState, useRef, useEffect, useCallback } from "react"
import { createPortal } from "react-dom"
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
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 })

  const containerRef = useRef<HTMLDivElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

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

  // Render the menu at the document level so card overflow cannot clip it.
  // Keep it aligned to the trigger and inside the viewport while open.
  useEffect(() => {
    if (!showMenu) return

    function positionMenu() {
      const trigger = containerRef.current?.getBoundingClientRect()
      if (!trigger) return
      const menuWidth = 208
      const menuHeight = menuRef.current?.offsetHeight ?? 360
      const gap = 8
      const left = Math.min(Math.max(8, trigger.right - menuWidth), window.innerWidth - menuWidth - 8)
      const top = trigger.top >= menuHeight + gap
        ? trigger.top - menuHeight - gap
        : Math.min(trigger.bottom + gap, window.innerHeight - menuHeight - 8)
      setMenuPosition({ top: Math.max(8, top), left })
    }

    function handleClick(e: MouseEvent) {
      const target = e.target as Node
      if (!containerRef.current?.contains(target) && !menuRef.current?.contains(target)) {
        setShowMenu(false)
      }
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") setShowMenu(false)
    }

    positionMenu()
    window.addEventListener("resize", positionMenu)
    window.addEventListener("scroll", positionMenu, true)
    document.addEventListener("mousedown", handleClick)
    document.addEventListener("keydown", handleKey)
    return () => {
      window.removeEventListener("resize", positionMenu)
      window.removeEventListener("scroll", positionMenu, true)
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

      {showMenu && typeof document !== "undefined" && createPortal(
        <div
          ref={menuRef}
          role="menu"
          aria-label="Share options"
          className="fixed z-50 flex min-w-52 flex-col rounded border border-border bg-card py-1 shadow-lg"
          style={{ top: menuPosition.top, left: menuPosition.left }}
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
        </div>,
        document.body,
      )}
    </div>
  )
}
