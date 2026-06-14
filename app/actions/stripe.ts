"use server"

import { stripe } from "@/lib/stripe"
import { getProduct } from "@/lib/products"

type CheckoutInput = {
  productId: string
  // for subscriptions
  interval?: "monthly" | "annual"
  // for goods
  quantity?: number
}

export async function startCheckoutSession(input: CheckoutInput) {
  const product = getProduct(input.productId)
  if (!product) {
    throw new Error(`Product with id "${input.productId}" not found`)
  }

  if (product.type === "subscription") {
    const interval = input.interval ?? "monthly"
    const unit_amount =
      interval === "annual" ? product.annualInCents : product.monthlyInCents

    const session = await stripe.checkout.sessions.create({
      ui_mode: "embedded_page",
      redirect_on_completion: "never",
      mode: "subscription",
      // Do NOT set payment_method_types — Stripe selects eligible methods dynamically.
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: product.name,
              description: product.description,
            },
            unit_amount,
            recurring: {
              interval: interval === "annual" ? "year" : "month",
            },
          },
          quantity: 1,
        },
      ],
    })

    return session.client_secret
  }

  // One-time, shippable goods
  const quantity = Math.min(Math.max(input.quantity ?? 1, 1), 10)

  const session = await stripe.checkout.sessions.create({
    ui_mode: "embedded_page",
    redirect_on_completion: "never",
    mode: "payment",
    line_items: [
      {
        price_data: {
          currency: "usd",
          product_data: {
            name: product.name,
            description: product.description,
          },
          unit_amount: product.priceInCents,
        },
        quantity,
      },
    ],
    // Collect a shipping address for physical goods.
    shipping_address_collection: {
      allowed_countries: ["US", "CA", "GB", "AU", "DE", "FR", "NL", "SE"],
    },
    // Flat-rate shipping options.
    shipping_options: [
      {
        shipping_rate_data: {
          type: "fixed_amount",
          display_name: "Standard (3-5 business days)",
          fixed_amount: { amount: 600, currency: "usd" },
          delivery_estimate: {
            minimum: { unit: "business_day", value: 3 },
            maximum: { unit: "business_day", value: 5 },
          },
        },
      },
      {
        shipping_rate_data: {
          type: "fixed_amount",
          display_name: "Express (1-2 business days)",
          fixed_amount: { amount: 1800, currency: "usd" },
          delivery_estimate: {
            minimum: { unit: "business_day", value: 1 },
            maximum: { unit: "business_day", value: 2 },
          },
        },
      },
    ],
  })

  return session.client_secret
}
