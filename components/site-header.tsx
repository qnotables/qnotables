"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Menu, Radio, Search, ShoppingBag } from "lucide-react"
import { categories } from "@/lib/news-data"
import { ThemeToggle } from "@/components/theme-toggle"
import { HeaderAuth } from "@/components/header-auth"
import { useDeskFilter } from "@/components/desk-filter-context"
import { SearchOverlay } from "@/components/search-overlay"

type WireStory = { id: string; headline: string; summary: string; source: string; url?: string }

export function SiteHeader({ wireStories }: { wireStories?: WireStory[] }) {
  const [now, setNow] = useState<string>("")
  const { active, setActive } = useDeskFilter()
  const [menuOpen, setMenuOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)

  useEffect(() => {
    const tick = () => {
      const d = new Date()
      const est = new Intl.DateTimeFormat("en-US", {
        timeZone: "America/New_York",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
      }).format(d)
      setNow(`${est} EST`)
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [])

  return (
    <>
      <SearchOverlay
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
        wireStories={wireStories}
      />
    <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur">
      {/* status bar */}
      <div className="flex items-center justify-between border-b border-border/60 px-4 py-1.5 italic text-muted-foreground md:px-6">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-70" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
          </span>
          <span className="label-mono text-foreground">LIVE FEED</span>
          <span className="label-mono hidden sm:inline">// 17 SOURCES MONITORED</span>
        </div>
        <span className="label-mono tabular-nums">{now || "--:--:-- EST"}</span>
      </div>

      {/* masthead */}
      <div className="flex items-center justify-between px-4 py-4 md:px-6">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            className="flex h-9 w-9 items-center justify-center border border-border text-foreground transition-colors hover:border-primary hover:text-primary md:hidden"
            aria-label="Toggle navigation menu"
            aria-expanded={menuOpen}
          >
            <Menu className="h-4 w-4" />
          </button>
          <a href="#top" className="flex items-baseline gap-2">
            <Radio className="h-6 w-6 text-primary" aria-hidden="true" />
            <span className="stencil text-2xl leading-none text-foreground md:text-3xl">
              Hot and Fresh
            </span>
            <span className="label-mono hidden text-primary sm:inline">/ NEWS DESK</span>
          </a>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setSearchOpen(true)}
            className="hidden items-center gap-2 border border-border px-3 py-2 text-muted-foreground transition-colors hover:border-primary hover:text-primary sm:flex"
            aria-label="Search dispatches"
          >
            <Search className="h-4 w-4" />
            <span className="label-mono hidden md:inline">Search</span>
          </button>
          <Link
            href="/shop"
            className="flex items-center gap-2 border border-primary bg-primary px-3 py-2 text-primary-foreground transition-opacity hover:opacity-90"
            aria-label="Visit the shop"
          >
            <ShoppingBag className="h-4 w-4" />
            <span className="label-mono hidden font-semibold md:inline">Shop</span>
          </Link>
          <HeaderAuth />
          <ThemeToggle />
        </div>
      </div>

      {/* category nav */}
      <nav
        className={`${
          menuOpen ? "flex" : "hidden"
        } flex-col gap-1 border-t border-border px-4 pb-3 md:flex md:flex-row md:items-center md:gap-0 md:border-t md:px-6 md:py-0`}
        aria-label="News categories"
      >
        {["ALL", ...categories].map((cat) => (
          <a
            key={cat}
            href={cat === "ALL" ? "/#wire" : `/#desk-${cat}`}
            onClick={() => {
              setActive(cat)
              setMenuOpen(false)
            }}
            className={`label-mono border-l-2 px-3 py-2 text-left transition-colors md:border-l-0 md:border-b-2 ${
              active === cat
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {cat}
          </a>
        ))}

        {/* section links to other parts of the site */}
        <span className="my-1 hidden h-4 w-px bg-border md:mx-2 md:inline-block" aria-hidden="true" />
        {[
          { label: "BLOG", href: "/blog" },
          { label: "FORUM", href: "/forum" },
        ].map((link) => (
          <Link
            key={link.href}
            href={link.href}
            onClick={() => setMenuOpen(false)}
            className="label-mono border-l-2 border-transparent px-3 py-2 text-left text-muted-foreground transition-colors hover:text-foreground md:border-l-0 md:border-b-2"
          >
            {link.label}
          </Link>
        ))}
      </nav>
    </header>
    </>
  )
}
