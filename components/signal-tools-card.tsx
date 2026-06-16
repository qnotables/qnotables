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
    <div className="border border-border bg-background p-4 md:p-5 h-[150px] overflow-hidden">
      <div className="mb-4">
        <h2 className="stencil text-sm font-bold text-foreground">SIGNAL TOOLS</h2>
      </div>

      <div className="flex gap-3">
        {SIGNAL_TOOLS.map((tool) => {
          const Icon = tool.icon
          return (
            <Link
              key={tool.label}
              href={tool.href}
              title={tool.label}
              className="flex-shrink-0 rounded p-1.5 text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary"
            >
              <Icon className="h-6 w-6" aria-hidden="true" />
            </Link>
          )
        })}
      </div>
    </div>
  )
}
