import { Suspense } from "react"
import Link from "next/link"
import { Plus, Package, ShoppingCart, BarChart3, Settings, Zap } from "lucide-react"
import { getShopStats, getAllProducts, getOrders } from "@/lib/shop/products"
import { formatPrice } from "@/lib/shop/products"

async function ShopStatsCards() {
  const stats = await getShopStats()

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <div className="border border-border bg-background p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="label-mono text-xs font-semibold uppercase text-muted-foreground">TOTAL PRODUCTS</p>
            <p className="text-3xl font-bold text-foreground">{stats.total_products}</p>
            <p className="label-mono text-xs text-muted-foreground">{stats.active_products} Active</p>
          </div>
          <Package className="h-8 w-8 text-muted-foreground/50" />
        </div>
      </div>

      <div className="border border-border bg-background p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="label-mono text-xs font-semibold uppercase text-muted-foreground">TOTAL ORDERS</p>
            <p className="text-3xl font-bold text-foreground">{stats.total_orders}</p>
            <p className="label-mono text-xs text-muted-foreground">{formatPrice(stats.total_revenue)} Revenue</p>
          </div>
          <ShoppingCart className="h-8 w-8 text-muted-foreground/50" />
        </div>
      </div>

      <div className="border border-border bg-background p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="label-mono text-xs font-semibold uppercase text-muted-foreground">FEATURED</p>
            <p className="text-3xl font-bold text-foreground">{stats.featured_products}</p>
            <p className="label-mono text-xs text-muted-foreground">Products</p>
          </div>
          <Zap className="h-8 w-8 text-primary/50" />
        </div>
      </div>
    </div>
  )
}

async function ProductsList() {
  const products = await getAllProducts()

  const byStatus = {
    draft: products.filter((p) => p.status === "draft"),
    active: products.filter((p) => p.status === "active"),
    hidden: products.filter((p) => p.status === "hidden"),
    archived: products.filter((p) => p.status === "archived"),
  }

  return (
    <div className="space-y-6">
      {Object.entries(byStatus).map(
        ([status, statusProducts]) =>
          statusProducts.length > 0 && (
            <div key={status} className="border border-border bg-background p-6">
              <h3 className="label-mono mb-4 text-sm font-semibold uppercase text-foreground">
                {status} ({statusProducts.length})
              </h3>
              <div className="space-y-2">
                {statusProducts.slice(0, 5).map((product) => (
                  <Link
                    key={product.id}
                    href={`/dashboard/shop/products/${product.id}`}
                    className="flex items-center justify-between rounded border border-border/50 bg-muted/30 p-3 transition-colors hover:border-border hover:bg-muted/50"
                  >
                    <div className="flex-1">
                      <p className="font-medium text-foreground">{product.name}</p>
                      {product.price && (
                        <p className="label-mono text-xs text-muted-foreground">{formatPrice(product.price)}</p>
                      )}
                    </div>
                    {product.featured && (
                      <Zap className="h-4 w-4 text-primary" />
                    )}
                  </Link>
                ))}
                {statusProducts.length > 5 && (
                  <p className="label-mono text-xs text-muted-foreground">+{statusProducts.length - 5} more</p>
                )}
              </div>
            </div>
          ),
      )}
    </div>
  )
}

async function RecentOrders() {
  const orders = await getOrders()

  return (
    <div className="border border-border bg-background p-6">
      <h3 className="label-mono mb-4 text-sm font-semibold uppercase text-foreground">RECENT ORDERS</h3>
      <div className="space-y-2">
        {orders.slice(0, 5).map((order) => (
          <Link
            key={order.id}
            href={`/dashboard/shop/orders/${order.id}`}
            className="flex items-center justify-between rounded border border-border/50 bg-muted/30 p-3 transition-colors hover:border-border hover:bg-muted/50"
          >
            <div className="flex-1">
              <p className="font-medium text-foreground">{order.order_number}</p>
              <p className="label-mono text-xs text-muted-foreground">{order.customer_email}</p>
            </div>
            <div className="text-right">
              <p className="label-mono text-xs font-semibold uppercase text-foreground">{order.status}</p>
              {order.total_cents && (
                <p className="label-mono text-xs text-muted-foreground">{formatPrice(order.total_cents)}</p>
              )}
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}

export default function ShopDashboard() {
  return (
    <main className="min-h-screen bg-background">
      <div className="border-b border-border px-6 py-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">SHOP CONTROL CENTER</h1>
            <p className="label-mono mt-1 text-sm text-muted-foreground">Manage products, orders, and fulfillment</p>
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

      <div className="space-y-8 px-6 py-8">
        {/* Stats Cards */}
        <Suspense fallback={<div className="h-32 animate-pulse bg-muted" />}>
          <ShopStatsCards />
        </Suspense>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Products by Status */}
          <div className="lg:col-span-2">
            <Suspense fallback={<div className="h-96 animate-pulse bg-muted" />}>
              <ProductsList />
            </Suspense>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <Link
              href="/dashboard/shop/products"
              className="flex items-center justify-between border border-border bg-background p-4 transition-colors hover:border-primary hover:bg-muted/50"
            >
              <div className="flex items-center gap-3">
                <Package className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium text-foreground">Products</p>
                  <p className="label-mono text-xs text-muted-foreground">Manage all products</p>
                </div>
              </div>
            </Link>

            <Link
              href="/dashboard/shop/orders"
              className="flex items-center justify-between border border-border bg-background p-4 transition-colors hover:border-primary hover:bg-muted/50"
            >
              <div className="flex items-center gap-3">
                <ShoppingCart className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium text-foreground">Orders</p>
                  <p className="label-mono text-xs text-muted-foreground">Track & fulfill</p>
                </div>
              </div>
            </Link>

            <Link
              href="/dashboard/shop/printify"
              className="flex items-center justify-between border border-border bg-background p-4 transition-colors hover:border-primary hover:bg-muted/50"
            >
              <div className="flex items-center gap-3">
                <Zap className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium text-foreground">Printify</p>
                  <p className="label-mono text-xs text-muted-foreground">Print-on-demand</p>
                </div>
              </div>
            </Link>

            <Link
              href="/dashboard/shop/settings"
              className="flex items-center justify-between border border-border bg-background p-4 transition-colors hover:border-primary hover:bg-muted/50"
            >
              <div className="flex items-center gap-3">
                <Settings className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium text-foreground">Settings</p>
                  <p className="label-mono text-xs text-muted-foreground">Configure shop</p>
                </div>
              </div>
            </Link>
          </div>
        </div>

        {/* Recent Orders */}
        <Suspense fallback={<div className="h-32 animate-pulse bg-muted" />}>
          <RecentOrders />
        </Suspense>
      </div>
    </main>
  )
}
