"use client"

import { useActionState, useMemo, useState } from "react"
import Link from "next/link"
import {
  ArrowUpRight,
  ChevronRight,
  CircleCheck,
  ExternalLink,
  icons,
  Mail,
  Radio,
  Search,
} from "lucide-react"
import { subscribeToNewsletter } from "@/app/new-to-q/actions"
import { initialNewsletterState } from "@/app/new-to-q/newsletter-state"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import type { FooterConfig, FooterLink, FooterSocialProfile } from "@/lib/footer-config"

const iconAliases: Record<string, string> = {
  twitter: "AtSign",
  youtube: "Clapperboard",
}

function toLucideComponentName(name: string): string {
  return name
    .trim()
    .replace(/^lucide[-_:]/i, "")
    .split(/[^a-zA-Z0-9]+/)
    .filter(Boolean)
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
    .join("")
}

function footerLinkGroups(config: FooterConfig, placement: "footer" | "explore" | "legal") {
  const groups = new Map<string, FooterLink[]>()
  for (const link of config.links.filter((item) => item.enabled && item.placement === placement).sort((a, b) => a.sortOrder - b.sortOrder)) {
    const group = groups.get(link.category) ?? []
    group.push(link)
    groups.set(link.category, group)
  }
  return [...groups.entries()].map(([title, links]) => ({ title, links }))
}

function isExternalFooterHref(href: string): boolean {
  return /^https?:\/\//i.test(href)
}

function FooterIcon({ name }: { name: string }) {
  const normalizedName = name.trim().toLowerCase()
  const componentName = iconAliases[normalizedName] ?? toLucideComponentName(name)
  const Icon = icons[componentName as keyof typeof icons] ?? ArrowUpRight
  return <Icon className="size-4 shrink-0" aria-hidden="true" />
}

function FooterLinkItem({ link, compact = false }: { link: FooterLink; compact?: boolean }) {
  const content = (
    <>
      <FooterIcon name={link.icon} />
      <span className="min-w-0">
        <span className="block truncate">{link.label}</span>
        {!compact && link.description ? (
          <span className="mt-1 block text-xs normal-case tracking-normal text-muted-foreground">
            {link.description}
          </span>
        ) : null}
      </span>
      {isExternalFooterHref(link.href) || link.href.startsWith("mailto:") ? (
        <ExternalLink className="ml-auto size-3.5 shrink-0 opacity-60" aria-hidden="true" />
      ) : null}
    </>
  )

  const className = compact
    ? "group flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    : "group flex items-start gap-3 border border-transparent px-3 py-3 text-left text-sm transition-colors hover:border-border hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"

  if (link.openInNewTab || isExternalFooterHref(link.href) || link.href.startsWith("mailto:")) {
    return (
      <a href={link.href} target={link.openInNewTab ? "_blank" : undefined} rel={link.openInNewTab ? "noreferrer" : undefined} className={className}>
        {content}
      </a>
    )
  }

  return <Link href={link.href} className={className}>{content}</Link>
}

function NewsletterBlock({ config }: { config: FooterConfig }) {
  const [state, formAction, pending] = useActionState(subscribeToNewsletter, initialNewsletterState)
  return (
    <div className="flex flex-col gap-4 border border-border bg-card/50 p-5">
      <div className="flex items-center gap-2 text-primary">
        <Mail className="size-4" aria-hidden="true" />
        <span className="label-mono">The briefing</span>
      </div>
      <div className="flex flex-col gap-2">
        <h3 className="stencil text-xl text-foreground">{config.newsletterTitle}</h3>
        <p className="text-sm leading-6 text-muted-foreground">{config.newsletterDescription}</p>
      </div>
      {state.status === "success" ? (
        <p className="text-sm leading-6 text-primary" role="status" aria-live="polite">{state.message}</p>
      ) : (
        <form action={formAction} className="flex flex-col gap-2 sm:flex-row">
          <label className="sr-only" htmlFor="footer-newsletter-email">Email address</label>
          <Input id="footer-newsletter-email" name="email" type="email" inputMode="email" autoComplete="email" placeholder="you@example.com" required maxLength={254} disabled={pending} className="min-w-0 flex-1" />
          <input type="hidden" name="source" value="footer" />
          <Button type="submit" variant="default" disabled={pending}>{pending ? "Joining..." : "Join"}</Button>
        </form>
      )}
      {state.status === "error" ? <p className="text-xs text-destructive" role="alert">{state.message}</p> : null}
      <p className="text-xs leading-5 text-muted-foreground">No spam. Unsubscribe whenever you like.</p>
    </div>
  )
}

