import "server-only"

import { revalidatePath, revalidateTag, unstable_cache } from "next/cache"
import { createAdminClient } from "@/lib/supabase/admin"
import { validateDashboardAccess } from "@/lib/dashboard-auth"
import { logActivity } from "@/lib/dashboard-data"

export type FooterLinkPlacement = "footer" | "explore" | "legal"

export type FooterLink = {
  id: string
  label: string
  href: string
  description: string
  category: string
  placement: FooterLinkPlacement
  icon: string
  enabled: boolean
  openInNewTab: boolean
  sortOrder: number
}

export type FooterSocialProfile = {
  id: string
  platform: string
  label: string
  href: string
  icon: string
  enabled: boolean
  sortOrder: number
}

export type FooterConfig = {
  siteName: string
  eyebrow: string
  mission: string
  newsletterTitle: string
  newsletterDescription: string
  copyrightText: string
  statusLabel: string
  showStatus: boolean
  backToTopLabel: string
  links: FooterLink[]
  socialProfiles: FooterSocialProfile[]
}

type FooterRow = {
  draft_config: unknown
  published_config: unknown
}

const DEFAULT_CONFIG: FooterConfig = {
  siteName: "HOT AND FRESH",
  eyebrow: "QNOTABLES / INDEPENDENT SIGNAL",
  mission:
    "An independent aggregator ranking verified reporting from trusted wire services and publications worldwide.",
  newsletterTitle: "Keep the signal close.",
  newsletterDescription:
    "Occasional dispatches about the archive, the town hall, and what is worth your attention.",
  copyrightText: "QNOTABLES // ALL RIGHTS RESERVED",
  statusLabel: "SYSTEMS OPERATIONAL",
  showStatus: true,
  backToTopLabel: "Back to top",
  links: [
    { id: "world", label: "World", href: "/#desk-WORLD", description: "Reporting beyond the local horizon.", category: "Desks", placement: "footer", icon: "Globe2", enabled: true, openInNewTab: false, sortOrder: 10 },
    { id: "politics", label: "Politics", href: "/#desk-POLITICS", description: "Power, policy, and public record.", category: "Desks", placement: "footer", icon: "Landmark", enabled: true, openInNewTab: false, sortOrder: 20 },
    { id: "defense", label: "Defense", href: "/#desk-DEFENSE", description: "Security and strategic affairs.", category: "Desks", placement: "footer", icon: "Shield", enabled: true, openInNewTab: false, sortOrder: 30 },
    { id: "economy", label: "Economy", href: "/#desk-ECONOMY", description: "Markets, labor, and material life.", category: "Desks", placement: "footer", icon: "ChartNoAxesCombined", enabled: true, openInNewTab: false, sortOrder: 40 },
    { id: "tech", label: "Tech", href: "/#desk-TECH", description: "Tools reshaping the present.", category: "Desks", placement: "footer", icon: "Cpu", enabled: true, openInNewTab: false, sortOrder: 50 },
    { id: "science", label: "Science", href: "/#desk-SCIENCE", description: "Evidence, research, and discovery.", category: "Desks", placement: "footer", icon: "FlaskConical", enabled: true, openInNewTab: false, sortOrder: 60 },
    { id: "archives", label: "Field Notes & Archives", href: "/archives", description: "Longer reads and the public record.", category: "Community", placement: "footer", icon: "Archive", enabled: true, openInNewTab: false, sortOrder: 70 },
    { id: "forum", label: "The Town Hall", href: "/forum", description: "A moderated forum for considered argument.", category: "Community", placement: "footer", icon: "MessagesSquare", enabled: true, openInNewTab: false, sortOrder: 80 },
    { id: "friends", label: "Submit a Friend", href: "/friends/submit", description: "Recommend a person, project, or place.", category: "Community", placement: "footer", icon: "Handshake", enabled: true, openInNewTab: false, sortOrder: 90 },
    { id: "about", label: "About", href: "/about", description: "Why QNotables exists.", category: "Access", placement: "footer", icon: "Info", enabled: true, openInNewTab: false, sortOrder: 100 },
    { id: "briefing", label: "Daily Briefing", href: "/new-to-q", description: "Start with the essentials.", category: "Access", placement: "footer", icon: "Mail", enabled: true, openInNewTab: false, sortOrder: 110 },
    { id: "shop", label: "Shop", href: "https://shop.qnotables.ai", description: "Objects for the signal-minded.", category: "Access", placement: "footer", icon: "ShoppingBag", enabled: true, openInNewTab: true, sortOrder: 120 },
    { id: "donate", label: "Donate", href: "/donate", description: "Support independent research.", category: "Access", placement: "footer", icon: "HeartHandshake", enabled: true, openInNewTab: false, sortOrder: 130 },
    { id: "contact", label: "Contact", href: "mailto:hello@qnotables.ai", description: "Reach the desk directly.", category: "Access", placement: "footer", icon: "Mail", enabled: true, openInNewTab: false, sortOrder: 140 },
    { id: "login", label: "Sign In", href: "/auth/login", description: "Access your account.", category: "Access", placement: "explore", icon: "LogIn", enabled: true, openInNewTab: false, sortOrder: 150 },
    { id: "signup", label: "Create Account", href: "/auth/sign-up", description: "Join the QNotables community.", category: "Access", placement: "explore", icon: "UserPlus", enabled: true, openInNewTab: false, sortOrder: 160 },
  ],
  socialProfiles: [
    { id: "x", platform: "X", label: "Follow on X", href: "https://x.com/qnotables", icon: "Twitter", enabled: true, sortOrder: 10 },
    { id: "youtube", platform: "YouTube", label: "Watch on YouTube", href: "https://youtube.com/@qnotables", icon: "Youtube", enabled: true, sortOrder: 20 },
  ],
}

