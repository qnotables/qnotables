import type { ReactNode } from "react"
import { BriefSignup } from "@/components/brief-signup"
import { DailyVerseWidget } from "@/components/daily-verse-widget"
import { IconLinksCard } from "@/components/icon-links-card"
import { SidebarAd } from "@/components/ad-display"

interface ContentSidebarProps {
  children?: ReactNode
  sticky?: boolean
}

export function ContentSidebar({ children, sticky = true }: ContentSidebarProps) {
  return (
    <aside className="flex min-w-0 flex-col gap-6" aria-label="Content sidebar">
      <IconLinksCard />
      <DailyVerseWidget />
      {children}
      <div className={`flex flex-col gap-6 ${sticky ? "lg:sticky lg:top-6 lg:self-start" : ""}`}>
        <SidebarAd sticky={false} />
        <BriefSignup />
      </div>
    </aside>
  )
}

export { SidebarAd }
