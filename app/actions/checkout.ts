'use server'

import { stripe } from '@/lib/stripe'
import type { CartItem } from '@/lib/shop/cart-context'

export async function createCartCheckoutSession(items: CartItem[]) {
  if (!items || items.length === 0) {
    throw new Error('Cart is empty')
  }

  // Convert cart items to Stripe line items
  const line_items = items.map((item) => ({
    price_data: {
      currency: 'usd',
      product_data: {
        name: item.name,
        images: item.image ? [item.image] : [],
      },
      unit_amount: item.price, // price is already in cents
    },
    quantity: item.quantity,
  }))

  const session = await stripe.checkout.sessions.create({
    ui_mode: 'embedded',
    redirect_on_completion: 'never',
    line_items,
    mode: 'payment',
  })

  return session.client_secret
}
