"use client"

import { useState } from "react"

interface EmbedSite {
  id: string
  label: string
  tag: string
  url: string
}

const SITES: EmbedSite[] = [
   {
    id: "qresearch-latest",
    label: "QResearch Latest",
    tag: "",
    url: "https://8kun.top/qresearch/res/24671999.html#bottom",
  },
  {
    id: "qresearch-catalog",
    label: "QResearch Catalog",
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
    id: "Jiffy",
    label: "Jiffy",
    tag: "",
    url: "https://jiffy.news/",
  },
 {
    id: "You Are The News",
    label: "You Are The News",
    tag: "",
    url: "https://youarethe.news/",
  },
]

export function SiteSwitcherEmbed() {
  const [activeId, setActiveId] = useState(SITES[0].id)
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

        {/* Open in new tab link */}
        <a
          href={active.url}
          target="_blank"
          rel="noopener noreferrer"
          className="label-mono text-xs text-primary hover:underline whitespace-nowrap px-4 py-2.5 ml-auto"
        >
          OPEN IN NEW TAB →
        </a>
      </div>

      {/* Iframe */}
      <div className="relative w-full" style={{ height: "1300px" }}>
        <iframe
          key={activeId}
          src={active.url}
          title={active.label}
          className="absolute inset-0 h-full w-full border-0"
          loading="lazy"
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox"
        />
      </div>
    </div>
  )
}
