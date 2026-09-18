"use client"

import { RefreshCw } from "lucide-react"
import { useEffect, useState } from "react"

interface EmbedSite {
  id: string
  label: string
  tag: string
  url: string
}

const SITES: EmbedSite[] = [
   {
    id: "qresearch",
    label: "QResearch",
    tag: "",
    url: "https://8kun.top/qresearch/res/24671999.html#bottom",
  },
  {
    id: "qresearch-catalog",
    label: "/QResearch/",
    tag: "",
    url: "https://8kun.top/qresearch/catalog.html",
  },
  {
    id: "qalerts",
    label: "QAlerts",
    tag: "",
    url: "https://qalerts.app",
  },
  {
    id: "projectDComms",
    label: "ProjectDComms",
    tag: "",
    url: "https://8kun.top/projectdcomms/catalog.html",
  },
 {
    id: "You Are The News",
    label: "You Are The News",
    tag: "",
    url: "https://youarethe.news/",
  },
 {
    id: "Watkins Report",
    label: "Watkins Report",
    tag: "",
    url: "https://www.watkinsreport.com/",
  },
   {
    id: "Jiffy",
    label: "Jiffy",
    tag: "",
    url: "https://jiffy.news/",
  },
  {
    id: "Qagg",
    label: "Qagg",
    tag: "",
    url: "https://Qagg.news/",
  },
]

function EmbedPanel({ site, active, learnMoreUrl }: { site: EmbedSite; active: boolean; learnMoreUrl?: string }) {
  const [loaded, setLoaded] = useState(false)
  const [slow, setSlow] = useState(false)

  useEffect(() => {
    if (loaded) return
    const timeout = window.setTimeout(() => setSlow(true), 15_000)
    return () => window.clearTimeout(timeout)
  }, [loaded])

  return (
    <div className="absolute inset-0" style={{ display: active ? "block" : "none" }}>
      <iframe
        src={site.url}
        title={site.label}
        className="h-full w-full border-0"
        sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox"
        onLoad={() => setLoaded(true)}
      />
      {!loaded && (
        <div className="absolute inset-x-0 top-0 z-10 border-b border-border bg-card/95">
          <div
            role="progressbar"
            aria-label={`Loading ${site.label}`}
            className="h-1 overflow-hidden bg-primary/15"
          >
            <div className="embed-loading-bar h-full w-1/3 bg-primary" />
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-xs">
            <p role="status" className="text-muted-foreground">
              {loaded ? site.label : slow ? `${site.label} is taking longer than expected.` : `Loading ${site.label}…`}
            </p>
            {loaded && learnMoreUrl && (
              <a href={learnMoreUrl} target="_blank" rel="noopener noreferrer" className="text-primary underline">
                click here to learn more
              </a>
            )}
            {!loaded && slow && (
              <a href={site.url} target="_blank" rel="noopener noreferrer" className="text-primary underline">
                Open {site.label} directly →
              </a>
            )}
          </div>
        </div>
      )}
      <style jsx>{`
        .embed-loading-bar { animation: embed-loading 1.5s ease-in-out infinite; }
        @keyframes embed-loading {
          from { transform: translateX(-100%); }
          to { transform: translateX(300%); }
        }
        @media (prefers-reduced-motion: reduce) {
          .embed-loading-bar { animation: none; width: 100%; opacity: 0.6; }
        }
      `}</style>
    </div>
  )
}

export function SiteSwitcherEmbed({ learnMoreUrl }: { learnMoreUrl?: string } = {}) {
  const [activeId, setActiveId] = useState(SITES[0].id)
  const [refreshKeys, setRefreshKeys] = useState<Record<string, number>>({})
  const active = SITES.find((s) => s.id === activeId) ?? SITES[0]

  return (
    <div className="mb-6 border border-border bg-card overflow-hidden">
      {/* Header bar with site switcher */}
      <div className="flex flex-wrap items-center gap-0 border-b border-border bg-muted/60">
        {/* Site tabs */}
        <div className="flex items-center flex-1 min-w-0 overflow-x-auto scrollbar-none">
          {SITES.map((site) => (
            <button
              key={site.id}
              onClick={() => setActiveId(site.id)}
              className={`flex items-center gap-1.5 px-4 py-2.5 label-mono text-xs font-bold tracking-widest whitespace-nowrap border-r border-border transition-colors ${
                activeId === site.id
                  ? "text-primary bg-primary/10 border-b-2 border-b-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              }`}
              aria-current={activeId === site.id ? "true" : undefined}
            >
              <span
                className={`h-1.5 w-1.5 rounded-full flex-shrink-0 ${
                  activeId === site.id ? "bg-primary" : "bg-muted-foreground"
                }`}
                aria-hidden="true"
              />
              <span className="hidden sm:inline text-[10px] opacity-60 mr-0.5">{site.tag}</span>
              {site.label}
            </button>
          ))}
        </div>

        {/* Embedded site controls */}
        <div className="ml-auto flex items-center">
          <button
            type="button"
            onClick={() => setRefreshKeys((keys) => ({ ...keys, [activeId]: (keys[activeId] ?? 0) + 1 }))}
            className="label-mono inline-flex items-center gap-1.5 whitespace-nowrap px-3 py-2.5 text-xs text-primary transition-colors hover:bg-primary/10 hover:underline"
            aria-label={`Refresh ${active.label}`}
            title={`Refresh ${active.label}`}
          >
            <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
          </button>
          <a
            href={active.url}
            target="_blank"
            rel="noopener noreferrer"
            className="label-mono inline-flex h-10 w-10 items-center justify-center text-base text-primary transition-colors hover:bg-primary/10 hover:underline"
            aria-label={`Open ${active.label} in a new tab`}
            title={`Open ${active.label} in a new tab`}
          >
            <span aria-hidden="true">→</span>
          </a>
        </div>
      </div>

      {/* Iframes — all rendered at once to preserve navigation state, only active one is visible */}
      <div className="relative w-full" style={{ height: "800px" }}>
        {SITES.map((site) => (
          <EmbedPanel key={`${site.id}-${refreshKeys[site.id] ?? 0}`} site={site} active={activeId === site.id} learnMoreUrl={learnMoreUrl} />
        ))}
      </div>
    </div>
  )
}