const MAX_LABEL = 80
const MAX_DESCRIPTION = 240
const MAX_URL = 2048
const ALLOWED_PLACEMENTS = new Set<FooterLinkPlacement>(["footer", "explore", "legal"])
const ALLOWED_PROTOCOLS = new Set(["http:", "https:", "mailto:"])

function record(value: unknown): Record<string, unknown> {
  return typeof value === "object" && value !== null ? value as Record<string, unknown> : {}
}

function stringValue(value: unknown, fallback: string, maxLength: number): string {
  if (typeof value !== "string") return fallback
  return value.trim().slice(0, maxLength)
}

function booleanValue(value: unknown, fallback: boolean): boolean {
  return typeof value === "boolean" ? value : fallback
}

function numberValue(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) ? Math.round(value) : fallback
}

function safeHref(value: unknown): boolean {
  if (typeof value !== "string" || value.length === 0 || value.length > MAX_URL || value !== value.trim()) return false
  if (value.startsWith("/") && !value.startsWith("//")) return true
  if (value.startsWith("#")) return false
  try {
    return ALLOWED_PROTOCOLS.has(new URL(value).protocol)
  } catch {
    return false
  }
}

function normalizeLink(value: unknown, index: number): FooterLink | null {
  const source = record(value)
  const href = typeof source.href === "string" ? source.href.trim() : ""
  if (!safeHref(href)) return null
  const placement = ALLOWED_PLACEMENTS.has(source.placement as FooterLinkPlacement)
    ? source.placement as FooterLinkPlacement
    : "footer"
  return {
    id: stringValue(source.id, `link-${index + 1}`, 80) || `link-${index + 1}`,
    label: stringValue(source.label, "Untitled link", MAX_LABEL) || "Untitled link",
    href,
    description: stringValue(source.description, "", MAX_DESCRIPTION),
    category: stringValue(source.category, "Explore", MAX_LABEL) || "Explore",
    placement,
    icon: stringValue(source.icon, "ArrowUpRight", 50) || "ArrowUpRight",
    enabled: booleanValue(source.enabled, true),
    openInNewTab: booleanValue(source.openInNewTab, !href.startsWith("/")),
    sortOrder: numberValue(source.sortOrder, (index + 1) * 10),
  }
}

function normalizeSocial(value: unknown, index: number): FooterSocialProfile | null {
  const source = record(value)
  const href = typeof source.href === "string" ? source.href.trim() : ""
  if (!safeHref(href) || !/^https?:$/i.test(new URL(href).protocol)) return null
  return {
    id: stringValue(source.id, `social-${index + 1}`, 80) || `social-${index + 1}`,
    platform: stringValue(source.platform, "Social", MAX_LABEL) || "Social",
    label: stringValue(source.label, `Follow on ${source.platform ?? "social"}`, MAX_LABEL) || "Follow on social",
    href,
    icon: stringValue(source.icon, "Globe2", 50) || "Globe2",
    enabled: booleanValue(source.enabled, true),
    sortOrder: numberValue(source.sortOrder, (index + 1) * 10),
  }
}

export function getDefaultFooterConfig(): FooterConfig {
  return JSON.parse(JSON.stringify(DEFAULT_CONFIG)) as FooterConfig
}

export function normalizeFooterConfig(value: unknown): FooterConfig {
  const source = record(value)
  const defaultConfig = getDefaultFooterConfig()
  const rawLinks = Array.isArray(source.links) ? source.links : defaultConfig.links
  const rawSocial = Array.isArray(source.socialProfiles) ? source.socialProfiles : defaultConfig.socialProfiles
  const links = rawLinks.map(normalizeLink).filter((link): link is FooterLink => Boolean(link))
  const socialProfiles = rawSocial.map(normalizeSocial).filter((profile): profile is FooterSocialProfile => Boolean(profile))

  return {
    siteName: stringValue(source.siteName, defaultConfig.siteName, MAX_LABEL) || defaultConfig.siteName,
    eyebrow: stringValue(source.eyebrow, defaultConfig.eyebrow, MAX_LABEL) || defaultConfig.eyebrow,
    mission: stringValue(source.mission, defaultConfig.mission, 500) || defaultConfig.mission,
    newsletterTitle: stringValue(source.newsletterTitle, defaultConfig.newsletterTitle, MAX_LABEL) || defaultConfig.newsletterTitle,
    newsletterDescription: stringValue(source.newsletterDescription, defaultConfig.newsletterDescription, 300) || defaultConfig.newsletterDescription,
    copyrightText: stringValue(source.copyrightText, defaultConfig.copyrightText, MAX_LABEL) || defaultConfig.copyrightText,
    statusLabel: stringValue(source.statusLabel, defaultConfig.statusLabel, MAX_LABEL) || defaultConfig.statusLabel,
    showStatus: booleanValue(source.showStatus, defaultConfig.showStatus),
    backToTopLabel: stringValue(source.backToTopLabel, defaultConfig.backToTopLabel, MAX_LABEL) || defaultConfig.backToTopLabel,
    links: links.length > 0 ? links.sort((a, b) => a.sortOrder - b.sortOrder) : defaultConfig.links,
    socialProfiles: socialProfiles.sort((a, b) => a.sortOrder - b.sortOrder),
  }
}

