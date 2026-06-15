"use client"

import Link from "next/link"
import { Check, X } from "lucide-react"
import { CheckoutDialog, type CheckoutRequest } from "@/components/checkout-dialog"
import { useState } from "react"

const FEATURES = [
  { name: "Ad-free experience", command: true, intel: true, free: false },
  { name: "Email digests", command: true, intel: true, free: true },
  { name: "Priority FLASH alerts", command: true, intel: true, free: false },
  { name: "90-day searchable archive", command: true, intel: true, free: false },
  { name: "Unlimited archive access", command: false, intel: true, free: false },
  { name: "Wire API access", command: false, intel: true, free: false },
  { name: "Source grading controls", command: false, intel: true, free: false },
  { name: "Advanced filtering", command: false, intel: true, free: false },
  { name: "Real-time source status", command: false, intel: true, free: false },
  { name: "Analyst insights", command: false, intel: true, free: false },
  { name: "Priority support", command: false, intel: true, free: false },
]

export function MembershipComparison() {
  const [request, setRequest] = useState<CheckoutRequest | null>(null)

  return (
    <>
      <section id="memberships" className="border-b border-border px-4 py-16 md:py-24">
        <div className="mx-auto max-w-6xl">
          <div className="mb-12 text-center">
            <h2 className="stencil mb-4 text-3xl md:text-4xl text-foreground">
              Membership Plans
            </h2>
            <p className="text-lg text-muted-foreground">
              Choose the right tier for your news workflow.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-border">
              <thead>
                <tr className="bg-muted/50">
                  <th className="border border-border px-4 py-4 text-left font-bold text-foreground">
                    Features
                  </th>
                  <th className="border border-border px-4 py-4 text-center font-bold text-foreground">
                    Free
                  </th>
                  <th className="border border-border px-4 py-4 text-center font-bold text-foreground">
                    Command
                  </th>
                  <th className="border border-border px-4 py-4 text-center font-bold text-foreground">
                    Intel
                  </th>
                </tr>
              </thead>
              <tbody>
                {FEATURES.map((feature, idx) => (
                  <tr key={idx} className={idx % 2 === 0 ? "bg-background" : "bg-muted/20"}>
                    <td className="border border-border px-4 py-3 text-foreground">
                      {feature.name}
                    </td>
                    <td className="border border-border px-4 py-3 text-center">
                      {feature.free ? (
                        <Check className="mx-auto h-5 w-5 text-primary" />
                      ) : (
                        <X className="mx-auto h-5 w-5 text-muted-foreground" />
                      )}
                    </td>
                    <td className="border border-border px-4 py-3 text-center">
                      {feature.command ? (
                        <Check className="mx-auto h-5 w-5 text-primary" />
                      ) : (
                        <X className="mx-auto h-5 w-5 text-muted-foreground" />
                      )}
                    </td>
                    <td className="border border-border px-4 py-3 text-center">
                      {feature.intel ? (
                        <Check className="mx-auto h-5 w-5 text-primary" />
                      ) : (
                        <X className="mx-auto h-5 w-5 text-muted-foreground" />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-3">
            {/* Free tier */}
            <div className="corner-frame border border-border bg-card p-6">
              <h3 className="stencil mb-2 text-xl text-foreground">Free</h3>
              <p className="label-mono mb-6 text-muted-foreground">Always free</p>
              <button
                disabled
                className="label-mono w-full border border-border bg-muted py-2 text-muted-foreground cursor-not-allowed"
              >
                Current Plan
              </button>
            </div>

            {/* Command tier */}
            <div className="corner-frame border border-border bg-card p-6">
              <h3 className="stencil mb-2 text-xl text-foreground">Command</h3>
              <div className="mb-6">
                <p className="stencil text-2xl text-primary">$9</p>
                <p className="label-mono text-sm text-muted-foreground">/month or $90/year</p>
              </div>
              <button
                type="button"
                onClick={() =>
                  setRequest({
                    productId: "command",
                    title: "Command Membership",
                    quantity: 1,
                  })
                }
                className="label-mono w-full bg-primary py-2 font-semibold text-primary-foreground transition-opacity hover:opacity-90"
              >
                Subscribe
              </button>
            </div>

            {/* Intel tier */}
            <div className="corner-frame border-2 border-primary bg-card p-6">
              <div className="mb-4 flex items-center gap-2">
                <h3 className="stencil text-xl text-foreground">Intel</h3>
                <span className="label-mono bg-primary px-2 py-0.5 text-xs font-bold text-primary-foreground">
                  MOST POPULAR
                </span>
              </div>
              <div className="mb-6">
                <p className="stencil text-2xl text-primary">$24</p>
                <p className="label-mono text-sm text-muted-foreground">/month or $240/year</p>
              </div>
              <button
                type="button"
                onClick={() =>
                  setRequest({
                    productId: "intel",
                    title: "Intel Membership",
                    quantity: 1,
                  })
                }
                className="label-mono w-full bg-primary py-2 font-semibold text-primary-foreground transition-opacity hover:opacity-90"
              >
                Subscribe
              </button>
            </div>
          </div>
        </div>
      </section>

      <CheckoutDialog
        request={request}
        onOpenChange={(open) => !open && setRequest(null)}
      />
    </>
  )
}
