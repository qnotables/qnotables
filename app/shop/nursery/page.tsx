import type { Metadata } from "next"
import Link from "next/link"
import { SiteFooter } from "@/components/site-footer"
import { NurseryProductGrid } from "@/components/shop/nursery-product-grid"
import { getNurseryCatalog, nurseryStoreUrl } from "@/lib/shop/nursery-catalog"

export const metadata: Metadata = {
  title: "Roosters Ridge Nursery | QNotables Shop",
  description: "Browse live plants from Roosters Ridge Nursery and purchase directly from the nursery on Shopify.",
}

export default async function NurseryPage() {
  const products = await getNurseryCatalog()

  return (
    <div className="min-h-screen tactical-grid">
      <main>
        <header className="border-b border-border px-4 py-10 md:px-6 md:py-16">
          <div className="mx-auto flex max-w-6xl flex-col items-start gap-5">
            <Link href="/shop" className="label-mono py-2 text-primary hover:underline">Back to QNotables Shop</Link>
            <div className="flex flex-col gap-3">
              <p className="label-mono text-primary">Partner shop / Live plants</p>
              <h1 className="stencil text-4xl md:text-6xl">Roosters Ridge Nursery</h1>
              <p className="max-w-xl text-muted-foreground">Browse plants from the nursery&apos;s live catalog. Orders are placed directly with Roosters Ridge through Shopify.</p>
            </div>
            <a href={nurseryStoreUrl} className="label-mono border border-primary px-4 py-3 text-primary transition-colors hover:bg-primary hover:text-primary-foreground">Shop the full nursery catalog</a>
          </div>
        </header>
        <section aria-labelledby="nursery-catalog" className="border-b border-border px-4 py-10 md:px-6 md:py-12">
          <div className="mx-auto flex max-w-6xl flex-col gap-6">
            <h2 id="nursery-catalog" className="stencil text-2xl md:text-3xl">Plants from the nursery</h2>
            {products?.length ? (
              <NurseryProductGrid products={products} />
            ) : (
              <p className="text-muted-foreground">
                {products ? "No plants are listed here right now." : "The live catalog is temporarily unavailable."}{" "}
                <a href={nurseryStoreUrl} className="text-primary underline underline-offset-4">Visit the nursery on Shopify</a> to browse directly.
              </p>
            )}
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  )
}
