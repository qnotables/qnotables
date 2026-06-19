import Link from "next/link"
import { Archive, Rss, MessageSquare, FileText, ShoppingBag, Clock, LayoutDashboard, Shield } from "lucide-react"

const SIGNAL_TOOLS = [
  {
    label: "Dashboard",
    description: "View the desk",
    icon: LayoutDashboard,
    href: "/dashboard",
  },
  {
    label: "Archives",
    description: "Search the record",
    icon: Archive,
    href: "/archives",
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
    href: "https://shop.qnotables.ai",
  },
  {
    label: "Timeline",
    description: "Track the sequence",
    icon: Clock,
    href: "/archives/timeline",
  }, 
  {
    label: "RSS Feed",
    description: "Follow the wire",
    icon: Rss,
    href: "/feed.xml",
  },
]

const SIGNAL_TOOLS_SECONDARY = [
  {
    label: "Qresearch",
    description: "Configure link",
    icon: Shield,
    href: "8ch.net/qresearch/catalog.html",
  },
  {
    label: "Qalerts",
    description: "Configure link",
    icon: Shield,
    href: "https:www.qalerts.app",
  },
  {
    label: "External Tool 3",
    description: "Configure link",
    icon: Rss,
    href: "",
  },
  {
    label: "External Tool 4",
    description: "Configure link",
    icon: MessageSquare,
    href: "",
  },
  {
    label: "External Tool 5",
    description: "Configure link",
    icon: FileText,
    href: "",
  },
  {
    label: "External Tool 6",
    description: "Configure link",
    icon: ShoppingBag,
    href: "",
  },
  {
    label: "External Tool 7",
    description: "Configure link",
    icon: Clock,
    href: "",
  },
]

export function SignalToolsCard() {
  return (
    <div className="border border-border bg-background p-4 md:p-5 overflow-hidden">
      <div className="mb-4">
        <h2 className="stencil text-sm font-bold text-foreground">SIGNAL TOOLS</h2>
      </div>

      <div className="flex gap-3 mb-4">
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

      <div>
        <div className="flex gap-3">
          {SIGNAL_TOOLS_SECONDARY.map((tool) => {
            const Icon = tool.icon
            return (
              <Link
                key={tool.label}
                href={tool.href || "#"}
                title={tool.label}
                className="flex-shrink-0 rounded p-1.5 text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary disabled:opacity-50"
              >
                <Icon className="h-6 w-6" aria-hidden="true" />
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}
