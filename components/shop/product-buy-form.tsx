"use client"

import { useState } from "react"
import { Plus, Minus, ShoppingCart as CartIcon } from "lucide-react"
import { useCart } from "@/lib/shop/cart-context"
import type { Product, ProductVariant } from "@/lib/shop/products"

interface ProductBuyFormProps {
  product: Product
  variants: ProductVariant[]
}

export function ProductBuyForm({ product, variants }: ProductBuyFormProps) {
  const { addItem } = useCart()
  const [quantity, setQuantity] = useState(1)
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(
    variants.length > 0 ? variants[0] : null,
  )
  const [added, setAdded] = useState(false)

  const price = selectedVariant?.price || product.price || 0

  const handleAddToCart = () => {
    addItem({
      productId: product.id,
      variantId: selectedVariant?.id,
      name: `${product.name}${selectedVariant ? ` - ${selectedVariant.name}` : ""}`,
      price: price,
      quantity: quantity,
      image: product.image_url,
    })

    setAdded(true)
    setTimeout(() => setAdded(false), 2000)
  }

  return (
    <div className="space-y-6 border-t border-border pt-8">
      {/* Variants */}
      {variants.length > 0 && (
        <div>
          <label className="label-mono block text-sm font-semibold text-foreground mb-3">SELECT OPTION</label>
          <div className="space-y-2">
            {variants.map((variant) => (
              <button
                key={variant.id}
                onClick={() => setSelectedVariant(variant)}
                className={`w-full border-2 px-4 py-3 text-left transition-colors ${
                  selectedVariant?.id === variant.id
                    ? "border-primary bg-primary/10 text-foreground"
                    : "border-border bg-background text-muted-foreground hover:border-primary"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium">{variant.name}</span>
                  {variant.price && <span className="label-mono text-sm">${(variant.price / 100).toFixed(2)}</span>}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Quantity */}
      <div>
        <label className="label-mono block text-sm font-semibold text-foreground mb-3">QUANTITY</label>
        <div className="flex items-center border border-border">
          <button
            onClick={() => setQuantity(Math.max(1, quantity - 1))}
            className="flex-1 border-r border-border py-3 text-center hover:bg-muted"
          >
            <Minus className="mx-auto h-4 w-4" />
          </button>
          <input
            type="number"
            min="1"
            value={quantity}
            onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
            className="flex-1 border-0 bg-background text-center font-semibold text-foreground outline-none"
          />
          <button
            onClick={() => setQuantity(quantity + 1)}
            className="flex-1 border-l border-border py-3 text-center hover:bg-muted"
          >
            <Plus className="mx-auto h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Add to Cart Button */}
      <button
        onClick={handleAddToCart}
        className={`w-full flex items-center justify-center gap-2 border border-border px-6 py-4 font-semibold text-foreground transition-all ${
          added
            ? "bg-green-500/20 border-green-500/50 text-green-700"
            : "bg-primary text-primary-foreground hover:opacity-90"
        }`}
      >
        <CartIcon className="h-5 w-5" />
        {added ? "ADDED TO CART" : "ADD TO CART"}
      </button>
    </div>
  )
}
