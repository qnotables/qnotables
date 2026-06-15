"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Menu, X, ExternalLink, Search, ChevronDown, LogOut, Radio } from "lucide-react"
import { DASHBOARD_NAV } from "@/lib/dashboard-nav"
import { cn } from "@/lib/utils"

export function DashboardShell({
  children,
  role = "admin",
}: {
  children: React.ReactNode
  role?: string
}) {
  const pathname = usePathname()
  const router = useRouter()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [accountOpen, setAccountOpen] = useState(false)
  const [query, setQuery] = useState("")

  const isModerator = role === "moderator"
  const navItems = DASHBOARD_NAV.filter((item) => !(item.adminOnly && isModerator))

  // Build breadcrumb segments from the pathname.
  const segments = pathname.split("/").filter(Boolean)
  const crumbs = segments.map((seg, i) => {
    const href = "/" + segments.slice(0, i + 1).join("/")
    const label = seg.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
    return { href, label }
  })

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    const q = query.trim().toLowerCase()
    if (!q) return
    const match = navItems.find((n) => n.label.toLowerCase().includes(q))
    if (match) {
      router.push(match.href)
      setQuery("")
      setDrawerOpen(false)
    }
  }

  async function signOut() {
    await fetch("/api/dashboard/auth", { method: "DELETE" }).catch(() => {})
    router.push("/dashboard/login")
  }

  const SidebarContent = (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 border-b border-border px-4 py-4">
        <span className="flex h-8 w-8 items-center justify-center bg-primary text-primary-foreground">
          <Radio className="h-4 w-4" />
        </span>
        <div className="leading-tight">
          <p className="stencil text-sm text-foreground">HOT AND FRESH</p>
          <p className="label-mono text-[10px] text-muted-foreground">CONTROL ROOM</p>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-2 py-3">
        <ul className="flex flex-col gap-1">
          {navItems.map((item) => {
            const active =
              item.href === "/dashboard"
                ? pathname === "/dashboard"
                : pathname.startsWith(item.href)
            const Icon = item.icon
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={() => setDrawerOpen(false)}
                  className={cn(
                    "label-mono flex items-center gap-3 px-3 py-2 text-sm transition-colors",
                    active
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {item.label}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      <div className="border-t border-border p-2">
        <Link
          href="/"
          className="label-mono flex items-center gap-3 px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <ExternalLink className="h-4 w-4" />
          Back to Site
        </Link>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 hidden w-60 border-r border-border bg-card lg:block">
        {SidebarContent}
      </aside>

      {/* Mobile drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => setDrawerOpen(false)}
            aria-hidden="true"
          />
          <div className="absolute inset-y-0 left-0 w-64 border-r border-border bg-card">
            <button
              type="button"
              onClick={() => setDrawerOpen(false)}
              className="absolute right-2 top-3 p-2 text-muted-foreground hover:text-foreground"
              aria-label="Close menu"
            >
              <X className="h-5 w-5" />
            </button>
            {SidebarContent}
          </div>
        </div>
      )}

      <div className="lg:pl-60">
        {/* Top header */}
        <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border bg-card/95 px-4 backdrop-blur">
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            className="p-2 text-muted-foreground hover:text-foreground lg:hidden"
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>

          <form onSubmit={handleSearch} className="relative hidden flex-1 max-w-sm sm:block">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Quick search sections..."
              className="label-mono w-full border border-border bg-background py-2 pl-9 pr-3 text-sm text-foreground outline-none focus:border-primary"
            />
          </form>

          <div className="ml-auto flex items-center gap-2">
            <span className="label-mono hidden border border-border px-2 py-1 text-[10px] uppercase text-muted-foreground sm:inline">
              {role}
            </span>
            <div className="relative">
              <button
                type="button"
                onClick={() => setAccountOpen((o) => !o)}
                className="flex items-center gap-2 border border-border px-3 py-2 text-sm text-muted-foreground transition-colors hover:border-primary hover:text-foreground"
              >
                <span className="flex h-6 w-6 items-center justify-center bg-primary text-xs font-bold text-primary-foreground">
                  {role.charAt(0).toUpperCase()}
                </span>
                <ChevronDown className="h-4 w-4" />
              </button>
              {accountOpen && (
                <div className="absolute right-0 top-full mt-1 w-44 border border-border bg-card py-1 shadow-lg">
                  <Link
                    href="/"
                    className="label-mono block px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
                  >
                    View Site
                  </Link>
                  <button
                    type="button"
                    onClick={signOut}
                    className="label-mono flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
                  >
                    <LogOut className="h-4 w-4" />
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Breadcrumbs */}
        <div className="border-b border-border bg-background px-4 py-2">
          <nav className="flex items-center gap-2 text-xs" aria-label="Breadcrumb">
            {crumbs.map((c, i) => (
              <span key={c.href} className="flex items-center gap-2">
                {i > 0 && <span className="text-muted-foreground">/</span>}
                {i === crumbs.length - 1 ? (
                  <span className="label-mono text-foreground">{c.label}</span>
                ) : (
                  <Link
                    href={c.href}
                    className="label-mono text-muted-foreground hover:text-foreground"
                  >
                    {c.label}
                  </Link>
                )}
              </span>
            ))}
          </nav>
        </div>

        <main className="p-4 md:p-6">{children}</main>
      </div>
    </div>
  )
}
