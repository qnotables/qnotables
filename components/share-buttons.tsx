"use client"

import { Share2, Mail, MessageCircle, Link2, Check } from "lucide-react"
import { useState, useRef, useEffect, useCallback } from "react"
import { createShareUrl, type SharePlatform } from "@/lib/rss-utils"

export interface ShareButtonsProps {
  /** Preferred title prop. */
  title?: string
  /** Backward-compatible alias for title. */
  headline?: string
  /** Canonical URL of the post. Falls back to current page URL. */
  url?: string
  /** Short excerpt included in share text where supported. */
  excerpt?: string
  /** Backward-compatible source label, appended to share text. */
  source?: string
  /** Hashtags (without leading #) for platforms that support them. */
  hashtags?: string[]
  className?: string
}

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
  const [menuPosition, setMenuPosition] = useState<{ top: string; left: string }>({ top: "0", left: "0" })
  const buttonRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  const shareTitle = title || headline || "HOT AND FRESH"
  const shareExcerpt = excerpt || source

  // Resolve the canonical URL on the client (falls back to current location).
  const [shareUrl, setShareUrl] = useState(url || "")
  useEffect(() => {
    if (url) {
      setShareUrl(url)
    } else if (typeof window !== "undefined") {
      setShareUrl(window.location.href)
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
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Clipboard write failed — fail silently.
    }
  }, [shareUrl])

  const nativeShare = useCallback(async () => {
    try {
      await navigator.share({
        title: shareTitle,
        text: shareExcerpt || shareTitle,
        url: shareUrl,
      })
      setShowMenu(false)
    } catch {
      // User cancelled or share failed — ignore silently.
    }
  }, [shareTitle, shareExcerpt, shareUrl])

  // Position the dropdown menu relative to the trigger button.
  // Uses rAF so the menu node is guaranteed to be in the DOM when we measure.
  useEffect(() => {
    if (!showMenu || !buttonRef.current) return
    const raf = requestAnimationFrame(() => {
      if (!buttonRef.current || !menuRef.current) return
      const btnRect = buttonRef.current.getBoundingClientRect()
      const menuWidth = menuRef.current.offsetWidth || 208 // 52 * 4
      const top = btnRect.bottom + window.scrollY + 8
      // Align menu's right edge with button's right edge, but clamp within viewport.
      const idealLeft = btnRect.right - menuWidth + window.scrollX
      const maxLeft = window.innerWidth - menuWidth - 8 + window.scrollX
      const left = Math.max(8 + window.scrollX, Math.min(idealLeft, maxLeft))
      setMenuPosition({ top: `${top}px`, left: `${left}px` })
    })
    return () => cancelAnimationFrame(raf)
  }, [showMenu])

  // Close on outside click.
  useEffect(() => {
    if (!showMenu) return
    function handle(e: MouseEvent) {
      if (
        menuRef.current &&
        !menuRef.current.contains(e.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(e.target as Node)
      ) {
        setShowMenu(false)
      }
    }
    document.addEventListener("mousedown", handle)
    return () => document.removeEventListener("mousedown", handle)
  }, [showMenu])

  const itemClass =
    "flex items-center gap-2 rounded px-3 py-2 text-left text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-primary"

  return (
    <div className={`relative inline-block ${className}`}>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setShowMenu((s) => !s)}
        className="label-mono flex items-center gap-1 text-muted-foreground transition-colors hover:text-primary"
        aria-haspopup="menu"
        aria-expanded={showMenu}
        title="Share this record"
      >
        <Share2 className="h-4 w-4" /> SHARE
      </button>

      {showMenu && (
        <div
          ref={menuRef}
          role="menu"
          className="fixed z-50 flex w-52 flex-col gap-0.5 rounded border border-border bg-card p-1.5 shadow-lg"
          style={{ top: menuPosition.top, left: menuPosition.left }}
        >
          <button type="button" onClick={copyLink} className={itemClass} role="menuitem">
            {copied ? <Check className="h-4 w-4 text-primary" /> : <Link2 className="h-4 w-4" />}
            {copied ? "Copied" : "Copy Link"}
          </button>

          {canNativeShare && (
            <button type="button" onClick={nativeShare} className={itemClass} role="menuitem">
              <Share2 className="h-4 w-4" /> Share…
            </button>
          )}

          <button type="button" onClick={() => openShare("twitter")} className={itemClass} role="menuitem">
            <span className="label-mono w-4 text-center text-xs font-bold">X</span> Share on X
          </button>
          <button type="button" onClick={() => openShare("facebook")} className={itemClass} role="menuitem">
            <span className="label-mono w-4 text-center text-xs font-bold">f</span> Facebook
          </button>
          <button type="button" onClick={() => openShare("truthsocial")} className={itemClass} role="menuitem">
            <span className="label-mono w-4 text-center text-xs font-bold">TS</span> Truth Social
          </button>
          <button type="button" onClick={() => openShare("telegram")} className={itemClass} role="menuitem">
            <MessageCircle className="h-4 w-4" /> Telegram
          </button>
          <button type="button" onClick={() => openShare("email")} className={itemClass} role="menuitem">
            <Mail className="h-4 w-4" /> Email
          </button>
        </div>
      )}
    </div>
  )
}
