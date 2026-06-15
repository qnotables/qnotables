import { Suspense } from "react"
import Link from "next/link"
import { getAllProducts } from "@/lib/shop/products"
import { formatPrice } from "@/lib/shop/products"

async function ProductGrid() {
  const products = await getAllProducts()
  const active = products.filter((p) => p.status === "active")

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {active.map((product) => (
        <Link
          key={product.id}
          href={`/shop/products/${product.slug}`}
          className="group border border-border bg-background transition-all hover:border-primary"
        >
          {product.image_url && (
            <div className="relative h-64 overflow-hidden bg-muted">
              <img
                src={product.image_url}
                alt={product.name}
                className="h-full w-full object-cover transition-transform group-hover:scale-105"
              />
            </div>
          )}
          <div className="p-4">
            <h3 className="font-semibold text-foreground">{product.name}</h3>
            {product.short_description && (
              <p className="label-mono mt-1 line-clamp-2 text-xs text-muted-foreground">{product.short_description}</p>
            )}
            {product.price && (
              <div className="mt-3 flex items-center gap-2">
                <p className="font-bold text-primary">{formatPrice(product.price)}</p>
                {product.compare_at_price && (
                  <p className="label-mono text-xs text-muted-foreground line-through">
                    {formatPrice(product.compare_at_price)}
                  </p>
                )}
              </div>
            )}
          </div>
        </Link>
      ))}
    </div>
  )
}

export default function AllProductsPage() {
  return (
    <main className="min-h-screen bg-background">
      <div className="border-b border-border px-6 py-8">
        <h1 className="text-3xl font-bold text-foreground">ALL PRODUCTS</h1>
        <p className="label-mono mt-1 text-sm text-muted-foreground">Browse our complete catalog</p>
      </div>

      <div className="px-6 py-12">
        <Suspense fallback={<div className="h-96 animate-pulse bg-muted" />}>
          <ProductGrid />
        </Suspense>
      </div>
    </main>
  )
}
