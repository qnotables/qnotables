import Image from "next/image"
import { Leaf } from "lucide-react"
import type { NurseryProduct } from "@/lib/shop/nursery-catalog"

export function NurseryProductGrid({ products }: { products: NurseryProduct[] }) {
  return (
    <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {products.map((product) => {
        const { amount, currencyCode } = product.priceRange.minVariantPrice
        const price = new Intl.NumberFormat("en-US", { style: "currency", currency: currencyCode }).format(Number(amount))
        const productUrl = product.onlineStoreUrl?.replace("https://0gs1sv-jv.myshopify.com/", "https://roostersridgenursery.myshopify.com/")
        const image = product.featuredImage

        return (
          <li key={product.id} className="flex flex-col overflow-hidden border border-border bg-card">
            <div className="relative flex aspect-[4/3] items-center justify-center bg-muted">
              {image ? (
                <Image src={image.url} alt={image.altText ?? ""} fill className="object-cover" sizes="(min-width: 1280px) 270px, (min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw" />
              ) : (
                <Leaf aria-hidden="true" className="size-10 text-muted-foreground" />
              )}
            </div>
            <div className="flex flex-1 flex-col items-start gap-3 p-4">
              <h3 className="text-base font-semibold leading-snug">{product.title}</h3>
              <p className="text-sm text-muted-foreground">From {price}{!product.availableForSale && " · Sold out"}</p>
              {productUrl && (
                <a href={productUrl} className="mt-auto py-2 text-sm font-medium text-primary underline underline-offset-4 hover:text-foreground">
                  View on Shopify<span className="sr-only">: {product.title}</span>
                </a>
              )}
            </div>
          </li>
        )
      })}
    </ul>
  )
}
