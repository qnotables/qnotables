'use client'

import { useEffect, useState } from 'react'
import { EmbeddedCheckout, EmbeddedCheckoutProvider } from '@stripe/react-stripe-js'
import { loadStripe } from '@stripe/stripe-js'
import { createCartCheckoutSession } from '@/app/actions/checkout'
import type { CartItem } from '@/lib/shop/cart-context'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

interface CartCheckoutProps {
  items: CartItem[]
  onClose: () => void
}

export function CartCheckout({ items, onClose }: CartCheckoutProps) {
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const initCheckout = async () => {
      try {
        const secret = await createCartCheckoutSession(items)
        setClientSecret(secret)
        setError(null)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to initialize checkout')
        setIsLoading(false)
      }
    }

    if (items.length > 0) {
      initCheckout()
    }
  }, [items])

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 rounded-lg border border-red-200 bg-red-50 p-6 text-center">
        <p className="font-semibold text-red-900">Checkout Error</p>
        <p className="text-sm text-red-700">{error}</p>
        <button
          onClick={onClose}
          className="mt-4 border border-red-300 px-4 py-2 font-semibold text-red-600 hover:bg-red-100"
        >
          Close
        </button>
      </div>
    )
  }

  if (!clientSecret) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="mb-4 inline-block h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-muted-foreground">Preparing checkout...</p>
        </div>
      </div>
    )
  }

  return (
    <EmbeddedCheckoutProvider stripe={stripePromise} options={{ clientSecret }}>
      <EmbeddedCheckout />
    </EmbeddedCheckoutProvider>
  )
}
