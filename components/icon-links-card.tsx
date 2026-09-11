import Link from "next/link"
import { FileText, Users, Settings, Archive, Info, Video } from "lucide-react"

const links = [
  {
    href: "/about",
    icon: Info,
    label: "About",
  },
  {
    href: "/archives",
    icon: Archive,
    label: "Archive",
  },
  {
    href: "/team",
    icon: Users,
    label: "Team",
  },
  {
    href: "/archives/documents",
    icon: FileText,
    label: "Documents",
  },
  {
    href: "/dashboard/settings",
    icon: Settings,
    label: "Settings",
  },
  {
    href: "/videos",
    icon: Video,
    label: "Videos",
  },
]

export function IconLinksCard() {
  return (
    <div className="border border-border bg-card p-6">
      <h2 className="stencil mb-4 text-lg text-foreground">Quick Links</h2>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-2 lg:grid-cols-3">
        {links.map(({ href, icon: Icon, label }) => (
          <Link
            key={label}
            href={href}
            className="group flex flex-col items-center gap-3 rounded border border-border/50 p-4 text-center transition-all hover:border-primary hover:bg-muted/30"
          >
            <Icon className="h-6 w-6 text-muted-foreground transition-colors group-hover:text-primary" />
            <span className="label-mono text-sm font-semibold text-foreground">{label}</span>
          </Link>
        ))}
      </div>
    </div>
  )
}
