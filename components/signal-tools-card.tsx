import Link from "next/link"
import { Archive, Rss, MessageSquare, Radio, ShoppingBag, Clock, LayoutDashboard, Shield, ShieldPlus, Mail, AtSignIcon, Bookmark, FormInput, FolderPlusIcon, Heart, Clapperboard, NotebookPen } from "lucide-react"

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
    label: "Revolution Radio",
    description: "Tune in live",
    icon: Radio,
    href: "https://revolution.radio",
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
    label: "Fullchan",
    description: "Open the board",
    icon: NotebookPen,
    href: "https://fullchan.net",
  },
  {
    label: "bookmarks",
    description: "Share a resource",
    icon: Bookmark,
    href: "/bookmarks",
  },
  {
    label: "Videos",
    description: "Watch the feed",
    icon: Clapperboard,
    href: "/videos",
  },
{
    label: "Shop",
    description: "Support the desk",
    icon: ShoppingBag,
    href: "https://shop.qnotables.ai",
  },
  {
    label: "Donate",
    description: "Support crypto",
    icon: Heart,
    href: "/donate",
  },
  {
    label: "Contact",
    description: "Send a message",
    icon: Mail,
    href: "mailto:contact@qnotables.ai",
  },
]

export function SignalToolsCard() {
  return (
    <div className="border border-border bg-background p-4 md:p-5 overflow-hidden">
      <div className="mb-4">
        <h2 className="stencil text-sm font-bold text-foreground">SIGNAL TOOLS</h2>
      </div>

      <div className="flex justify-center gap-3 mb-4">
        {SIGNAL_TOOLS.map((tool) => {
          const Icon = tool.icon
          const isExternal = tool.href.startsWith("http") || tool.href.startsWith("mailto:")
          return (
            <Link
              key={tool.label}
              href={tool.href}
              title={tool.label}
              {...(isExternal ? { target: "_blank", rel: "noopener noreferrer" } : {})}
              className="flex-shrink-0 rounded p-1.5 text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary"
            >
              <Icon className="h-6 w-6" aria-hidden="true" />
            </Link>
          )
        })}
      </div>

      <div>
        <div className="flex justify-center gap-3">
          {SIGNAL_TOOLS_SECONDARY.map((tool) => {
            const Icon = tool.icon
            const isExternal = (tool.href || "").startsWith("http") || (tool.href || "").startsWith("mailto:")
            return (
              <Link
                key={tool.label}
                href={tool.href || "#"}
                title={tool.label}
                {...(isExternal ? { target: "_blank", rel: "noopener noreferrer" } : {})}
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
