import Link from "next/link"
import { BookOpen, FileText, Users, Settings, Archive, Info } from "lucide-react"

const links = [
  {
    href: "/about",
    icon: Info,
    label: "About",
    description: "Learn about our mission",
  },
  {
    href: "/resources",
    icon: BookOpen,
    label: "Resources",
    description: "Research materials",
  },
  {
    href: "/team",
    icon: Users,
    label: "Team",
    description: "Meet the team",
  },
  {
    href: "/archives",
    icon: Archive,
    label: "Archive",
    description: "Historical records",
  },
  {
    href: "/documents",
    icon: FileText,
    label: "Documents",
    description: "Important files",
  },
  {
    href: "/settings",
    icon: Settings,
    label: "Settings",
    description: "User settings",
  },
]

export function IconLinksCard() {
  return (
    <div className="border border-border bg-card p-6">
      <h2 className="stencil mb-4 text-lg text-foreground">Quick Links</h2>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-2 lg:grid-cols-3">
        {links.map(({ href, icon: Icon, label, description }) => (
          <Link
            key={href}
            href={href}
            className="group flex flex-col items-center gap-2 rounded border border-border/50 p-4 text-center transition-all hover:border-primary hover:bg-muted/30"
          >
            <Icon className="h-6 w-6 text-muted-foreground transition-colors group-hover:text-primary" />
            <span className="label-mono text-sm font-semibold text-foreground">{label}</span>
            <span className="label-mono text-xs text-muted-foreground">{description}</span>
          </Link>
        ))}
      </div>
    </div>
  )
}
