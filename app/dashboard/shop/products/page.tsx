import { Suspense } from "react"
import Link from "next/link"
import { Plus, Search, Filter, Edit, Trash2, Eye, Star } from "lucide-react"
import { getAllProducts } from "@/lib/shop/products"
import { formatPrice } from "@/lib/shop/products"

async function ProductsTable() {
  const products = await getAllProducts()

  return (
    <div className="border border-border bg-background">
      {products.length === 0 ? (
        <div className="p-12 text-center">
          <p className="label-mono text-muted-foreground">No products yet. Create your first product to get started.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="px-6 py-4 text-left font-semibold text-foreground">NAME</th>
                <th className="px-6 py-4 text-left font-semibold text-foreground">SKU</th>
                <th className="px-6 py-4 text-left font-semibold text-foreground">PRICE</th>
                <th className="px-6 py-4 text-left font-semibold text-foreground">STATUS</th>
                <th className="px-6 py-4 text-center font-semibold text-foreground">ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr key={product.id} className="border-b border-border/50 transition-colors hover:bg-muted/20">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      {product.image_url && (
                        <img
                          src={product.image_url}
                          alt={product.name}
                          className="h-10 w-10 rounded object-cover"
                        />
                      )}
                      <div>
                        <p className="font-medium text-foreground">{product.name}</p>
                        <p className="label-mono text-xs text-muted-foreground">{product.slug}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="label-mono text-sm text-muted-foreground">{product.sku || "—"}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="font-medium text-foreground">{product.price ? formatPrice(product.price) : "—"}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`label-mono inline-block px-2.5 py-1 text-xs font-semibold uppercase ${
                        product.status === "active"
                          ? "bg-green-500/20 text-green-700"
                          : product.status === "draft"
                            ? "bg-amber-500/20 text-amber-700"
                            : "bg-gray-500/20 text-gray-700"
                      }`}
                    >
                      {product.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-center gap-2">
                      <Link
                        href={`/dashboard/shop/products/${product.id}`}
                        className="rounded border border-border p-2 transition-colors hover:bg-muted"
                        title="Edit product"
                      >
                        <Edit className="h-4 w-4 text-muted-foreground" />
                      </Link>
                      {product.featured && (
                        <div className="rounded border border-border p-2" title="Featured">
                          <Star className="h-4 w-4 fill-primary text-primary" />
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

export default function ProductsPage() {
  return (
    <main className="min-h-screen bg-background">
      <div className="border-b border-border px-6 py-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">PRODUCTS</h1>
            <p className="label-mono mt-1 text-sm text-muted-foreground">Manage your product catalog</p>
          </div>
          <Link
            href="/dashboard/shop/products/new"
            className="inline-flex items-center gap-2 bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
          >
            <Plus className="h-4 w-4" />
            NEW PRODUCT
          </Link>
        </div>
      </div>

      <div className="space-y-6 px-6 py-8">
        {/* Search and Filter */}
        <div className="flex gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search products..."
                className="w-full border border-border bg-background py-2.5 pl-10 pr-4 text-foreground placeholder-muted-foreground outline-none focus:border-primary"
              />
            </div>
          </div>
          <button className="inline-flex items-center gap-2 border border-border px-4 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-muted">
            <Filter className="h-4 w-4" />
            FILTER
          </button>
        </div>

        {/* Products Table */}
        <Suspense fallback={<div className="h-96 animate-pulse bg-muted" />}>
          <ProductsTable />
        </Suspense>
      </div>
    </main>
  )
}
