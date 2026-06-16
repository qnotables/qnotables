"use client"

import Link from "next/link"
import { ArrowRight, ExternalLink } from "lucide-react"
import { shopifyStoreUrl, SHOP_ORIGIN } from "@/lib/shop/shopify-url"

export function ShopHero() {
  return (
    <section className="border-b border-border bg-gradient-to-b from-muted/50 to-transparent px-4 py-16 md:py-24">
      <div className="mx-auto max-w-4xl">
        <div className="text-center">
          <div className="mb-4 flex justify-center">
            <span className="label-mono inline-block bg-primary/10 px-3 py-1 text-primary">
              HOT AND FRESH STORE
            </span>
          </div>

          <h1 className="stencil mb-4 text-4xl md:text-5xl text-foreground">Gear for the Newsroom</h1>

          <p className="mx-auto mb-8 max-w-2xl text-lg text-muted-foreground">
            Branded apparel and essentials for those who stay on top of the story. Support independent news with every
            purchase.
          </p>

          <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
            <Link
              href="#merch"
              className="label-mono inline-flex items-center justify-center gap-2 bg-primary px-6 py-3 font-semibold text-primary-foreground transition-opacity hover:opacity-90"
            >
              Shop Merch
              <ArrowRight className="h-4 w-4" />
            </Link>

            <Link
              href="#memberships"
              className="label-mono inline-flex items-center justify-center gap-2 border border-border px-6 py-3 font-semibold text-foreground transition-colors hover:border-primary hover:bg-muted"
            >
              Membership Plans
            </Link>

            {SHOP_ORIGIN && (
              <a
                href={shopifyStoreUrl()}
                target="_blank"
                rel="noopener noreferrer"
                className="label-mono inline-flex items-center justify-center gap-2 border border-primary/50 px-6 py-3 font-semibold text-primary transition-colors hover:border-primary hover:bg-primary/10"
              >
                <ExternalLink className="h-4 w-4" />
                Full Shopify Store
              </a>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
