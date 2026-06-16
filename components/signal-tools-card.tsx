import Link from "next/link"
import { Archive, Rss, MessageSquare, FileText, ShoppingBag, Clock } from "lucide-react"

const SIGNAL_TOOLS = [
  {
    label: "Archives",
    description: "Search the record",
    icon: Archive,
    href: "/archives",
  },
  {
    label: "RSS Feed",
    description: "Follow the wire",
    icon: Rss,
    href: "/feed.xml",
  },
  {
    label: "Forum",
    description: "Enter the discussion",
    icon: MessageSquare,
    href: "/forum",
  },
  {
    label: "Field Notes",
    description: "Read the dispatches",
    icon: FileText,
    href: "/blog",
  },
  {
    label: "Shop",
    description: "Support the desk",
    icon: ShoppingBag,
    href: "/shop",
  },
  {
    label: "Timeline",
    description: "Track the sequence",
    icon: Clock,
    href: "/archives/timeline",
  },
]

export function SignalToolsCard() {
  return (
    <div className="border border-border bg-background p-4 md:p-5">
      <div className="mb-4">
        <h2 className="stencil text-sm font-bold text-foreground">SIGNAL TOOLS</h2>
        <p className="label-mono mt-1 text-xs text-muted-foreground">Quick access for the desk.</p>
      </div>

      <div className="space-y-2">
        {SIGNAL_TOOLS.map((tool) => {
          const Icon = tool.icon
          return (
            <Link
              key={tool.label}
              href={tool.href}
              className="group flex items-start gap-3 rounded px-2 py-2 transition-colors hover:bg-primary/10"
            >
              <Icon className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary transition-colors group-hover:text-primary" aria-hidden="true" />
              <div className="flex-1 min-w-0">
                <div className="label-mono text-xs font-semibold text-foreground transition-colors group-hover:text-primary">
                  {tool.label}
                </div>
                <div className="label-mono mt-0.5 text-xs text-muted-foreground transition-colors group-hover:text-muted-foreground">
                  {tool.description}
                </div>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
