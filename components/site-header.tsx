"use client"

import { useEffect, useRef, useState } from "react"
import type { FocusEvent } from "react"
import Link from "next/link"
import Image from "next/image"
import { usePathname, useRouter } from "next/navigation"
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
import { LiveChatButton } from "@/components/live-chat-dialog"
import { LivePresenceLabel, useLivePresence } from "@/components/live-presence"
import { NewsTicker } from "@/components/news-ticker"
import { categories } from "@/lib/news-data"
import { ThemeToggle } from "@/components/theme-toggle"
import { HeaderAuth } from "@/components/header-auth"
import { useDeskFilter } from "@/components/desk-filter-context"

type WireStory = { id: string; headline: string; summary: string; source: string; url?: string }
type Panel = "sections" | "more" | "live" | null

const DESKTOP_COMPACT_AFTER = 160
const DESKTOP_EXPANDED_UNTIL = 72
const MOBILE_SCROLL_THRESHOLD = 10
const MOBILE_NEAR_TOP = 12

const secondaryLinks = [
  { label: "TOWN HALL", href: "/forum" },
  { label: "ARCHIVES", href: "/archives" },
  { label: "MY SIGNALS", href: "/account/signals" },
  { label: "ABOUT", href: "/about" },
  { label: "NEW TO Q", href: "/new-to-q" },
]

const allCategories = Array.from(new Set(["NOTABLES", ...categories]))

