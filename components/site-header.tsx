"use client"

import { useEffect, useRef, useState } from "react"
import type { FocusEvent } from "react"
import Link from "next/link"
import Image from "next/image"
import {
  ChevronDown,
  Menu,
  MoreHorizontal,
  Radio,
  Search,
  ShoppingBag,
  X,
} from "lucide-react"
import { HeaderMusicPlayer } from "@/components/header-music-player"
import { NewsTicker } from "@/components/news-ticker"
import { categories } from "@/lib/news-data"
import { ThemeToggle } from "@/components/theme-toggle"
import { HeaderAuth } from "@/components/header-auth"
import { useDeskFilter } from "@/components/desk-filter-context"
import { SearchOverlay } from "@/components/search-overlay"

type WireStory = { id: string; headline: string; summary: string; source: string; url?: string }
type Panel = "sections" | "more" | "live" | null

const DESKTOP_COMPACT_AFTER = 160
const DESKTOP_EXPANDED_UNTIL = 72
const MOBILE_HIDE_DISTANCE = 56
const MOBILE_REVEAL_DISTANCE = 20
const SCROLL_JITTER = 3

const secondaryLinks = [
  { label: "ABOUT", href: "/about" },
  { label: "ARCHIVES", href: "/archives" },
  { label: "TOWN HALL", href: "/forum" },
  { label: "NEW TO Q?", href: "/new-to-q" },
]

const allCategories = Array.from(new Set(["NOTABLES", ...categories]))

