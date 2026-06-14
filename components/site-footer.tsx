import { Radio } from "lucide-react"

const columns = [
  {
    title: "Desks",
    links: ["World", "Politics", "Defense", "Economy", "Tech", "Science"],
  },
  {
    title: "Organization",
    links: ["About", "Editorial Standards", "Source List", "Corrections", "Careers"],
  },
  {
    title: "Access",
    links: ["Daily Briefing", "Wire API", "RSS Feeds", "Mobile", "Contact"],
  },
]

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-card">
      <div className="mx-auto max-w-7xl px-4 py-10 md:px-6">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2">
              <Radio className="h-6 w-6 text-primary" aria-hidden="true" />
              <span className="stencil text-2xl text-foreground">Dispatch</span>
            </div>
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-muted-foreground">
              An independent aggregator ranking verified reporting from trusted
              wire services and publications worldwide.
            </p>
          </div>

          {columns.map((col) => (
            <div key={col.title}>
              <h3 className="label-mono text-primary">{col.title}</h3>
              <ul className="mt-3 space-y-2">
                {col.links.map((link) => (
                  <li key={link}>
                    <a
                      href="#"
                      className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-10 flex flex-col gap-2 border-t border-border pt-5 sm:flex-row sm:items-center sm:justify-between">
          <span className="label-mono text-muted-foreground">
            DISPATCH INTEL DESK // EST. 2026
          </span>
          <span className="label-mono text-muted-foreground">
            AGGREGATED CONTENT LINKS TO ORIGINAL PUBLISHERS
          </span>
        </div>
      </div>
    </footer>
  )
}