export function validateFooterConfig(value: unknown): { success: true; config: FooterConfig } | { success: false; error: string } {
  const source = record(value)
  const rawLinks = Array.isArray(source.links) ? source.links : []
  const rawSocial = Array.isArray(source.socialProfiles) ? source.socialProfiles : []
  if (rawLinks.length > 100) return { success: false, error: "Keep the footer to 100 links or fewer." }
  if (rawSocial.length > 20) return { success: false, error: "Keep social profiles to 20 or fewer." }
  for (const link of rawLinks) {
    const item = record(link)
    if (!safeHref(item.href)) return { success: false, error: `The link “${String(item.label ?? "Untitled")}” has an unsafe or invalid URL.` }
    if (!ALLOWED_PLACEMENTS.has(item.placement as FooterLinkPlacement)) return { success: false, error: "Every link needs a valid placement." }
  }
  for (const profile of rawSocial) {
    const item = record(profile)
    if (!safeHref(item.href) || !/^https?:$/i.test(new URL(String(item.href)).protocol)) return { success: false, error: `The social profile “${String(item.platform ?? "Social")}” needs an http(s) URL.` }
  }
  return { success: true, config: normalizeFooterConfig(value) }
}

async function readFooterRow(): Promise<FooterRow | null> {
  const admin = createAdminClient()
  const { data, error } = await admin.from("footer_config").select("draft_config, published_config").eq("id", "default").maybeSingle()
  if (error) {
    console.error("[v0] Footer configuration read failed:", error.code)
    return null
  }
  return data as FooterRow | null
}

const readPublishedFooterConfig = unstable_cache(
  async () => {
    const row = await readFooterRow()
    return normalizeFooterConfig(row?.published_config)
  },
  ["footer-config-published"],
  { revalidate: 300, tags: ["footer-config"] },
)

export async function getPublishedFooterConfig(): Promise<FooterConfig> {
  try {
    return await readPublishedFooterConfig()
  } catch (error) {
    console.error("[v0] Falling back to default footer configuration:", error)
    return getDefaultFooterConfig()
  }
}

export async function getFooterDraftConfig(): Promise<FooterConfig> {
  const row = await readFooterRow()
  return normalizeFooterConfig(row?.draft_config ?? row?.published_config)
}

export async function saveFooterDraft(value: unknown): Promise<{ success: boolean; error?: string }> {
  if (!(await validateDashboardAccess())) return { success: false, error: "Not authorized." }
  const validation = validateFooterConfig(value)
  if (!validation.success) return validation
  const admin = createAdminClient()
  const { error } = await admin.from("footer_config").upsert({
    id: "default",
    draft_config: validation.config,
    updated_at: new Date().toISOString(),
  }, { onConflict: "id" })
  if (error) return { success: false, error: error.message }
  await logActivity({ action: "saved footer draft", targetType: "footer_config" })
  revalidatePath("/dashboard/footer")
  return { success: true }
}

export async function publishFooterConfig(): Promise<{ success: boolean; error?: string }> {
  if (!(await validateDashboardAccess())) return { success: false, error: "Not authorized." }
  const row = await readFooterRow()
  const validation = validateFooterConfig(row?.draft_config ?? getDefaultFooterConfig())
  if (!validation.success) return validation
  const admin = createAdminClient()
  const { error } = await admin.from("footer_config").upsert({
    id: "default",
    draft_config: validation.config,
    published_config: validation.config,
    published_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }, { onConflict: "id" })
  if (error) return { success: false, error: error.message }
  await logActivity({ action: "published footer configuration", targetType: "footer_config" })
  revalidateTag("footer-config", "max")
  revalidatePath("/", "layout")
  revalidatePath("/dashboard/footer")
  return { success: true }
}

export function footerLinkGroups(config: FooterConfig, placement: FooterLinkPlacement): Array<{ title: string; links: FooterLink[] }> {
  const groups = new Map<string, FooterLink[]>()
  for (const link of config.links.filter((item) => item.enabled && item.placement === placement).sort((a, b) => a.sortOrder - b.sortOrder)) {
    const group = groups.get(link.category) ?? []
    group.push(link)
    groups.set(link.category, group)
  }
  return [...groups.entries()].map(([title, links]) => ({ title, links }))
}

export function isExternalFooterHref(href: string): boolean {
  return /^https?:\/\//i.test(href)
}
