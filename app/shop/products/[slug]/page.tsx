import { Suspense } from "react"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ExternalLink } from "lucide-react"
import { getProductBySlug, getProductVariants, formatPrice } from "@/lib/shop/products"
import { ProductBuyForm } from "@/components/shop/product-buy-form"
import { shopifyStoreUrl, SHOP_ORIGIN } from "@/lib/shop/shopify-url"

async function ProductDetails({ slug }: { slug: string }) {
  const product = await getProductBySlug(slug)

  if (!product) {
    notFound()
  }

  const variants = await getProductVariants(product.id)

  return (
    <main className="min-h-screen bg-background">
      <div className="border-b border-border px-6 py-4 flex items-center justify-between">
        <Link href="/shop" className="label-mono text-primary hover:underline text-sm">
          ← Back to Shop
        </Link>
        {SHOP_ORIGIN && (
          <a
            href={shopifyStoreUrl()}
            target="_blank"
            rel="noopener noreferrer"
            className="label-mono flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors"
          >
            <ExternalLink className="h-3 w-3" />
            Visit Full Storefront
          </a>
        )}
      </div>

      <div className="grid gap-12 px-6 py-12 lg:grid-cols-2">
        {/* Product Image */}
        <div className="space-y-4">
          {product.image_url ? (
            <div className="border border-border bg-muted">
              <img src={product.image_url} alt={product.name} className="h-full w-full object-cover" />
            </div>
          ) : (
            <div className="border border-border bg-muted p-12 text-center">
              <p className="label-mono text-muted-foreground">No image available</p>
            </div>
          )}
          {product.gallery_images && product.gallery_images.length > 0 && (
            <div className="grid grid-cols-4 gap-2">
              {product.gallery_images.slice(0, 4).map((img, i) => (
                <div key={i} className="border border-border bg-muted aspect-square">
                  <img src={img} alt={`${product.name} ${i + 1}`} className="h-full w-full object-cover" />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="space-y-8">
          <div>
            <h1 className="mb-2 text-3xl font-bold text-foreground">{product.name}</h1>
            {product.category && <p className="label-mono text-muted-foreground">{product.category}</p>}
          </div>

          {/* Pricing */}
          <div className="space-y-2">
            <div className="flex items-baseline gap-3">
              {product.price && <p className="text-3xl font-bold text-primary">{formatPrice(product.price)}</p>}
              {product.compare_at_price && (
                <p className="label-mono text-sm text-muted-foreground line-through">
                  {formatPrice(product.compare_at_price)}
                </p>
              )}
            </div>
            {product.price && product.compare_at_price && product.compare_at_price > product.price && (
              <p className="label-mono text-xs font-semibold text-primary">
                SAVE {formatPrice(product.compare_at_price - product.price)}
              </p>
            )}
          </div>

          {/* Description */}
          {product.short_description && (
            <p className="text-lg leading-relaxed text-foreground">{product.short_description}</p>
          )}

          {/* Buy Form */}
          <ProductBuyForm product={product} variants={variants} />

          {/* Full Description */}
          {product.description && (
            <div className="space-y-4 border-t border-border pt-8">
              <h3 className="label-mono font-semibold text-foreground">DETAILS</h3>
              <div className="prose prose-sm max-w-none text-muted-foreground">{product.description}</div>
            </div>
          )}

          {/* SKU */}
          {product.sku && (
            <div className="border-t border-border pt-4">
              <p className="label-mono text-xs text-muted-foreground">SKU: {product.sku}</p>
            </div>
          )}
        </div>
      </div>
    </main>
  )
}

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const product = await getProductBySlug(params.slug)

  if (!product) {
    return { title: "Product Not Found" }
  }

  return {
    title: product.seo_title || product.name,
    description: product.seo_description || product.short_description,
    openGraph: {
      title: product.seo_title || product.name,
      description: product.seo_description || product.short_description,
      images: product.og_image_url || product.image_url ? [{ url: product.og_image_url || product.image_url }] : [],
    },
  }
}

export default function ProductPage({ params }: { params: { slug: string } }) {
  return (
    <Suspense fallback={<div className="min-h-screen animate-pulse bg-muted" />}>
      <ProductDetails slug={params.slug} />
    </Suspense>
  )
}
