"use client"

import { useEffect } from "react"

/** Renders the DailyVerses.net widget with the project's color palette.
 *  The external script is injected once per page load; subsequent renders
 *  (e.g. client-side navigation) reuse the already-loaded script. */
export function DailyVerseWidget() {
  useEffect(() => {
    const wrapperElement = document.getElementById("dailyVersesWrapper")
    if (!wrapperElement) return
    const wrapper = wrapperElement

    function styliseLinks() {
      const links = wrapper.getElementsByTagName("a")
      for (const link of Array.from(links)) {
        // Use the theme's primary token (not a hardcoded hex) so link color
        // stays legible and on-brand in both light and dark mode.
        link.style.color = "var(--primary)"
        link.style.textDecoration = "none"
      }
    }

    const observer = new MutationObserver(() => styliseLinks())
    observer.observe(wrapper, { childList: true, subtree: true })

    // The provider script writes into the wrapper by its fixed ID. Inject it
    // after the wrapper exists on every mount so client-side route changes
    // receive a fresh verse instead of reusing a stale script element.
    const script = document.createElement("script")
    script.src = "https://dailyverses.net/get/verse.js?language=esv"
    script.async = true
    script.defer = true
    document.body.appendChild(script)

    return () => {
      observer.disconnect()
      script.remove()
      wrapper.replaceChildren()
    }
  }, [])

  return (
    <div className="border border-border bg-card p-4">
      <h2 className="label-mono mb-3 text-xs font-semibold text-primary">DAILY VERSE</h2>
      <div
        id="dailyVersesWrapper"
        style={{
          fontFamily: "'Libre Baskerville', serif",
          fontSize: "11pt",
          color: "var(--card-foreground)",
          textAlign: "center",
        }}
      />
    </div>
  )
}