function ExploreDialog({ config }: { config: FooterConfig }) {
  const [query, setQuery] = useState("")
  const groups = footerLinkGroups(config, "explore")
  const footerGroups = footerLinkGroups(config, "footer")
  const allGroups = [...footerGroups, ...groups]
  const normalizedQuery = query.trim().toLowerCase()
  const filteredGroups = allGroups
    .map((group) => ({ ...group, links: group.links.filter((link) => `${link.label} ${link.description}`.toLowerCase().includes(normalizedQuery)) }))
    .filter((group) => group.links.length > 0)

  return (
    <Dialog>
      <DialogTrigger render={<Button variant="outline" size="lg" />}>Explore QNotables <ArrowUpRight data-icon="inline-end" /></DialogTrigger>
      <DialogContent className="max-h-[min(760px,calc(100vh-2rem))] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <p className="label-mono text-primary">Site directory</p>
          <DialogTitle className="stencil text-2xl">Explore QNotables</DialogTitle>
          <DialogDescription>Navigate the desks, archive, and community spaces from one place.</DialogDescription>
        </DialogHeader>
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Filter destinations" aria-label="Filter destinations" className="pl-9" />
        </div>
        <div className="grid gap-6 sm:grid-cols-2">
          {filteredGroups.map((group) => (
            <section key={group.title} className="flex flex-col gap-2">
              <h3 className="label-mono text-primary">{group.title}</h3>
              <div className="flex flex-col gap-1">
                {group.links.map((link) => <FooterLinkItem key={link.id} link={link} />)}
              </div>
            </section>
          ))}
          {filteredGroups.length === 0 ? <p className="text-sm text-muted-foreground">No destinations match that search.</p> : null}
        </div>
      </DialogContent>
    </Dialog>
  )
}

function SocialLinks({ profiles }: { profiles: FooterSocialProfile[] }) {
  return (
    <div className="flex items-center gap-2">
      {profiles.filter((profile) => profile.enabled).map((profile) => (
        <a key={profile.id} href={profile.href} target="_blank" rel="noreferrer" aria-label={profile.label} className="flex size-9 items-center justify-center border border-border text-muted-foreground transition-colors hover:border-primary hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
          <FooterIcon name={profile.icon} />
        </a>
      ))}
    </div>
  )
}

export function SiteFooterClient({ config, preview = false }: { config: FooterConfig; preview?: boolean }) {
  const footerGroups = useMemo(() => footerLinkGroups(config, "footer"), [config])
  const legalLinks = useMemo(() => config.links.filter((link) => link.enabled && link.placement === "legal").sort((a, b) => a.sortOrder - b.sortOrder), [config])
  const year = new Date().getFullYear()

  return (
    <footer className="border-t border-border bg-card" aria-label="Site footer">
      <div className="mx-auto flex max-w-7xl flex-col gap-10 px-4 py-12 md:px-6 md:py-14">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex max-w-xl flex-col gap-4">
            <div className="flex items-center gap-3">
              <span className="flex size-9 items-center justify-center bg-primary text-primary-foreground"><Radio className="size-4" aria-hidden="true" /></span>
              <div>
                <p className="label-mono text-primary">{config.eyebrow}</p>
                <p className="stencil text-2xl text-foreground">{config.siteName}</p>
              </div>
            </div>
            <p className="max-w-lg text-sm leading-6 text-muted-foreground">{config.mission}</p>
            <div className="flex flex-wrap items-center gap-4">
              {config.showStatus ? <span className="label-mono inline-flex items-center gap-2 text-muted-foreground"><CircleCheck className="size-3.5 text-primary" aria-hidden="true" />{config.statusLabel}</span> : null}
              <SocialLinks profiles={config.socialProfiles} />
            </div>
          </div>
          <div className="flex flex-col items-start gap-3 lg:items-end">
            <ExploreDialog config={config} />
            <p className="max-w-xs text-left text-xs leading-5 text-muted-foreground lg:text-right">The complete directory, grouped by desk and kept in one accessible place.</p>
          </div>
        </div>

        <nav aria-label="Footer navigation" className="grid gap-8 border-y border-border py-8 sm:grid-cols-2 lg:grid-cols-4">
          {footerGroups.map((group) => (
            <section key={group.title} className="flex flex-col gap-3">
              <h2 className="label-mono text-primary">{group.title}</h2>
              <ul className="flex flex-col gap-2">
                {group.links.map((link) => <li key={link.id}><FooterLinkItem link={link} compact /></li>)}
              </ul>
            </section>
          ))}
        </nav>

        {!preview ? <NewsletterBlock config={config} /> : null}

        <div className="flex flex-col gap-4 border-t border-border pt-5 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <span className="label-mono">{config.copyrightText.replace("{year}", String(year))}</span>
            {legalLinks.map((link) => <FooterLinkItem key={link.id} link={link} compact />)}
          </div>
          <button type="button" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} className="label-mono inline-flex items-center gap-2 self-start text-muted-foreground transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:self-auto" aria-label={config.backToTopLabel}>
            {config.backToTopLabel}<ChevronRight className="size-3 -rotate-90" aria-hidden="true" />
          </button>
        </div>
      </div>
    </footer>
  )
}
