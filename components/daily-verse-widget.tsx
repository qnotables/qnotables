"use client"

import { useEffect } from "react"

/** Renders the DailyVerses.net widget with the project's color palette.
 *  The external script is injected once per page load; subsequent renders
 *  (e.g. client-side navigation) reuse the already-loaded script. */
export function DailyVerseWidget() {
  useEffect(() => {
    // Only inject the script once — guard against re-renders / route changes.
    const SCRIPT_ID = "daily-verses-script"
    if (document.getElementById(SCRIPT_ID)) return

    const script = document.createElement("script")
    script.id = SCRIPT_ID
    script.src = "https://dailyverses.net/get/verse.js?language=esv"
    script.async = true
    script.defer = true
    document.body.appendChild(script)

    // After the script populates the wrapper, style any injected links.
    const wrapper = document.getElementById("dailyVersesWrapper")
    if (!wrapper) return

    function styliseLinks() {
      const links = document.getElementById("dailyVersesWrapper")?.getElementsByTagName("a") ?? []
      for (const link of Array.from(links)) {
        link.style.color = "#fb8122"
        link.style.textDecoration = "none"
      }
    }

    const observer = new MutationObserver((mutations) => {
      for (const m of mutations) {
        if (m.addedNodes.length) {
          styliseLinks()
        }
      }
    })

    observer.observe(wrapper, { childList: true, subtree: true })

    return () => observer.disconnect()
  }, [])

  return (
    <div className="border border-border bg-card p-4">
      <h2 className="label-mono mb-3 text-xs font-semibold text-primary">DAILY VERSE</h2>
      <div
        id="dailyVersesWrapper"
        style={{
          fontFamily: "'Libre Baskerville', serif",
          fontSize: "11pt",
          color: "#eef2ff",
          textAlign: "center",
        }}
      />
    </div>
  )
}
