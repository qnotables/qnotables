import type { Metadata } from "next"
import Link from "next/link"
import { Radio } from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"
import { MembershipTiers } from "@/components/membership-tiers"
import { MerchGrid } from "@/components/merch-grid"
import { SiteFooter } from "@/components/site-footer"

export const metadata: Metadata = {
  title: "Enlistment — DISPATCH Memberships",
  description:
    "Choose a DISPATCH access tier — Field, Command, or Intel. Priority signal, deeper archives, and analyst tools.",
}

export default function ShopPage() {
  return (
    <div className="min-h-screen tactical-grid">
      {/* simple masthead with a route back to the wire */}
      <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 md:px-6">
          <Link href="/" className="flex items-baseline gap-2" aria-label="Back to DISPATCH home">
            <Radio className="h-6 w-6 self-center text-primary" aria-hidden="true" />
            <span className="stencil text-2xl leading-none text-foreground md:text-3xl">
              Dispatch
            </span>
            <span className="label-mono hidden text-primary sm:inline">/ ENLISTMENT</span>
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

      <main className="mx-auto max-w-7xl px-4 py-12 md:px-6 md:py-16">
        <div className="mx-auto max-w-2xl text-center">
          <span className="label-mono text-primary">// ACCESS TIERS</span>
          <h1 className="stencil mt-3 text-balance text-4xl text-foreground md:text-5xl">
            Enlist for Priority Signal
          </h1>
          <p className="mt-4 text-pretty leading-relaxed text-muted-foreground">
            Upgrade your clearance for ad-free recon, deeper archives, FLASH
            alerts, and full analyst tooling. Stand down anytime.
          </p>
        </div>

        <div className="mt-12">
          <MembershipTiers />
        </div>

        {/* branded, shippable goods */}
        <div id="quartermaster" className="mt-20 scroll-mt-24">
          <div className="mb-8 flex items-center gap-3">
            <span className="h-2 w-2 bg-primary" />
            <h2 className="stencil text-2xl text-foreground">The Quartermaster</h2>
            <span className="label-mono hidden text-muted-foreground sm:inline">
              // STANDARD-ISSUE KIT
            </span>
            <span className="ml-auto h-px flex-1 bg-border" />
          </div>
          <p className="mb-8 max-w-2xl text-pretty leading-relaxed text-muted-foreground">
            Branded field kit, printed and shipped worldwide. Flat-rate shipping
            applied at checkout; orders dispatched within 3-5 business days.
          </p>
          <MerchGrid />
        </div>

        <p className="mt-12 text-center text-sm text-muted-foreground">
          {"Storefront preview — checkout is not yet active. "}
          <Link href="/" className="text-primary underline-offset-4 hover:underline">
            Return to the wire
          </Link>
        </p>
      </main>

      <SiteFooter />
    </div>
  )
}
