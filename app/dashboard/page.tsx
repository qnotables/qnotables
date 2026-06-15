import { redirect } from "next/navigation"
import Link from "next/link"
import { BarChart3, BookOpen, FileUp, Archive, ShoppingCart, Users, Megaphone } from "lucide-react"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { validateDashboardAccess } from "@/lib/dashboard-auth"

export const metadata = {
  title: "Admin Dashboard — Hot and Fresh",
  description: "Manage content, imports, archives, shop, and more.",
}

const DASHBOARD_SECTIONS = [
  {
    title: "Blog",
    description: "Create, edit, and manage blog posts",
    href: "/dashboard/blog",
    icon: BookOpen,
    color: "text-blue-500",
  },
  {
    title: "Import",
    description: "Import posts from CSV, JSON, Markdown, or RSS",
    href: "/dashboard/import",
    icon: FileUp,
    color: "text-green-500",
  },
  {
    title: "Archives",
    description: "Manage and organize archived posts",
    href: "/dashboard/archives",
    icon: Archive,
    color: "text-purple-500",
  },
  {
    title: "Posts",
    description: "View all published posts and statistics",
    href: "/dashboard/posts",
    icon: BarChart3,
    color: "text-orange-500",
  },
  {
    title: "Forum",
    description: "Manage user discussions and forum topics",
    href: "/dashboard/forum",
    icon: Users,
    color: "text-red-500",
  },
  {
    title: "Shop",
    description: "Manage products, orders, and memberships",
    href: "/dashboard/shop",
    icon: ShoppingCart,
    color: "text-pink-500",
  },
  {
    title: "Ads",
    description: "Manage advertisements and promotions",
    href: "/dashboard/ads",
    icon: Megaphone,
    color: "text-cyan-500",
  },
]

export default async function DashboardPage() {
  // Check secret key authentication
  const hasAccess = await validateDashboardAccess()
  if (!hasAccess) {
    redirect("/dashboard/login")
  }

  return (
    <>
      <SiteHeader />
      <main className="min-h-screen bg-background">
        <div className="mx-auto max-w-7xl px-4 py-8 md:px-6 md:py-12">
          {/* Header */}
          <div className="mb-12">
            <h1 className="stencil mb-2 text-3xl text-foreground md:text-4xl">Admin Dashboard</h1>
            <p className="label-mono text-muted-foreground">
              Dashboard access granted. Manage your content and site settings.
            </p>
          </div>

          {/* Dashboard Sections Grid */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {DASHBOARD_SECTIONS.map((section) => {
              const Icon = section.icon
              return (
                <Link
                  key={section.href}
                  href={section.href}
                  className="corner-frame group flex flex-col border border-border bg-card p-6 transition-all hover:border-primary hover:bg-card/80"
                >
                  <div className="mb-3 flex items-center gap-2">
                    <Icon className={`h-6 w-6 ${section.color}`} />
                    <h2 className="stencil text-lg text-foreground">{section.title}</h2>
                  </div>
                  <p className="label-mono text-sm text-muted-foreground flex-1">{section.description}</p>
                  <div className="mt-4 text-xs text-primary opacity-0 transition-opacity group-hover:opacity-100">
                    View →
                  </div>
                </Link>
              )
            })}
          </div>

          {/* Quick Stats */}
          <div className="mt-12 border-t border-border pt-8">
            <h2 className="stencil mb-6 text-xl text-foreground">Quick Stats</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="border border-border bg-card p-4">
                <p className="label-mono text-xs text-muted-foreground">TOTAL POSTS</p>
                <p className="stencil mt-2 text-2xl text-foreground">--</p>
              </div>
              <div className="border border-border bg-card p-4">
                <p className="label-mono text-xs text-muted-foreground">PUBLISHED</p>
                <p className="stencil mt-2 text-2xl text-foreground">--</p>
              </div>
              <div className="border border-border bg-card p-4">
                <p className="label-mono text-xs text-muted-foreground">ACTIVE MEMBERS</p>
                <p className="stencil mt-2 text-2xl text-foreground">--</p>
              </div>
              <div className="border border-border bg-card p-4">
                <p className="label-mono text-xs text-muted-foreground">RECENT ORDERS</p>
                <p className="stencil mt-2 text-2xl text-foreground">--</p>
              </div>
            </div>
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  )
}
