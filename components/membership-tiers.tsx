"use client"

import { useState } from "react"
import { Check, Shield, Radio, Crosshair } from "lucide-react"
import { CheckoutDialog, type CheckoutRequest } from "@/components/checkout-dialog"

type Tier = {
  id: string
  name: string
  codename: string
  icon: typeof Shield
  monthly: number
  annual: number
  blurb: string
  features: string[]
  featured?: boolean
}

const TIERS: Tier[] = [
  {
    id: "field",
    name: "Field",
    codename: "ENLISTED",
    icon: Radio,
    monthly: 0,
    annual: 0,
    blurb: "Standard access to the live wire and ranked desks.",
    features: [
      "Full live wire feed",
      "All seven desks",
      "Daily 0600 briefing",
      "Standard refresh cadence",
    ],
  },
  {
    id: "command",
    name: "Command",
    codename: "OFFICER",
    icon: Shield,
    monthly: 9,
    annual: 90,
    blurb: "Priority signal, deeper archives, and ad-free recon.",
    features: [
      "Everything in Field",
      "Ad-free interface",
      "Priority refresh + FLASH alerts",
      "90-day searchable archive",
      "Custom desk ordering",
    ],
    featured: true,
  },
  {
    id: "intel",
    name: "Intel",
    codename: "COMMAND STAFF",
    icon: Crosshair,
    monthly: 24,
    annual: 240,
    blurb: "Full analyst suite with API access and source controls.",
    features: [
      "Everything in Command",
      "Wire API access",
      "Unlimited archive",
      "Custom source lists",
      "Cross-source report analytics",
    ],
  },
]

export function MembershipTiers() {
  const [annual, setAnnual] = useState(false)
  const [request, setRequest] = useState<CheckoutRequest | null>(null)

  return (
    <div>
      {/* billing toggle */}
      <div className="mb-8 flex items-center justify-center gap-3">
        <span
          className={`label-mono ${annual ? "text-muted-foreground" : "text-foreground"}`}
        >
          Monthly
        </span>
        <button
          type="button"
          role="switch"
          aria-checked={annual}
          aria-label="Toggle annual billing"
          onClick={() => setAnnual((a) => !a)}
          className="relative h-7 w-14 border border-border bg-card transition-colors"
        >
          <span
            className={`absolute top-0.5 h-5 w-5 bg-primary transition-all ${
              annual ? "left-[calc(100%-1.375rem)]" : "left-0.5"
            }`}
          />
        </button>
        <span
          className={`label-mono ${annual ? "text-foreground" : "text-muted-foreground"}`}
        >
          Annual <span className="text-primary">// 2 MO FREE</span>
        </span>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {TIERS.map((tier) => {
          const price = annual ? tier.annual : tier.monthly
          const unit = annual ? "/yr" : "/mo"
          const Icon = tier.icon
          return (
            <section
              key={tier.id}
              className={`corner-frame relative flex flex-col border bg-card p-6 ${
                tier.featured ? "border-primary" : "border-border"
              }`}
            >
              {tier.featured && (
                <span className="label-mono absolute -top-3 left-6 bg-primary px-2 py-1 text-primary-foreground">
                  MOST DEPLOYED
                </span>
              )}

              <div className="flex items-center gap-2">
                <Icon className="h-5 w-5 text-primary" aria-hidden="true" />
                <h2 className="stencil text-2xl text-foreground">{tier.name}</h2>
              </div>
              <span className="label-mono mt-1 text-muted-foreground">
                {tier.codename}
              </span>

              <div className="mt-5 flex items-baseline gap-1">
                <span className="stencil text-4xl text-foreground">
                  {price === 0 ? "FREE" : `$${price}`}
                </span>
                {price !== 0 && (
                  <span className="label-mono text-muted-foreground">{unit}</span>
                )}
              </div>

              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                {tier.blurb}
              </p>

              <ul className="mt-5 flex flex-col gap-2.5">
                {tier.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-foreground">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                    <span className="leading-snug">{f}</span>
                  </li>
                ))}
              </ul>

              <button
                type="button"
                disabled={price === 0}
                onClick={() =>
                  setRequest({
                    productId: tier.id,
                    title: `${tier.name} Membership — ${annual ? "Annual" : "Monthly"}`,
                    interval: annual ? "annual" : "monthly",
                  })
                }
                className={`label-mono mt-6 w-full py-3 font-semibold transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60 ${
                  tier.featured
                    ? "bg-primary text-primary-foreground"
                    : "border border-border bg-secondary text-secondary-foreground"
                }`}
              >
                {price === 0 ? "Current Tier" : "Deploy"}
              </button>
            </section>
          )
        })}
      </div>

      <CheckoutDialog
        request={request}
        onOpenChange={(open) => !open && setRequest(null)}
      />
    </div>
  )
}
