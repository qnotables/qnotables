"use client"

import useSWR from "swr"
import { SiteFooterClient } from "@/components/site-footer-client"
import type { FooterConfig } from "@/lib/footer-config"

const FALLBACK_FOOTER_CONFIG: FooterConfig = {
  siteName: "HOT AND FRESH",
  eyebrow: "QNOTABLES / INDEPENDENT SIGNAL",
  mission: "An independent aggregator ranking verified reporting from trusted wire services and publications worldwide.",
  newsletterTitle: "Keep the signal close.",
  newsletterDescription: "Occasional dispatches about the archive, the town hall, and what is worth your attention.",
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

const fetchFooter = async (url: string): Promise<FooterConfig> => {
  const response = await fetch(url)
  if (!response.ok) throw new Error("Footer configuration unavailable")
  return response.json() as Promise<FooterConfig>
}

export function SiteFooter() {
  const { data } = useSWR("/api/footer", fetchFooter, {
    fallbackData: FALLBACK_FOOTER_CONFIG,
    revalidateOnFocus: false,
    revalidateIfStale: true,
  })
  return <SiteFooterClient config={data ?? FALLBACK_FOOTER_CONFIG} />
}
