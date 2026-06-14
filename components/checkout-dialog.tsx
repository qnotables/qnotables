"use client"

import { useCallback } from "react"
import {
  EmbeddedCheckout,
  EmbeddedCheckoutProvider,
} from "@stripe/react-stripe-js"
import { loadStripe } from "@stripe/stripe-js"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { startCheckoutSession } from "@/app/actions/stripe"

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY as string,
)

export type CheckoutRequest = {
  productId: string
  title: string
  interval?: "monthly" | "annual"
  quantity?: number
}

export function CheckoutDialog({
  request,
  onOpenChange,
}: {
  request: CheckoutRequest | null
  onOpenChange: (open: boolean) => void
}) {
  const fetchClientSecret = useCallback(() => {
    if (!request) return Promise.resolve("")
    return startCheckoutSession({
      productId: request.productId,
      interval: request.interval,
      quantity: request.quantity,
    }).then((secret) => secret ?? "")
  }, [request])

  const open = request !== null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] gap-0 overflow-y-auto border-border bg-card p-0 sm:max-w-xl">
        <DialogHeader className="border-b border-border px-5 py-4">
          <DialogTitle className="stencil text-xl text-foreground">
            Checkout
          </DialogTitle>
          <DialogDescription className="label-mono text-muted-foreground">
            {request ? `// ${request.title}` : ""}
          </DialogDescription>
        </DialogHeader>
        <div className="p-4">
          {open && (
            <EmbeddedCheckoutProvider
              // key forces a fresh session whenever the selection changes
              key={`${request?.productId}-${request?.interval ?? ""}-${request?.quantity ?? 1}`}
              stripe={stripePromise}
              options={{ fetchClientSecret }}
            >
              <EmbeddedCheckout />
            </EmbeddedCheckoutProvider>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
