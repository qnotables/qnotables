import type { LucideIcon } from "lucide-react"
import {
  LayoutDashboard,
  BookOpen,
  Archive,
  FileUp,
  MessageSquare,
  Users,
  Rss,
  ImageIcon,
  Megaphone,
  ShoppingCart,
  ShieldAlert,
  Settings,
  Video,
} from "lucide-react"

export interface NavItem {
  label: string
  href: string
  icon: LucideIcon
  /** Sections moderators may not access (admin only). */
  adminOnly?: boolean
}

export const DASHBOARD_NAV: NavItem[] = [
  { label: "Overview", href: "/dashboard", icon: LayoutDashboard },
  { label: "Blog", href: "/dashboard/blog", icon: BookOpen },
  { label: "Archives", href: "/dashboard/archives", icon: Archive },
  { label: "Import", href: "/dashboard/import", icon: FileUp },
  { label: "Forum", href: "/dashboard/forum", icon: MessageSquare },
  { label: "Users", href: "/dashboard/users", icon: Users, adminOnly: true },
  { label: "RSS Feed", href: "/dashboard/rss", icon: Rss },
  { label: "Media Library", href: "/dashboard/media", icon: ImageIcon },
  { label: "Videos", href: "/dashboard/videos", icon: Video },
  { label: "Ads", href: "/dashboard/ads", icon: Megaphone, adminOnly: true },
  { label: "Shop", href: "/dashboard/shop", icon: ShoppingCart, adminOnly: true },
  { label: "Moderation", href: "/dashboard/moderation", icon: ShieldAlert },
  { label: "Settings", href: "/dashboard/settings", icon: Settings, adminOnly: true },
]
