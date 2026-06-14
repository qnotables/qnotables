import { Radio } from "lucide-react"

const columns = [
  {
    title: "Desks",
    links: [
      { label: "World", href: "/#desk-WORLD" },
      { label: "Politics", href: "/#desk-POLITICS" },
      { label: "Defense", href: "/#desk-DEFENSE" },
      { label: "Economy", href: "/#desk-ECONOMY" },
      { label: "Tech", href: "/#desk-TECH" },
      { label: "Science", href: "/#desk-SCIENCE" },
    ],
  },
  {
    title: "Community",
    links: [
      { label: "Field Notes (Blog)", href: "/blog" },
      { label: "The Town Hall (Forum)", href: "/forum" },
      { label: "Sign In", href: "/auth/login" },
      { label: "Create Account", href: "/auth/sign-up" },
    ],
  },
  {
    title: "Access",
    links: [
      { label: "Daily Briefing", href: "#" },
      { label: "Shop", href: "/shop" },
      { label: "RSS Feeds", href: "#" },
      { label: "Contact", href: "#" },
    ],
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
              <span className="stencil text-2xl text-foreground">Hot and Fresh</span>
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
                  <li key={link.label}>
                    <a
                      href={link.href}
                      className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-10 flex flex-col gap-2 border-t border-border pt-5 sm:flex-row sm:items-center sm:justify-between">
          <span className="label-mono text-muted-foreground">
            HOT AND FRESH NEWS DESK // EST. 2026
          </span>
          <span className="label-mono text-muted-foreground">
            AGGREGATED CONTENT LINKS TO ORIGINAL PUBLISHERS
          </span>
        </div>
      </div>
    </footer>
  )
}
