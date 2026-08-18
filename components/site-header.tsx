"use client"

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { Menu, Search, ShoppingBag } from "lucide-react"
import { HeaderMusicPlayer } from "@/components/header-music-player"
import { NewsTicker } from "@/components/news-ticker"
import { categories } from "@/lib/news-data"
import { ThemeToggle } from "@/components/theme-toggle"
import { HeaderAuth } from "@/components/header-auth"
import { useDeskFilter } from "@/components/desk-filter-context"
import { SearchOverlay } from "@/components/search-overlay"

type WireStory = { id: string; headline: string; summary: string; source: string; url?: string }

// Scroll must move at least this many pixels before we react, so accidental
// or tiny scroll jitter doesn't flicker the header.
const SCROLL_DELTA_THRESHOLD = 10
// The header is never hidden until the page has scrolled past this point.
const HIDE_AFTER_SCROLL_Y = 80

export function SiteHeader({ wireStories: initialWireStories }: { wireStories?: WireStory[] }) {
  const [now, setNow] = useState<string>("")
  const [wireStories, setWireStories] = useState<WireStory[]>(initialWireStories || [])
  const { active, setActive } = useDeskFilter()
  const [menuOpen, setMenuOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)

  const headerRef = useRef<HTMLElement>(null)
  const [headerHeight, setHeaderHeight] = useState(0)
  const [hiddenByScroll, setHiddenByScroll] = useState(false)
  const lastScrollYRef = useRef(0)
  const tickingRef = useRef(false)

  // Measure the real header height (ticker + status bar + masthead + nav can
  // all vary by breakpoint/content) so we can reserve the same space below it
  // and avoid layout shift.
  useLayoutEffect(() => {
    const el = headerRef.current
    if (!el) return

    const updateHeight = () => setHeaderHeight(el.offsetHeight)
    updateHeight()

    const resizeObserver = new ResizeObserver(updateHeight)
    resizeObserver.observe(el)
    return () => resizeObserver.disconnect()
  }, [])

  // Scroll-direction show/hide with a threshold and a "don't hide near the
  // top" guard. Uses a passive listener + requestAnimationFrame so it never
  // blocks scrolling.
  useEffect(() => {
    lastScrollYRef.current = window.scrollY

    const handleScroll = () => {
      if (tickingRef.current) return
      tickingRef.current = true

      requestAnimationFrame(() => {
        const currentY = window.scrollY
        const delta = currentY - lastScrollYRef.current

        if (currentY <= HIDE_AFTER_SCROLL_Y) {
          setHiddenByScroll(false)
          lastScrollYRef.current = currentY
          tickingRef.current = false
          return
        }

        if (Math.abs(delta) < SCROLL_DELTA_THRESHOLD) {
          tickingRef.current = false
          return
        }

        setHiddenByScroll(delta > 0)
        lastScrollYRef.current = currentY
        tickingRef.current = false
      })
    }

    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  // Anything happening inside the header (focus, mobile menu, search) always
  // wins over the scroll-driven hide state.
  const showHeader = !hiddenByScroll || menuOpen || searchOpen

  const revealHeader = useCallback(() => setHiddenByScroll(false), [])

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

  // Fetch wire stories on mount if not provided as prop
  useEffect(() => {
    if (initialWireStories && initialWireStories.length > 0) {
      setWireStories(initialWireStories)
      return
    }

    const fetchWireStories = async () => {
      try {
        const response = await fetch("/api/wire-feed", { cache: "no-store" })
        if (response.ok) {
          const data = await response.json()
          setWireStories(data.stories || [])
        }
      } catch (error) {
        console.error("[v0] Failed to fetch wire stories:", error)
      }
    }

    fetchWireStories()
  }, [initialWireStories])

  // Prepare ticker items from wire stories
  const tickerItems = wireStories.map((s) => ({ headline: s.headline, url: s.url }))

  return (
    <>
      <SearchOverlay
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
        wireStories={wireStories}
      />
      <header
        ref={headerRef}
        onFocusCapture={revealHeader}
        className="fixed inset-x-0 top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur transition-transform duration-[220ms] ease-out motion-reduce:transition-none"
        style={{ transform: showHeader ? "translateY(0)" : "translateY(-100%)" }}
      >
        {/* ticker */}
        <NewsTicker items={tickerItems} />

        {/* status bar */}
      <div className="flex items-center justify-between border-b border-border/60 px-4 py-1.5 italic text-muted-foreground md:px-6">
        <button
          type="button"
          onClick={() => {
            window.open(
              "https://rumble.com/c/Qnotables",
              "rumble_popout",
              "width=1000,height=700,resizable=yes,scrollbars=yes"
            )
          }}
          className="flex items-center gap-2 transition-colors hover:text-primary"
        >
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-70" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
          </span>
          <span className="label-mono text-foreground hover:text-primary">LIVE FEED</span>
          <span className="label-mono hidden sm:inline">// 17 SOURCES MONITORED</span>
        </button>
        <div className="flex items-center gap-3">
          <HeaderMusicPlayer />
          <span className="label-mono tabular-nums">{now || "--:--:-- EST"}</span>
        </div>
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
          <a href="/" className="flex items-baseline gap-2">
            <Image
              src="/us-flag.png"
              alt="American flag"
              width={32}
              height={20}
              className="h-5 w-8"
              priority
            />
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
            href="https://shop.qnotables.ai"
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
        {Array.from(new Set(["NOTABLES", ...categories])).map((cat) => (
          <a
            key={cat}
            href={cat === "NOTABLES" ? "/notables" : `/#desk-${cat}`}
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
          { label: "ABOUT", href: "/about" },
          { label: "ARCHIVES", href: "/archives" },
          { label: "TOWN HALL", href: "/forum" },
          { label: "NEW TO Q?", href: "/new-to-q" },
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

    {/* Reserves space for the now-fixed header so page content doesn't jump
        underneath it. Kept in sync with the header's real, measured height. */}
    <div aria-hidden="true" style={{ height: headerHeight }} />
    </>
  )
}
