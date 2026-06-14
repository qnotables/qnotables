// Canonical product catalog — the single source of truth for pricing.
// The server validates all prices against this file; the client may read it
// for display only. IDs here match the IDs passed to the checkout action.

export type Subscription = {
  id: string
  type: "subscription"
  name: string
  description: string
  // prices in cents
  monthlyInCents: number
  annualInCents: number
}

export type Good = {
  id: string
  type: "good"
  name: string
  description: string
  priceInCents: number
  shippable: true
}

export type Product = Subscription | Good

export const PRODUCTS: Product[] = [
  // --- Memberships (recurring) ---
  {
    id: "command",
    type: "subscription",
    name: "Command Membership",
    description: "Ad-free recon, priority FLASH alerts, and a 90-day searchable archive.",
    monthlyInCents: 900,
    annualInCents: 9000,
  },
  {
    id: "intel",
    type: "subscription",
    name: "Intel Membership",
    description: "Full analyst suite with wire API access, unlimited archive, and source controls.",
    monthlyInCents: 2400,
    annualInCents: 24000,
  },

  // --- Branded, shippable goods (one-time) ---
  {
    id: "field-tee",
    type: "good",
    name: "Field Tee",
    description: "Olive-drab standard-issue tee with stenciled chest mark.",
    priceInCents: 3200,
    shippable: true,
  },
  {
    id: "recon-cap",
    type: "good",
    name: "Recon Cap",
    description: "Khaki tactical cap with embroidered front patch.",
    priceInCents: 2800,
    shippable: true,
  },
  {
    id: "morale-patch",
    type: "good",
    name: "Morale Patch",
    description: "Embroidered velcro-backed morale patch.",
    priceInCents: 1200,
    shippable: true,
  },
  {
    id: "field-mug",
    type: "good",
    name: "Field Mug",
    description: "Rugged enamel camp mug.",
    priceInCents: 1800,
    shippable: true,
  },
]

export function getProduct(id: string): Product | undefined {
  return PRODUCTS.find((p) => p.id === id)
}

// Helpers for display
export function dollars(cents: number): number {
  return Math.round(cents) / 100
}
