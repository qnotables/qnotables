import type { Metadata } from "next"
import Link from "next/link"
import Image from "next/image"
import { ThemeToggle } from "@/components/theme-toggle"
import { ShopHero } from "@/components/shop-hero"
import { MembershipComparison } from "@/components/membership-comparison"
import { MerchGrid } from "@/components/merch-grid"
import { ShopFAQ } from "@/components/shop-faq"
import { SiteFooter } from "@/components/site-footer"

export const metadata: Metadata = {
  title: "Shop & Membership — HOT AND FRESH",
  description:
    "Support independent news with HOT AND FRESH memberships and branded gear. Ad-free reading, FLASH alerts, and analyst tools.",
}

export default function ShopPage() {
  return (
    <div className="min-h-screen tactical-grid">
      {/* sticky header */}
      <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 md:px-6">
          <Link href="/" className="flex items-baseline gap-2" aria-label="Back to HOT AND FRESH home">
            <Image
              src="/us-flag.png"
              alt="American flag"
              width={32}
              height={20}
              className="h-5 w-8"
            />
            <span className="stencil text-2xl leading-none text-foreground md:text-3xl">
              HOT AND FRESH
            </span>
            <span className="label-mono hidden text-primary sm:inline">/ SHOP</span>
          </Link>
          <div className="flex items-center gap-2">
            <Link
              href="/"
              className="label-mono border border-border px-3 py-2 text-muted-foreground transition-colors hover:border-primary hover:text-primary"
            >
              Back to Wire
            </Link>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main>
        <ShopHero />

        <MembershipComparison />

        {/* branded, shippable goods */}
        <section id="merch" className="border-b border-border px-4 py-16 md:py-24 scroll-mt-24">
          <div className="mx-auto max-w-6xl">
            <div className="mb-8 flex items-center gap-3">
              <span className="h-2 w-2 bg-primary" />
              <h2 className="stencil text-2xl md:text-3xl text-foreground">Branded Merch</h2>
              <span className="label-mono hidden text-muted-foreground sm:inline">
                // STANDARD-ISSUE KIT
              </span>
              <span className="ml-auto hidden h-px flex-1 bg-border sm:block" />
            </div>
            <p className="mb-8 max-w-2xl text-pretty leading-relaxed text-muted-foreground">
              Field gear and essentials printed and shipped worldwide. Flat-rate shipping
              applied at checkout; orders dispatched within 3-5 business days.
            </p>
            <MerchGrid />
          </div>
        </section>

        <ShopFAQ />
      </main>

      <SiteFooter />
    </div>
  )
}