export function SiteHeader({ wireStories: initialWireStories }: { wireStories?: WireStory[] }) {
  const [now, setNow] = useState("")
  const [wireStories, setWireStories] = useState<WireStory[]>(initialWireStories || [])
  const { active, setActive } = useDeskFilter()
  const [activePanel, setActivePanel] = useState<Panel>(null)
  const [searchOpen, setSearchOpen] = useState(false)
  const [desktopCompactVisible, setDesktopCompactVisible] = useState(false)
  const [mobileCompactVisible, setMobileCompactVisible] = useState(true)
  const [mobileFocusVisible, setMobileFocusVisible] = useState(false)
  const lastScrollYRef = useRef(0)
  const scrollDirectionRef = useRef<"up" | "down" | null>(null)
  const accumulatedScrollRef = useRef(0)
  const tickingRef = useRef(false)
  const lastTriggerRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    const handleScroll = () => {
      if (tickingRef.current) return
      tickingRef.current = true

      window.requestAnimationFrame(() => {
        const currentY = Math.max(0, window.scrollY)
        const delta = currentY - lastScrollYRef.current

        if (currentY <= DESKTOP_EXPANDED_UNTIL) {
          setDesktopCompactVisible(false)
        } else if (currentY >= DESKTOP_COMPACT_AFTER) {
          setDesktopCompactVisible(true)
        }

        if (Math.abs(delta) >= SCROLL_JITTER) {
          const direction = delta > 0 ? "down" : "up"
          if (scrollDirectionRef.current !== direction) {
            scrollDirectionRef.current = direction
            accumulatedScrollRef.current = 0
          }
          accumulatedScrollRef.current += Math.abs(delta)

          if (currentY <= MOBILE_HIDE_DISTANCE) {
            setMobileCompactVisible(true)
            accumulatedScrollRef.current = 0
          } else if (direction === "down" && accumulatedScrollRef.current >= MOBILE_HIDE_DISTANCE) {
            setMobileCompactVisible(false)
            accumulatedScrollRef.current = 0
          } else if (direction === "up" && accumulatedScrollRef.current >= MOBILE_REVEAL_DISTANCE) {
            setMobileCompactVisible(true)
            accumulatedScrollRef.current = 0
          }
        }

        lastScrollYRef.current = currentY
        tickingRef.current = false
      })
    }

    lastScrollYRef.current = Math.max(0, window.scrollY)
    setMobileCompactVisible(lastScrollYRef.current <= MOBILE_HIDE_DISTANCE)
    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  useEffect(() => {
    const tick = () => {
      const time = new Intl.DateTimeFormat("en-US", {
        timeZone: "America/New_York",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
      }).format(new Date())
      setNow(`${time} EST`)
    }
    tick()
    const id = window.setInterval(tick, 1000)
    return () => window.clearInterval(id)
  }, [])

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

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return
      if (searchOpen) {
        setSearchOpen(false)
        return
      }
      if (activePanel) {
        setActivePanel(null)
        window.requestAnimationFrame(() => lastTriggerRef.current?.focus())
      }
    }

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Element | null
      if (target?.closest("[data-site-header]")) return
      setActivePanel(null)
    }

    document.addEventListener("keydown", handleKeyDown)
    document.addEventListener("pointerdown", handlePointerDown)
    return () => {
      document.removeEventListener("keydown", handleKeyDown)
      document.removeEventListener("pointerdown", handlePointerDown)
    }
  }, [activePanel, searchOpen])

  const tickerItems = wireStories.map((story) => ({ headline: story.headline, url: story.url }))
  const mobileVisible = mobileCompactVisible || mobileFocusVisible || activePanel !== null || searchOpen

  function togglePanel(panel: Exclude<Panel, null>, trigger: HTMLElement) {
    lastTriggerRef.current = trigger
    setActivePanel((current) => (current === panel ? null : panel))
  }

  function closePanel() {
    setActivePanel(null)
  }

  function openSearch() {
    setActivePanel(null)
    setSearchOpen(true)
  }

  function selectCategory(category: string) {
    setActive(category)
    closePanel()
  }

  function renderDesks(className: string) {
    return (
      <div className={className}>
        <div className="grid gap-1 sm:grid-cols-2">
          {allCategories.map((category) => (
            <a
              key={category}
              href={category === "NOTABLES" ? "/notables" : `/#desk-${category}`}
              onClick={() => selectCategory(category)}
              className={`label-mono border-l-2 px-3 py-2.5 text-left transition-colors hover:border-primary hover:text-primary ${
                active === category ? "border-primary text-primary" : "border-transparent text-muted-foreground"
              }`}
            >
              {category}
            </a>
          ))}
        </div>
      </div>
    )
  }

  function renderMoreMenu() {
    return (
      <div className="grid gap-2 p-3">
        <Link
          href="https://shop.qnotables.ai"
          onClick={closePanel}
          className="flex items-center gap-2 border border-primary bg-primary px-3 py-2 text-primary-foreground transition-opacity hover:opacity-90"
        >
          <ShoppingBag className="h-4 w-4" />
          <span className="label-mono font-semibold">Shop</span>
        </Link>
        <div className="flex flex-wrap items-center gap-2 border-t border-border pt-2">
          <HeaderAuth />
          <ThemeToggle />
        </div>
      </div>
    )
  }

  function handleHeaderBlur(event: FocusEvent<HTMLElement>) {
    const next = event.relatedTarget as Node | null
    if (!next || !event.currentTarget.contains(next)) setMobileFocusVisible(false)
  }

  return (
    <>
      <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} wireStories={wireStories} />

      <header
        data-site-header
        onBlurCapture={handleHeaderBlur}
        className="relative z-40 w-full border-b border-border bg-background"
      >
        <div className="hidden md:block">
          <div className="h-8 overflow-hidden border-b border-border/60">
            <NewsTicker items={tickerItems} />
          </div>

          <div className="relative flex h-14 items-center justify-between gap-4 px-6">
            <div className="flex min-w-0 items-center gap-4">
              <Link href="/" className="flex shrink-0 items-baseline gap-2" aria-label="Hot and Fresh home">
                <Image src="/us-flag.png" alt="American flag" width={32} height={20} className="h-5 w-8" priority />
                <span className="stencil text-2xl leading-none text-foreground lg:text-3xl">Hot and Fresh</span>
                <span className="label-mono hidden text-primary xl:inline">/ NEWS DESK</span>
              </Link>

              <div className="relative" data-site-header>
                <button
                  type="button"
                  onClick={(event) => togglePanel("live", event.currentTarget)}
                  className="flex min-h-9 items-center gap-2 border border-border px-2.5 text-muted-foreground transition-colors hover:border-primary hover:text-primary"
                  aria-expanded={activePanel === "live"}
                  aria-controls="header-live-panel"
                >
                  <span className="relative flex h-2 w-2" aria-hidden="true">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-70" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
                  </span>
                  <span className="label-mono text-foreground">Live</span>
                  <ChevronDown className={`h-3 w-3 transition-transform ${activePanel === "live" ? "rotate-180" : ""}`} />
                </button>
                {activePanel === "live" && (
                  <div id="header-live-panel" className="absolute left-0 top-full z-50 mt-2 w-[min(22rem,calc(100vw-2rem))] border border-border bg-popover p-3 text-popover-foreground shadow-xl">
                    <div className="mb-3 flex items-center justify-between gap-3 border-b border-border pb-2">
                      <div>
                        <p className="label-mono text-primary">Live desk</p>
                        <p className="text-xs text-muted-foreground">{now || "--:--:-- EST"} · 17 sources monitored</p>
                      </div>
                      <Radio className="h-4 w-4 text-primary" aria-hidden="true" />
                    </div>
                    <HeaderMusicPlayer />
                    <button
                      type="button"
                      onClick={() => window.open("https://rumble.com/c/Qnotables", "rumble_popout", "width=1000,height=700,resizable=yes,scrollbars=yes")}
                      className="mt-3 w-full border border-border px-3 py-2 text-left text-xs text-muted-foreground transition-colors hover:border-primary hover:text-primary"
                    >
                      Open live feed in a new window
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              <button
                type="button"
                onClick={openSearch}
                className="flex min-h-9 items-center gap-2 border border-border px-3 py-2 text-muted-foreground transition-colors hover:border-primary hover:text-primary"
                aria-label="Search dispatches"
              >
                <Search className="h-4 w-4" />
                <span className="label-mono hidden lg:inline">Search</span>
              </button>
              <Link href="https://shop.qnotables.ai" className="flex min-h-9 items-center gap-2 border border-primary bg-primary px-3 py-2 text-primary-foreground transition-opacity hover:opacity-90" aria-label="Visit the shop">
                <ShoppingBag className="h-4 w-4" />
                <span className="label-mono hidden font-semibold lg:inline">Shop</span>
              </Link>
              <HeaderAuth />
              <ThemeToggle />
            </div>
          </div>

          <nav className="flex h-11 items-center gap-0 overflow-x-auto border-t border-border px-6" aria-label="Site navigation">
            {secondaryLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`label-mono shrink-0 border-b-2 border-transparent px-3 py-3 text-muted-foreground transition-colors hover:border-primary hover:text-foreground ${
                  link.label === "TOWN HALL" ? "font-bold text-foreground" : ""
                }`}
              >
                {link.label}
              </Link>
            ))}
            <span className="mx-3 h-4 w-px shrink-0 bg-border" aria-hidden="true" />
            <div className="relative shrink-0" data-site-header>
              <button
                type="button"
                onClick={(event) => togglePanel("sections", event.currentTarget)}
                className="label-mono flex items-center gap-1 border-b-2 border-transparent px-3 py-3 text-muted-foreground transition-colors hover:border-primary hover:text-primary"
                aria-expanded={activePanel === "sections"}
                aria-controls="desktop-desks-panel"
              >
                Desks
                <ChevronDown className={`h-3 w-3 transition-transform ${activePanel === "sections" ? "rotate-180" : ""}`} />
              </button>
              {activePanel === "sections" && (
                <div id="desktop-desks-panel" className="absolute right-0 top-full z-50 mt-1 w-[min(34rem,calc(100vw-3rem))] border border-border bg-popover p-3 text-popover-foreground shadow-xl">
                  {renderDesks("")}
                </div>
              )}
            </div>
          </nav>
        </div>

        <div className="h-14 md:hidden" aria-hidden="true" />
      </header>

      <div
        data-site-header
        onFocusCapture={() => setMobileFocusVisible(true)}
        onBlurCapture={handleHeaderBlur}
        className={`fixed inset-x-0 top-0 z-50 hidden border-b border-border bg-background/95 shadow-lg backdrop-blur transition-transform duration-[220ms] ease-out motion-reduce:transition-none md:block ${
          desktopCompactVisible || activePanel !== null || searchOpen ? "translate-y-0" : "-translate-y-full"
        }`}
      >
        <div className="mx-auto flex h-14 max-w-screen-2xl items-center justify-between gap-3 px-4 md:px-6">
          <Link href="/" className="flex min-w-0 shrink items-center gap-2" aria-label="Hot and Fresh home">
            <Image src="/us-flag.png" alt="American flag" width={28} height={18} className="h-4 w-7 shrink-0" />
            <span className="stencil truncate text-xl leading-none text-foreground md:text-2xl">Hot and Fresh</span>
          </Link>

          <div className="hidden items-center gap-2 md:flex">
            <div className="relative" data-site-header>
              <button
                type="button"
                onClick={(event) => togglePanel("sections", event.currentTarget)}
                className="flex min-h-9 items-center gap-2 border border-border px-3 py-2 text-muted-foreground transition-colors hover:border-primary hover:text-primary"
                aria-expanded={activePanel === "sections"}
                aria-controls="compact-desks-panel"
              >
                <Menu className="h-4 w-4" />
                <span className="label-mono">Desks</span>
              </button>
              {activePanel === "sections" && (
                <div id="compact-desks-panel" className="absolute right-0 top-full z-50 mt-2 w-[min(34rem,calc(100vw-2rem))] border border-border bg-popover p-3 text-popover-foreground shadow-xl">
                  {renderDesks("")}
                </div>
              )}
            </div>
            <button type="button" onClick={openSearch} className="flex min-h-9 items-center gap-2 border border-border px-3 py-2 text-muted-foreground transition-colors hover:border-primary hover:text-primary" aria-label="Search dispatches">
              <Search className="h-4 w-4" />
              <span className="label-mono">Search</span>
            </button>
            <div className="relative" data-site-header>
              <button
                type="button"
                onClick={(event) => togglePanel("more", event.currentTarget)}
                className="flex min-h-9 items-center gap-2 border border-border px-3 py-2 text-muted-foreground transition-colors hover:border-primary hover:text-primary"
                aria-expanded={activePanel === "more"}
                aria-controls="compact-more-panel"
              >
                <MoreHorizontal className="h-4 w-4" />
                <span className="label-mono">More</span>
              </button>
              {activePanel === "more" && (
                <div id="compact-more-panel" className="absolute right-0 top-full z-50 mt-2 w-72 border border-border bg-popover text-popover-foreground shadow-xl">
                  {renderMoreMenu()}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 md:hidden">
            <button type="button" onClick={(event) => togglePanel("sections", event.currentTarget)} className="flex h-10 w-10 items-center justify-center border border-border text-muted-foreground transition-colors hover:border-primary hover:text-primary" aria-label="Open desks" aria-expanded={activePanel === "sections"}>
              {activePanel === "sections" ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </button>
            <button type="button" onClick={openSearch} className="flex h-10 w-10 items-center justify-center border border-border text-muted-foreground transition-colors hover:border-primary hover:text-primary" aria-label="Search dispatches">
              <Search className="h-4 w-4" />
            </button>
            <button type="button" onClick={(event) => togglePanel("more", event.currentTarget)} className="flex h-10 w-10 items-center justify-center border border-border text-muted-foreground transition-colors hover:border-primary hover:text-primary" aria-label="Open account and more menu" aria-expanded={activePanel === "more"}>
              <MoreHorizontal className="h-4 w-4" />
            </button>
          </div>
        </div>

        {activePanel === "sections" && <div className="border-t border-border p-4 md:hidden">{renderDesks("")}</div>}
        {activePanel === "more" && <div className="absolute right-3 top-full w-[min(20rem,calc(100vw-1.5rem))] border border-border bg-popover text-popover-foreground shadow-xl md:hidden">{renderMoreMenu()}</div>}
      </div>

      <div
        data-site-header
        onFocusCapture={() => setMobileFocusVisible(true)}
        onBlurCapture={handleHeaderBlur}
        aria-hidden={!mobileVisible}
        inert={!mobileVisible}
        className={`fixed inset-x-0 top-0 z-50 border-b border-border bg-background/95 shadow-lg backdrop-blur transition-transform duration-[220ms] ease-out motion-reduce:transition-none md:hidden ${
          mobileVisible ? "translate-y-0" : "-translate-y-full"
        }`}
      >
        <div className="flex h-14 items-center justify-between gap-2 px-3">
          <Link href="/" className="flex min-w-0 shrink items-center gap-2" aria-label="Hot and Fresh home">
            <Image src="/us-flag.png" alt="American flag" width={28} height={18} className="h-4 w-7 shrink-0" />
            <span className="stencil truncate text-xl leading-none text-foreground">Hot and Fresh</span>
          </Link>
          <div className="flex shrink-0 items-center gap-2">
            <button type="button" onClick={(event) => togglePanel("sections", event.currentTarget)} className="flex h-10 w-10 items-center justify-center border border-border text-muted-foreground transition-colors hover:border-primary hover:text-primary" aria-label="Open desks" aria-expanded={activePanel === "sections"} aria-controls="mobile-desks-panel">
              {activePanel === "sections" ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </button>
            <button type="button" onClick={openSearch} className="flex h-10 w-10 items-center justify-center border border-border text-muted-foreground transition-colors hover:border-primary hover:text-primary" aria-label="Search dispatches">
              <Search className="h-4 w-4" />
            </button>
            <button type="button" onClick={(event) => togglePanel("more", event.currentTarget)} className="flex h-10 w-10 items-center justify-center border border-border text-muted-foreground transition-colors hover:border-primary hover:text-primary" aria-label="Open account and more menu" aria-expanded={activePanel === "more"} aria-controls="mobile-more-panel">
              <MoreHorizontal className="h-4 w-4" />
            </button>
          </div>
        </div>
        {activePanel === "sections" && <div id="mobile-desks-panel" role="region" aria-label="Site desks" className="border-t border-border bg-background p-4">{renderDesks("")}</div>}
        {activePanel === "more" && <div id="mobile-more-panel" role="region" aria-label="Account and more" className="absolute right-3 top-full w-[min(20rem,calc(100vw-1.5rem))] border border-border bg-popover text-popover-foreground shadow-xl">{renderMoreMenu()}</div>}
      </div>
    </>
  )
}
