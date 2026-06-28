"use client"

/**
 * EmbedMediaModal — shared between MarkdownEditor and TiptapEditor.
 *
 * A single "Embed Media" toolbar button that opens an inline panel with four
 * input paths:
 *   1. Paste image URL     → onImageUrl(url)
 *   2. Paste video URL     → onEmbedUrl(EmbedData)   (auto-detected provider)
 *   3. Paste iframe code   → onIframeCode(src, title) (sanitized)
 *   4. Social / generic embed URL → same as video URL path
 *
 * The modal auto-detects the input type and routes to the right callback.
 */

import { useEffect, useRef, useState } from "react"
import { Code2, Film, Globe, Image as ImageIcon, Link2, X, AlertCircle, CheckCircle2 } from "lucide-react"
import { detectEmbedUrl, type EmbedData } from "@/lib/tiptap-embed-utils"
import { sanitizeIframeHtml, sanitizeIframeHtmlAny, isHttpsUrl, APPROVED_IFRAME_DOMAINS } from "@/lib/media-utils"

// ─── Types ────────────────────────────────────────────────────────────────────

export interface EmbedMediaModalProps {
  /** Called with an image URL (validated http/https, common extension). */
  onImageUrl: (url: string) => void
  /** Called with resolved embed data for a recognised video provider. */
  onEmbedUrl: (embed: EmbedData) => void
  /**
   * Called with the sanitized iframe src URL (and optional title) when
   * the user pastes raw iframe HTML code.
   */
  onIframeCode: (src: string, title: string) => void
  /**
   * Admin-only: when true, the modal allows embedding arbitrary https
   * websites (any domain) and raw HTML (rendered in a sandboxed iframe).
   * Defaults to false so the forum editor stays restricted.
   */
  allowArbitrary?: boolean
  /** Called with an arbitrary https website URL (only when allowArbitrary). */
  onWebsiteUrl?: (url: string, title: string) => void
  /** Called with raw HTML to embed in a sandboxed iframe (only when allowArbitrary). */
  onHtmlEmbed?: (html: string) => void
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

type InputMode = "url" | "iframe" | "html"

function isImageUrl(raw: string): boolean {
  return (
    /^https?:\/\//i.test(raw) &&
    /\.(jpg|jpeg|png|webp|gif)(\?[^\s]*)?$/i.test(raw)
  )
}

// ─── Component ────────────────────────────────────────────────────────────────

export function EmbedMediaModal({
  onImageUrl,
  onEmbedUrl,
  onIframeCode,
  allowArbitrary = false,
  onWebsiteUrl,
  onHtmlEmbed,
}: EmbedMediaModalProps) {
  const [open, setOpen] = useState(false)
  const [mode, setMode] = useState<InputMode>("url")
  const [inputValue, setInputValue] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement | HTMLInputElement>(null)

  // Close on outside click
  useEffect(() => {
    if (!open) return
    function handleClick(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [open])

  // Focus input when panel opens
  useEffect(() => {
    if (open) {
      setInputValue("")
      setError(null)
      setSuccess(null)
      setTimeout(() => (inputRef.current as HTMLElement | null)?.focus(), 50)
    }
  }, [open])

  function handleSubmit() {
    const raw = inputValue.trim()
    setError(null)
    setSuccess(null)

    if (!raw) {
      setError("Please paste a URL or embed code.")
      return
    }

    if (mode === "html") {
      // Admin-only: raw HTML embed → sandboxed iframe in the editor/renderer
      if (!allowArbitrary || !onHtmlEmbed) {
        setError("Raw HTML embeds are not available here.")
        return
      }
      onHtmlEmbed(raw)
      setSuccess("HTML embedded.")
      setTimeout(() => setOpen(false), 800)
      return
    }

    if (mode === "iframe") {
      // User pasted raw iframe HTML. Admins (allowArbitrary) can use any https
      // domain; everyone else is restricted to the approved allowlist.
      const sanitized = allowArbitrary ? sanitizeIframeHtmlAny(raw) : sanitizeIframeHtml(raw)
      if (!sanitized) {
        setError(
          allowArbitrary
            ? "Could not sanitize that iframe. Make sure it has a valid https src and contains no <script> tags."
            : "Could not sanitize that iframe. Make sure the src domain is in our approved list and there are no script tags.",
        )
        return
      }
      // Extract the src from the sanitized output
      const srcMatch = sanitized.match(/\bsrc="([^"]+)"/i)
      const src = srcMatch?.[1] ?? ""
      const titleMatch = raw.match(/\btitle="([^"]+)"/i)
      const title = titleMatch?.[1] ?? "Embedded content"
      onIframeCode(src, title)
      setSuccess("Iframe embedded.")
      setTimeout(() => setOpen(false), 800)
      return
    }

    // mode === "url"
    // 1. Image URL
    if (isImageUrl(raw)) {
      onImageUrl(raw)
      setSuccess("Image inserted.")
      setTimeout(() => setOpen(false), 800)
      return
    }

    // 2. Known video/social embed URL
    const embed = detectEmbedUrl(raw)
    if (embed) {
      onEmbedUrl(embed)
      setSuccess(`${embed.provider.toUpperCase()} embed inserted.`)
      setTimeout(() => setOpen(false), 800)
      return
    }

    // 3. Admin-only: any other valid https URL → embed the website directly
    if (allowArbitrary && onWebsiteUrl && isHttpsUrl(raw)) {
      onWebsiteUrl(raw, "Embedded website")
      setSuccess("Website embedded.")
      setTimeout(() => setOpen(false), 800)
      return
    }

    // 4. URL but not a recognised embed — show supported formats
    if (/^https?:\/\//i.test(raw)) {
      setError(
        `URL not recognised. Supported formats:\n\nYouTube: youtube.com/watch?v=ID or youtu.be/ID\nRumble: rumble.com/vID or rumble.com/embed/vID/\nOdysee: odysee.com/@channel/video-title\nVimeo: vimeo.com/ID\nX/Twitter: x.com/user/status/ID\nInstagram: instagram.com/p/ID/ or .../reel/ID/\nTikTok: tiktok.com/@user/video/ID or vm.tiktok.com/shortcode\nImages: any .jpg, .png, .webp, .gif\n\nFor custom embeds, use the "Iframe code" tab.`,
      )
      return
    }

    setError("Please paste a valid https:// URL or switch to the Iframe code tab.")
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
    if (e.key === "Escape") {
      setOpen(false)
    }
  }

  const approvedDomainSample = APPROVED_IFRAME_DOMAINS.filter(
    (d) => !d.startsWith("www."),
  )
    .slice(0, 6)
    .join(", ")

  return (
    <div className="relative" ref={panelRef}>
      {/* Trigger button */}
      <button
        type="button"
        title="Embed media (URL or iframe code)"
        onClick={() => setOpen((v) => !v)}
        className={`flex items-center gap-1.5 px-2 py-1.5 transition-colors label-mono text-[11px] ${
          open
            ? "bg-muted text-foreground"
            : "text-muted-foreground hover:bg-muted hover:text-foreground"
        }`}
      >
        <Film className="h-3.5 w-3.5" />
        Embed
      </button>

      {/* Dropdown panel */}
      {open && (
        <div className="absolute left-0 top-full z-50 mt-1 w-80 border border-border bg-background shadow-lg">
          {/* Mode tabs */}
          <div className="flex items-center border-b border-border">
            <button
              type="button"
              onClick={() => { setMode("url"); setError(null) }}
              className={`flex items-center gap-1.5 px-3 py-2 label-mono text-[11px] transition-colors ${
                mode === "url"
                  ? "border-b-2 border-primary text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Link2 className="h-3 w-3" />
              URL / Link
            </button>
            <button
              type="button"
              onClick={() => { setMode("iframe"); setError(null) }}
              className={`flex items-center gap-1.5 px-3 py-2 label-mono text-[11px] transition-colors ${
                mode === "iframe"
                  ? "border-b-2 border-primary text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Code2 className="h-3 w-3" />
              Iframe
            </button>
            {allowArbitrary && (
              <button
                type="button"
                onClick={() => { setMode("html"); setError(null) }}
                className={`flex items-center gap-1.5 px-3 py-2 label-mono text-[11px] transition-colors ${
                  mode === "html"
                    ? "border-b-2 border-primary text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Globe className="h-3 w-3" />
                HTML
              </button>
            )}
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="ml-auto p-2 text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Close"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="p-3 flex flex-col gap-3">
            {mode === "url" ? (
              <>
                <p className="label-mono text-[10px] text-muted-foreground leading-relaxed">
                  {allowArbitrary
                    ? "Paste an image URL, a video/social link (YouTube, Rumble, Odysee, Vimeo, X, Instagram, TikTok), or any https website URL to embed it inline."
                    : "Paste an image URL (.jpg/.png/.webp/.gif) or a link from YouTube, Rumble, Odysee, Vimeo, X/Twitter, Instagram, or TikTok."}
                </p>
                <div className="flex items-center gap-1.5 border border-border bg-muted/30 px-2 py-1">
                  <ImageIcon className="h-3.5 w-3.5 flex-shrink-0 text-muted-foreground" />
                  <input
                    ref={inputRef as React.RefObject<HTMLInputElement>}
                    type="url"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="https://…"
                    className="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
                  />
                </div>
              </>
            ) : mode === "iframe" ? (
              <>
                <p className="label-mono text-[10px] text-muted-foreground leading-relaxed">
                  {allowArbitrary
                    ? "Paste iframe embed code from any https source. Scripts and event handlers are stripped for safety."
                    : `Paste iframe embed code. Approved domains: ${approvedDomainSample}…`}
                </p>
                <textarea
                  ref={inputRef as React.RefObject<HTMLTextAreaElement>}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  rows={4}
                  placeholder={'<iframe src="https://www.youtube-nocookie.com/embed/…" …></iframe>'}
                  className="w-full resize-y border border-border bg-muted/30 px-2 py-1.5 font-mono text-xs text-foreground outline-none placeholder:text-muted-foreground"
                />
              </>
            ) : (
              <>
                <p className="label-mono text-[10px] text-muted-foreground leading-relaxed">
                  Paste raw HTML (widgets, embed codes, custom markup). It renders in a sandboxed iframe isolated from this site, so third-party scripts run safely.
                </p>
                <textarea
                  ref={inputRef as React.RefObject<HTMLTextAreaElement>}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  rows={6}
                  placeholder={'<div>\n  <!-- paste any HTML / embed snippet here -->\n</div>'}
                  className="w-full resize-y border border-border bg-muted/30 px-2 py-1.5 font-mono text-xs text-foreground outline-none placeholder:text-muted-foreground"
                />
                <p className="label-mono text-[10px] text-muted-foreground leading-relaxed">
                  Tip: press Shift+Enter for new lines; Enter to insert.
                </p>
              </>
            )}

            {error && (
              <p className="flex items-start gap-1.5 label-mono text-[10px] text-destructive leading-relaxed">
                <AlertCircle className="h-3 w-3 flex-shrink-0 mt-0.5" />
                {error}
              </p>
            )}

            {success && (
              <p className="flex items-center gap-1.5 label-mono text-[10px] text-green-500">
                <CheckCircle2 className="h-3 w-3" />
                {success}
              </p>
            )}

            <button
              type="button"
              onClick={handleSubmit}
              className="label-mono w-full bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground transition-opacity hover:opacity-90"
            >
              Insert
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
