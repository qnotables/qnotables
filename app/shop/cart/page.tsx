"use client"

import { useState } from "react"
import Link from "next/link"
import { Trash2, ArrowRight, X } from "lucide-react"
import { useCart } from "@/lib/shop/cart-context"
import { formatPrice } from "@/lib/shop/products"
import { CartCheckout } from "@/components/cart-checkout"

export default function CartPage() {
  const { items, removeItem, updateQuantity, total, clear } = useCart()
  const [showCheckout, setShowCheckout] = useState(false)

  return (
    <main className="min-h-screen bg-background">
      <div className="border-b border-border px-6 py-6">
        <Link href="/shop" className="label-mono text-primary hover:underline">
          ← Back to Shop
        </Link>
      </div>

      {showCheckout ? (
        <div className="px-6 py-12">
          <div className="mb-6 flex items-center justify-between">
            <h1 className="text-3xl font-bold text-foreground">CHECKOUT</h1>
            <button
              onClick={() => setShowCheckout(false)}
              className="p-2 hover:bg-muted"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="mx-auto max-w-2xl">
            <CartCheckout items={items} onClose={() => setShowCheckout(false)} />
          </div>
        </div>
      ) : (
        <div className="grid gap-12 px-6 py-12 lg:grid-cols-3">
          {/* Cart Items */}
          <div className="lg:col-span-2">
            <h1 className="mb-8 text-3xl font-bold text-foreground">SHOPPING CART</h1>

            {items.length === 0 ? (
              <div className="border border-border bg-muted/30 p-12 text-center">
                <p className="label-mono text-muted-foreground">Your cart is empty</p>
                <Link href="/shop" className="label-mono mt-4 inline-block text-primary hover:underline">
                  Continue Shopping →
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {items.map((item) => (
                  <div key={`${item.productId}-${item.variantId}`} className="border border-border bg-background p-4">
                    <div className="flex gap-4">
                      {item.image && (
                        <div className="h-24 w-24 flex-shrink-0 border border-border bg-muted">
                          <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
                        </div>
                      )}
                      <div className="flex-1">
                        <h3 className="font-semibold text-foreground">{item.name}</h3>
                        <p className="label-mono mt-1 text-sm text-muted-foreground">{formatPrice(item.price)}</p>

                        <div className="mt-4 flex items-center gap-4">
                          <div className="flex items-center border border-border">
                            <button
                              onClick={() => updateQuantity(item.productId, item.quantity - 1, item.variantId)}
                              className="px-3 py-1 hover:bg-muted"
                            >
                              −
                            </button>
                            <input
                              type="number"
                              min="1"
                              value={item.quantity}
                              onChange={(e) =>
                                updateQuantity(item.productId, Math.max(1, parseInt(e.target.value) || 1), item.variantId)
                              }
                              className="w-12 border-0 bg-background text-center font-semibold text-foreground outline-none"
                            />
                            <button
                              onClick={() => updateQuantity(item.productId, item.quantity + 1, item.variantId)}
                              className="px-3 py-1 hover:bg-muted"
                            >
                              +
                            </button>
                          </div>

                          <button
                            onClick={() => removeItem(item.productId, item.variantId)}
                            className="ml-auto text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>

                      <div className="text-right">
                        <p className="font-bold text-foreground">{formatPrice(item.price * item.quantity)}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Order Summary */}
          {items.length > 0 && (
            <div className="space-y-4 lg:h-fit lg:sticky lg:top-6">
              <div className="border border-border bg-background p-6 space-y-4">
                <h2 className="label-mono font-semibold text-foreground">ORDER SUMMARY</h2>

                <div className="space-y-2 border-t border-border pt-4">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="font-semibold text-foreground">{formatPrice(total)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Shipping</span>
                    <span className="label-mono text-xs font-semibold text-primary">CALCULATED AT CHECKOUT</span>
                  </div>
                  <div className="flex justify-between border-t border-border pt-4">
                    <span className="font-semibold text-foreground">Total</span>
                    <span className="text-2xl font-bold text-primary">{formatPrice(total)}</span>
                  </div>
                </div>

                <button
                  onClick={() => setShowCheckout(true)}
                  className="w-full flex items-center justify-center gap-2 bg-primary px-6 py-3 font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
                >
                  PROCEED TO CHECKOUT
                  <ArrowRight className="h-4 w-4" />
                </button>

                <button
                  onClick={clear}
                  className="w-full border border-border px-6 py-3 font-semibold text-foreground transition-colors hover:bg-muted"
                >
                  CLEAR CART
                </button>
              </div>

              <div className="border border-border bg-muted/30 p-4">
                <p className="label-mono text-xs text-muted-foreground">
                  All orders ship within 3-5 business days. International shipping available.
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </main>
  )
}
