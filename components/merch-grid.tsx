"use client"

import Image from "next/image"
import { useState } from "react"
import { ShoppingBag, Truck } from "lucide-react"
import { CheckoutDialog, type CheckoutRequest } from "@/components/checkout-dialog"
import { PRODUCTS, getProduct, dollars } from "@/lib/products"

export function MerchGrid() {
  // Map of product IDs to UI metadata (codename, image, options)
  const productUI: Record<string, { codename: string; image: string; optionLabel: string; options: string[] }> = {
    "field-tee": {
      codename: "STD-ISSUE",
      image: "/shop/field-tee.png",
      optionLabel: "Size",
      options: ["S", "M", "L", "XL", "2XL"],
    },
    "recon-cap": {
      codename: "HEADGEAR",
      image: "/shop/recon-cap.png",
      optionLabel: "Fit",
      options: ["One Size"],
    },
    "morale-patch": {
      codename: "INSIGNIA",
      image: "/shop/morale-patch.png",
      optionLabel: "Backing",
      options: ["Velcro", "Iron-on"],
    },
    "field-mug": {
      codename: "MESS-KIT",
      image: "/shop/field-mug.png",
      optionLabel: "Finish",
      options: ["Olive", "Charcoal"],
    },
    "sticker-pack": {
      codename: "MARKS",
      image: "/shop/sticker-pack.png",
      optionLabel: "Style",
      options: ["Classic"],
    },
    "sourced-notebook": {
      codename: "LEDGER",
      image: "/shop/sourced-notebook.png",
      optionLabel: "Binding",
      options: ["Hardcover"],
    },
  }

  const [selected, setSelected] = useState<Record<string, string>>(
    Object.fromEntries(
      PRODUCTS.filter((p) => p.type === "good").map((p) => [
        p.id,
        productUI[p.id]?.options[0] || "",
      ]),
    ),
  )
  const [request, setRequest] = useState<CheckoutRequest | null>(null)

  const goods = PRODUCTS.filter((p) => p.type === "good")

  return (
    <>
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {goods.map((product) => {
        const ui = productUI[product.id]
        if (!ui) return null
        return (
        <section
          key={product.id}
          className="corner-frame flex flex-col border border-border bg-card"
        >
          <div className="relative aspect-square w-full overflow-hidden border-b border-border bg-muted">
            <Image
              src={ui.image || "/placeholder.svg"}
              alt={`${product.name} product photo`}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              className="object-cover"
            />
            <span className="label-mono absolute left-3 top-3 bg-background/80 px-2 py-1 text-primary backdrop-blur">
              {ui.codename}
            </span>
          </div>

          <div className="flex flex-1 flex-col p-4">
            <div className="flex items-baseline justify-between gap-2">
              <h3 className="stencil text-xl text-foreground">{product.name}</h3>
              <span className="stencil text-xl text-primary">${dollars(product.priceInCents)}</span>
            </div>

            <div className="mt-4">
              <span className="label-mono text-muted-foreground">
                {ui.optionLabel}
              </span>
              <div className="mt-2 flex flex-wrap gap-2">
                {ui.options.map((opt) => (
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
                  title: `${product.name} — ${ui.optionLabel}: ${selected[product.id]}`,
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
        )
      })}
    </div>

    <CheckoutDialog
      request={request}
      onOpenChange={(open) => !open && setRequest(null)}
    />
    </>
  )
}
