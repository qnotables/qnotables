"use client"

import Image from "next/image"
import { useState } from "react"
import { ShoppingBag, Truck } from "lucide-react"
import { CheckoutDialog, type CheckoutRequest } from "@/components/checkout-dialog"

type Product = {
  id: string
  name: string
  codename: string
  price: number
  image: string
  options: string[]
  optionLabel: string
}

const PRODUCTS: Product[] = [
  {
    id: "field-tee",
    name: "Field Tee",
    codename: "STD-ISSUE",
    price: 32,
    image: "/shop/field-tee.png",
    optionLabel: "Size",
    options: ["S", "M", "L", "XL", "2XL"],
  },
  {
    id: "recon-cap",
    name: "Recon Cap",
    codename: "HEADGEAR",
    price: 28,
    image: "/shop/recon-cap.png",
    optionLabel: "Fit",
    options: ["One Size"],
  },
  {
    id: "morale-patch",
    name: "Morale Patch",
    codename: "INSIGNIA",
    price: 12,
    image: "/shop/morale-patch.png",
    optionLabel: "Backing",
    options: ["Velcro", "Iron-on"],
  },
  {
    id: "field-mug",
    name: "Field Mug",
    codename: "MESS-KIT",
    price: 18,
    image: "/shop/field-mug.png",
    optionLabel: "Finish",
    options: ["Olive", "Charcoal"],
  },
  {
    id: "sticker-pack",
    name: "Sticker Pack",
    codename: "MARKS",
    price: 8,
    image: "/shop/sticker-pack.png",
    optionLabel: "Style",
    options: ["Classic"],
  },
  {
    id: "sourced-notebook",
    name: "Sourced Notebook",
    codename: "LEDGER",
    price: 28,
    image: "/shop/sourced-notebook.png",
    optionLabel: "Binding",
    options: ["Hardcover"],
  },
]

export function MerchGrid() {
  const [selected, setSelected] = useState<Record<string, string>>(
    Object.fromEntries(PRODUCTS.map((p) => [p.id, p.options[0]])),
  )
  const [request, setRequest] = useState<CheckoutRequest | null>(null)

  return (
    <>
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {PRODUCTS.map((product) => (
        <section
          key={product.id}
          className="corner-frame flex flex-col border border-border bg-card"
        >
          <div className="relative aspect-square w-full overflow-hidden border-b border-border bg-muted">
            <Image
              src={product.image || "/placeholder.svg"}
              alt={`${product.name} product photo`}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              className="object-cover"
            />
            <span className="label-mono absolute left-3 top-3 bg-background/80 px-2 py-1 text-primary backdrop-blur">
              {product.codename}
            </span>
          </div>

          <div className="flex flex-1 flex-col p-4">
            <div className="flex items-baseline justify-between gap-2">
              <h3 className="stencil text-xl text-foreground">{product.name}</h3>
              <span className="stencil text-xl text-primary">${product.price}</span>
            </div>

            <div className="mt-4">
              <span className="label-mono text-muted-foreground">
                {product.optionLabel}
              </span>
              <div className="mt-2 flex flex-wrap gap-2">
                {product.options.map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() =>
                      setSelected((prev) => ({ ...prev, [product.id]: opt }))
                    }
                    className={`label-mono border px-2.5 py-1 transition-colors ${
                      selected[product.id] === opt
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border text-muted-foreground hover:border-primary hover:text-primary"
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="button"
              onClick={() =>
                setRequest({
                  productId: product.id,
                  title: `${product.name} — ${product.optionLabel}: ${selected[product.id]}`,
                  quantity: 1,
                })
              }
              className="label-mono mt-5 flex w-full items-center justify-center gap-2 bg-primary py-3 font-semibold text-primary-foreground transition-opacity hover:opacity-90"
            >
              <ShoppingBag className="h-4 w-4" aria-hidden="true" />
              Order Now
            </button>

            <p className="label-mono mt-3 flex items-center gap-1.5 text-muted-foreground">
              <Truck className="h-3.5 w-3.5" aria-hidden="true" />
              Ships in 3-5 days
            </p>
          </div>
        </section>
      ))}
    </div>

    <CheckoutDialog
      request={request}
      onOpenChange={(open) => !open && setRequest(null)}
    />
    </>
  )
}