export function SiteHeader({ wireStories: initialWireStories }: { wireStories?: WireStory[] }) {
  const [now, setNow] = useState("")
  const onlineCount = useLivePresence()
  const [wireStories, setWireStories] = useState<WireStory[]>(initialWireStories || [])
  const { active, setActive } = useDeskFilter()
  const [activePanel, setActivePanel] = useState<Panel>(null)
  const router = useRouter()
  const pathname = usePathname()
  const [desktopCompactVisible, setDesktopCompactVisible] = useState(false)
  const [mobileCompactVisible, setMobileCompactVisible] = useState(true)
  const [mobileFocusVisible, setMobileFocusVisible] = useState(false)
  const lastScrollYRef = useRef(0)
  const scrollDirectionRef = useRef<"up" | "down" | null>(null)
  const accumulatedScrollRef = useRef(0)
  const tickingRef = useRef(false)
  const lastTriggerRef = useRef<HTMLElement | null>(null)
  const mobileMenuButtonRef = useRef<HTMLButtonElement | null>(null)
  const mobileMenuRef = useRef<HTMLDivElement | null>(null)
  const menuOpenRef = useRef(false)
  const mobileFocusRef = useRef(false)
  const savedScrollYRef = useRef<number | null>(null)

  useEffect(() => {
    const handleScroll = () => {
      if (tickingRef.current) return
      tickingRef.current = true

      window.requestAnimationFrame(() => {
        const currentY = Math.max(0, window.scrollY)
        const delta = currentY - lastScrollYRef.current
        const isMobile = window.matchMedia("(max-width: 767px)").matches

        if (currentY <= DESKTOP_EXPANDED_UNTIL) {
          setDesktopCompactVisible(false)
        } else if (currentY >= DESKTOP_COMPACT_AFTER) {
          setDesktopCompactVisible(true)
        }

        if (isMobile && !menuOpenRef.current && !mobileFocusRef.current && Math.abs(delta) >= MOBILE_SCROLL_THRESHOLD) {
          const direction = delta > 0 ? "down" : "up"
          if (scrollDirectionRef.current !== direction) {
            scrollDirectionRef.current = direction
            accumulatedScrollRef.current = 0
          }
          accumulatedScrollRef.current += Math.abs(delta)

          if (currentY <= MOBILE_NEAR_TOP) {
            setMobileCompactVisible(true)
            accumulatedScrollRef.current = 0
          } else if (accumulatedScrollRef.current >= MOBILE_SCROLL_THRESHOLD) {
            setMobileCompactVisible(direction === "up")
            accumulatedScrollRef.current = 0
          }
        } else if (isMobile && (menuOpenRef.current || mobileFocusRef.current || currentY <= MOBILE_NEAR_TOP)) {
          setMobileCompactVisible(true)
          accumulatedScrollRef.current = 0
        }

        lastScrollYRef.current = currentY
        tickingRef.current = false
      })
    }

    lastScrollYRef.current = Math.max(0, window.scrollY)
    setMobileCompactVisible(true)
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

  const mobileMenuOpen = activePanel === "more"

  useEffect(() => {
    const isMobile = window.matchMedia("(max-width: 767px)").matches
    menuOpenRef.current = Boolean(mobileMenuOpen && isMobile)
    if (!mobileMenuOpen || !isMobile) return

    const scrollY = window.scrollY
    savedScrollYRef.current = scrollY
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth
    const body = document.body
    const previous = {
      position: body.style.position,
      top: body.style.top,
      width: body.style.width,
      overflow: body.style.overflow,
      paddingRight: body.style.paddingRight,
    }

    body.style.position = "fixed"
    body.style.top = `-${scrollY}px`
    body.style.width = "100%"
    body.style.overflow = "hidden"
    if (scrollbarWidth > 0) body.style.paddingRight = `${scrollbarWidth}px`

    window.requestAnimationFrame(() => mobileMenuRef.current?.querySelector<HTMLElement>("a, button, [tabindex='0']")?.focus())

    return () => {
      body.style.position = previous.position
      body.style.top = previous.top
      body.style.width = previous.width
      body.style.overflow = previous.overflow
      body.style.paddingRight = previous.paddingRight
      const restoreY = savedScrollYRef.current
      savedScrollYRef.current = null
      menuOpenRef.current = false
      if (restoreY !== null) window.scrollTo(0, restoreY)
      window.requestAnimationFrame(() => mobileMenuButtonRef.current?.focus())
    }
  }, [mobileMenuOpen])

  useEffect(() => {
    if (!mobileMenuOpen || !window.matchMedia("(max-width: 767px)").matches || !mobileMenuRef.current) return
    const menu = mobileMenuRef.current
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault()
        closeMobileMenu()
        return
      }
      if (event.key !== "Tab") return
      const focusable = Array.from(menu.querySelectorAll<HTMLElement>("a, button, [tabindex='0']"))
      if (focusable.length === 0) return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }
    menu.addEventListener("keydown", handleKeyDown)
    return () => menu.removeEventListener("keydown", handleKeyDown)
  }, [mobileMenuOpen])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape" || !activePanel) return
      if (mobileMenuOpen) closeMobileMenu()
      else {
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
  }, [activePanel, mobileMenuOpen])

  useEffect(() => {
    setActivePanel(null)
  }, [pathname])

  useEffect(() => {
    if (!window.matchMedia("(min-width: 768px)").matches) return
    setActivePanel((current) => {
      if (desktopCompactVisible && current === "live") return null
      if (!desktopCompactVisible && current === "more") return null
      return current
    })
  }, [desktopCompactVisible])

  const tickerItems = wireStories.map((story) => ({ headline: story.headline, url: story.url }))
  const mobileVisible = mobileCompactVisible || mobileFocusVisible || mobileMenuOpen

  function togglePanel(panel: Exclude<Panel, null>, trigger: HTMLElement) {
    lastTriggerRef.current = trigger
    setActivePanel((current) => (current === panel ? null : panel))
  }

  function closePanel() {
    setActivePanel(null)
  }

  function closeMobileMenu() {
    setActivePanel(null)
    setMobileFocusVisible(false)
  }

  function openSearch() {
    setActivePanel(null)
    router.push("/search")
  }

  function selectCategory(category: string) {
    setActive(category)
    closePanel()
  }

  function renderDesks(className: string) {
    return (
      <div className={className}>
        <div className="grid grid-cols-2 gap-1">
          {allCategories.map((category) => (
            <a
              key={category}
              href={category === "NOTABLES" ? "/notables" : `/#desk-${category}`}
              onClick={() => selectCategory(category)}
              className={`label-mono flex min-h-11 items-center border-l-2 px-3 py-2 text-left transition-colors hover:border-primary hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                active === category ? "border-primary text-primary" : "border-transparent text-foreground/75"
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
      <div className="grid min-w-0 gap-2 p-3">
        <a
          href="https://shop.qnotables.ai"
          onClick={closePanel}
          className="flex min-w-0 w-full items-center gap-2 border border-primary bg-primary px-3 py-2 text-primary-foreground transition-opacity hover:opacity-90"
        >
          <ShoppingBag className="h-4 w-4" />
          <span className="label-mono font-semibold">Shop</span>
        </a>
        <div className="grid min-w-0 grid-cols-2 gap-2 border-t border-border pt-2">
          {secondaryLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={closePanel}
              className="label-mono flex min-h-11 min-w-0 w-full items-center justify-center border border-border px-3 py-2 text-center text-foreground/75 transition-colors hover:border-primary hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {link.label}
            </Link>
          ))}
        </div>
      </div>
    )
  }

  function handleHeaderBlur(event: FocusEvent<HTMLElement>) {
    const next = event.relatedTarget as Node | null
    if (!next || !event.currentTarget.contains(next)) {
      mobileFocusRef.current = false
      setMobileFocusVisible(false)
    }
  }

  function handleHeaderFocus() {
    mobileFocusRef.current = true
    setMobileFocusVisible(true)
  }

  return (
    <>
      <header
        data-site-header
        onBlurCapture={handleHeaderBlur}
        aria-hidden={desktopCompactVisible}
        inert={desktopCompactVisible}
        className="relative z-40 w-full border-b border-border bg-background"
      >
        <div className="hidden md:block">
          <div className="h-8 overflow-hidden border-b border-border/60">
            <NewsTicker items={tickerItems} />
          </div>

          <div className="relative flex h-14 items-center justify-between gap-4 px-6">
            <div className="flex min-w-0 items-center gap-4">
              <Link href="/" className="flex shrink-0 items-baseline gap-2" aria-label="QNotables home">
                <Image src="/us-flag.png" alt="American flag" width={32} height={20} className="h-5 w-auto" priority />
                <span className="stencil text-2xl leading-none text-foreground lg:text-3xl">QNotables</span>
                <span className="label-mono hidden text-primary xl:inline">/ NEWS DESK</span>
              </Link>

              <div className="relative" data-site-header>
                <button
                  type="button"
                  onClick={(event) => togglePanel("live", event.currentTarget)}
                  className="flex min-h-9 items-center gap-2 border border-border px-2.5 text-muted-foreground transition-colors hover:border-primary hover:text-primary"
                  aria-expanded={activePanel === "live" && !desktopCompactVisible}
                  aria-controls="header-live-panel"
                >
                  <span className="relative flex h-2 w-2" aria-hidden="true">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-70" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
                  </span>
                  <span className="label-mono text-foreground">Live</span>
                  <LivePresenceLabel onlineCount={onlineCount} />
                  <ChevronDown className={`h-3 w-3 transition-transform ${activePanel === "live" ? "rotate-180" : ""}`} />
                </button>
                {activePanel === "live" && !desktopCompactVisible && (
                  <div id="header-live-panel" className="absolute left-0 top-full z-50 mt-2 w-[min(22rem,calc(100vw-2rem))] border border-border bg-popover p-3 text-popover-foreground shadow-xl">
                    <div className="mb-3 flex items-center justify-between gap-3 border-b border-border pb-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="label-mono text-primary">Live desk</p>
                          <LivePresenceLabel onlineCount={onlineCount} />
                        </div>
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
              <LiveChatButton onlineCount={onlineCount} />
              <HeaderAuth />
              <ThemeToggle />
            </div>
          </div>

          <nav className="flex h-11 items-center gap-0 overflow-visible border-t border-border px-6" aria-label="Site navigation">
            {secondaryLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`label-mono shrink-0 border-b-2 border-transparent px-3 py-3 text-foreground/75 transition-colors hover:border-primary hover:text-foreground ${
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
                className="label-mono flex items-center gap-1 border-b-2 border-transparent px-3 py-3 text-foreground/75 transition-colors hover:border-primary hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                aria-expanded={activePanel === "sections"}
                aria-controls="desktop-desks-panel"
              >
                Desks
                <ChevronDown className={`h-3 w-3 transition-transform ${activePanel === "sections" ? "rotate-180" : ""}`} />
              </button>
              {activePanel === "sections" && (
                <div id="desktop-desks-panel" className="absolute left-0 top-full z-50 mt-1 w-[min(34rem,calc(100vw-3rem))] border border-border bg-popover p-3 text-popover-foreground shadow-xl">
                  {renderDesks("")}
                </div>
              )}
            </div>
          </nav>
        </div>

        <div className="md:hidden">
          <div className="h-8 overflow-hidden border-b border-border/60">
            <NewsTicker items={tickerItems} />
          </div>
          <div className="h-[var(--mobile-header-height)]" aria-hidden="true" />
        </div>
      </header>

      <div
        data-site-header
        onBlurCapture={handleHeaderBlur}
        aria-hidden={!desktopCompactVisible}
        inert={!desktopCompactVisible}
        className={`fixed inset-x-0 top-0 z-50 hidden border-b border-border bg-background/95 shadow-lg backdrop-blur transition-transform duration-[220ms] ease-out motion-reduce:transition-none md:block ${
          desktopCompactVisible ? "translate-y-0" : "-translate-y-full"
        }`}
      >
        <div className="mx-auto flex h-14 max-w-screen-2xl items-center justify-between gap-3 px-4 md:px-6">
          <Link href="/" className="flex min-w-0 shrink items-center gap-2" aria-label="QNotables home">
            <Image src="/us-flag.png" alt="American flag" width={28} height={18} className="h-4 w-auto shrink-0" />
            <span className="stencil truncate text-xl leading-none text-foreground md:text-2xl">QNotables</span>
          </Link>

          <div className="hidden items-center gap-2 md:flex">
            <div className="relative" data-site-header>
              <button
                type="button"
                onClick={(event) => togglePanel("sections", event.currentTarget)}
                className="flex min-h-9 items-center gap-2 border border-border px-3 py-2 text-muted-foreground transition-colors hover:border-primary hover:text-primary"
                aria-expanded={activePanel === "sections" && desktopCompactVisible}
                aria-controls="compact-desks-panel"
              >
                <Menu className="h-4 w-4" />
                <span className="label-mono">Desks</span>
              </button>
              {activePanel === "sections" && desktopCompactVisible && (
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
                aria-expanded={activePanel === "more" && desktopCompactVisible}
                aria-controls="compact-more-panel"
              >
                <MoreHorizontal className="h-4 w-4" />
                <span className="label-mono">More</span>
              </button>
              {activePanel === "more" && desktopCompactVisible && (
                <div id="compact-more-panel" className="absolute right-0 top-full z-50 mt-2 w-72 border border-border bg-popover text-popover-foreground shadow-xl">
                  {renderMoreMenu()}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 md:hidden">
            <button type="button" onClick={(event) => togglePanel("sections", event.currentTarget)} className="flex h-11 w-11 items-center justify-center border border-border text-muted-foreground transition-colors hover:border-primary hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" aria-label="Open desks" aria-expanded={activePanel === "sections"}>
              {activePanel === "sections" ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </button>
            <button type="button" onClick={openSearch} className="flex h-11 w-11 items-center justify-center border border-border text-muted-foreground transition-colors hover:border-primary hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" aria-label="Search dispatches">
              <Search className="h-4 w-4" />
            </button>
            <button type="button" onClick={(event) => togglePanel("more", event.currentTarget)} className="flex h-11 w-11 items-center justify-center border border-border text-muted-foreground transition-colors hover:border-primary hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" aria-label="Open account and more menu" aria-expanded={activePanel === "more"}>
              <MoreHorizontal className="h-4 w-4" />
            </button>
          </div>
        </div>


      </div>

      <div
        data-site-header
        onFocusCapture={handleHeaderFocus}
        onBlurCapture={handleHeaderBlur}
        aria-hidden={!mobileVisible}
        inert={!mobileVisible}
        className={`fixed inset-x-0 top-[var(--ticker-height)] z-50 border-b border-border bg-background/95 shadow-lg backdrop-blur transition-transform duration-[220ms] ease-out motion-reduce:transition-none md:hidden ${
          mobileVisible ? "translate-y-0" : "-translate-y-full"
        }`}
      >
        <div className="flex h-14 min-w-0 items-center justify-between gap-2 px-3">
          <Link href="/" className="flex min-w-0 shrink items-center gap-2" aria-label="QNotables home">
            <Image src="/us-flag.png" alt="American flag" width={28} height={18} className="h-4 w-auto shrink-0" />
            <span className="stencil truncate text-xl leading-none text-foreground">QNotables</span>
          </Link>
          <div className="flex shrink-0 items-center gap-2">
            <button type="button" onClick={openSearch} className="flex h-11 w-11 items-center justify-center border border-border text-muted-foreground transition-colors hover:border-primary hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" aria-label="Search dispatches">
              <Search className="h-4 w-4" />
            </button>
            <button ref={mobileMenuButtonRef} type="button" onClick={(event) => togglePanel("more", event.currentTarget)} className="flex h-11 w-11 items-center justify-center border border-border text-muted-foreground transition-colors hover:border-primary hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" aria-label={mobileMenuOpen ? "Close mobile menu" : "Open mobile menu"} aria-expanded={mobileMenuOpen} aria-controls="mobile-more-panel">
              {activePanel === "more" ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </button>
          </div>
        </div>
      </div>

      {mobileMenuOpen && (
        <div ref={mobileMenuRef} data-site-header id="mobile-more-panel" role="dialog" aria-modal="true" aria-label="Mobile navigation and account" className="fixed inset-x-0 top-[var(--mobile-nav-top)] z-[60] h-[calc(100dvh-var(--mobile-nav-top)-env(safe-area-inset-bottom))] overflow-y-auto overscroll-contain border-t border-border bg-popover text-popover-foreground shadow-xl md:hidden">
          <div className="border-b border-border bg-background p-3">{renderDesks("")}</div>
          {renderMoreMenu()}
        </div>
      )}

      {mobileMenuOpen && (
        <button
          type="button"
          aria-label="Close menu"
          onClick={closeMobileMenu}
          className="fixed inset-x-0 bottom-0 top-[var(--mobile-nav-top)] z-50 bg-background/60 md:hidden"
        />
      )}
    </>
  )
}
