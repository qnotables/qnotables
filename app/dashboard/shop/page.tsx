import { redirect } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Package, DollarSign, ShoppingCart } from "lucide-react"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { createClient } from "@/lib/supabase/server"
import { isAdminEmail } from "@/lib/admin"
import { PRODUCTS } from "@/lib/products"

export const metadata = {
  title: "Shop Dashboard — Admin",
}

// Mock order data for demonstration
const MOCK_ORDERS = [
  {
    id: "ORDER-001",
    date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    customer: "Alex Chen",
    items: "Field Tee (L), Recon Cap (One Size)",
    total: 60,
    status: "shipped",
  },
  {
    id: "ORDER-002",
    date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    customer: "Jordan Smith",
    items: "Morale Patch (Velcro), Field Mug (Olive)",
    total: 30,
    status: "processing",
  },
  {
    id: "ORDER-003",
    date: new Date(Date.now() - 3 * 60 * 60 * 1000),
    customer: "Sam Patel",
    items: "Sticker Pack (Classic)",
    total: 8,
    status: "pending",
  },
  {
    id: "ORDER-004",
    date: new Date(Date.now() - 5 * 60 * 60 * 1000),
    customer: "Riley Kim",
    items: "Sourced Notebook (Hardcover)",
    total: 28,
    status: "pending",
  },
]

const SUBSCRIPTION_USERS = [
  { id: "SUB-001", email: "operator@email.com", plan: "Intel", renewalDate: "2025-01-15" },
  { id: "SUB-002", email: "admin@example.com", plan: "Command", renewalDate: "2025-01-20" },
  { id: "SUB-003", email: "subscriber@example.com", plan: "Command", renewalDate: "2025-02-01" },
  { id: "SUB-004", email: "vip@example.com", plan: "Intel", renewalDate: "2025-01-28" },
]

export default async function ShopDashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect("/auth/login")
  if (!isAdminEmail(user.email)) redirect("/shop")

  const goods = PRODUCTS.filter((p) => p.type === "good")
  const subscriptions = PRODUCTS.filter((p) => p.type === "subscription")

  return (
    <div id="top" className="min-h-screen tactical-grid">
      <SiteHeader />

      <main className="mx-auto max-w-7xl px-4 py-10 md:px-6">
        <Link
          href="/shop"
          className="label-mono mb-8 inline-flex items-center gap-2 text-muted-foreground transition-colors hover:text-primary"
        >
          <ArrowLeft className="h-4 w-4" /> Shop
        </Link>

        <div className="mb-8 flex items-center gap-3">
          <span className="h-2 w-2 bg-primary" />
          <h1 className="stencil text-3xl text-foreground">Shop Dashboard</h1>
        </div>

        {/* KPI cards */}
        <div className="mb-12 grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="corner-frame border border-border bg-card p-6">
            <div className="flex items-center gap-3 mb-2">
              <DollarSign className="h-5 w-5 text-primary" />
              <span className="label-mono text-muted-foreground">Revenue (30d)</span>
            </div>
            <p className="stencil text-2xl text-foreground">$1,240</p>
            <p className="label-mono text-xs text-muted-foreground mt-2">4 orders, 4 subscriptions</p>
          </div>

          <div className="corner-frame border border-border bg-card p-6">
            <div className="flex items-center gap-3 mb-2">
              <ShoppingCart className="h-5 w-5 text-primary" />
              <span className="label-mono text-muted-foreground">Active Orders</span>
            </div>
            <p className="stencil text-2xl text-foreground">2</p>
            <p className="label-mono text-xs text-muted-foreground mt-2">1 pending, 1 processing</p>
          </div>

          <div className="corner-frame border border-border bg-card p-6">
            <div className="flex items-center gap-3 mb-2">
              <Package className="h-5 w-5 text-primary" />
              <span className="label-mono text-muted-foreground">Products</span>
            </div>
            <p className="stencil text-2xl text-foreground">{PRODUCTS.length}</p>
            <p className="label-mono text-xs text-muted-foreground mt-2">
              {goods.length} goods, {subscriptions.length} subscriptions
            </p>
          </div>
        </div>

        {/* Products inventory */}
        <div className="mb-12 border-b border-border pb-12">
          <h2 className="stencil mb-6 text-2xl text-foreground">Product Catalog</h2>

          <div className="space-y-6">
            <div>
              <h3 className="label-mono mb-3 font-semibold text-foreground">Subscriptions</h3>
              <div className="space-y-2">
                {subscriptions.map((product) => (
                  <div
                    key={product.id}
                    className="flex items-center justify-between border border-border bg-muted/20 p-3"
                  >
                    <div>
                      <p className="font-semibold text-foreground">{product.name}</p>
                      <p className="label-mono text-sm text-muted-foreground">
                        {product.description}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="stencil text-primary">
                        ${(product.monthlyInCents / 100).toFixed(0)}/mo
                      </p>
                      <p className="label-mono text-xs text-muted-foreground">
                        or ${(product.annualInCents / 100).toFixed(0)}/yr
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="label-mono mb-3 font-semibold text-foreground">Branded Goods</h3>
              <div className="space-y-2">
                {goods.map((product) => (
                  <div
                    key={product.id}
                    className="flex items-center justify-between border border-border bg-muted/20 p-3"
                  >
                    <div>
                      <p className="font-semibold text-foreground">{product.name}</p>
                      <p className="label-mono text-sm text-muted-foreground">
                        {product.description}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="stencil text-primary">
                        ${(product.priceInCents / 100).toFixed(2)}
                      </p>
                      <p className="label-mono text-xs text-muted-foreground">ships 3-5 days</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Recent orders */}
        <div className="mb-12 border-b border-border pb-12">
          <h2 className="stencil mb-6 text-2xl text-foreground">Recent Orders</h2>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-border">
              <thead>
                <tr className="bg-muted/50">
                  <th className="border border-border px-4 py-3 text-left font-semibold text-foreground">
                    Order
                  </th>
                  <th className="border border-border px-4 py-3 text-left font-semibold text-foreground">
                    Customer
                  </th>
                  <th className="border border-border px-4 py-3 text-left font-semibold text-foreground">
                    Items
                  </th>
                  <th className="border border-border px-4 py-3 text-center font-semibold text-foreground">
                    Total
                  </th>
                  <th className="border border-border px-4 py-3 text-center font-semibold text-foreground">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {MOCK_ORDERS.map((order) => (
                  <tr key={order.id} className="border-t border-border hover:bg-muted/20">
                    <td className="border border-border px-4 py-3">
                      <p className="label-mono font-semibold text-primary">{order.id}</p>
                      <p className="label-mono text-xs text-muted-foreground">
                        {order.date.toLocaleDateString()}
                      </p>
                    </td>
                    <td className="border border-border px-4 py-3 text-foreground">
                      {order.customer}
                    </td>
                    <td className="border border-border px-4 py-3 text-foreground">
                      {order.items}
                    </td>
                    <td className="border border-border px-4 py-3 text-center font-semibold text-foreground">
                      ${order.total}
                    </td>
                    <td className="border border-border px-4 py-3 text-center">
                      <span
                        className={`label-mono inline-block px-2.5 py-1 text-xs font-semibold ${
                          order.status === "shipped"
                            ? "bg-green-500/20 text-green-700"
                            : order.status === "processing"
                              ? "bg-blue-500/20 text-blue-700"
                              : "bg-amber-500/20 text-amber-700"
                        }`}
                      >
                        {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Active subscriptions */}
        <div>
          <h2 className="stencil mb-6 text-2xl text-foreground">Active Subscriptions</h2>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-border">
              <thead>
                <tr className="bg-muted/50">
                  <th className="border border-border px-4 py-3 text-left font-semibold text-foreground">
                    Subscriber
                  </th>
                  <th className="border border-border px-4 py-3 text-left font-semibold text-foreground">
                    Plan
                  </th>
                  <th className="border border-border px-4 py-3 text-left font-semibold text-foreground">
                    Renewal Date
                  </th>
                </tr>
              </thead>
              <tbody>
                {SUBSCRIPTION_USERS.map((sub) => (
                  <tr key={sub.id} className="border-t border-border hover:bg-muted/20">
                    <td className="border border-border px-4 py-3">
                      <p className="font-semibold text-foreground">{sub.email}</p>
                      <p className="label-mono text-xs text-muted-foreground">{sub.id}</p>
                    </td>
                    <td className="border border-border px-4 py-3">
                      <span className="label-mono inline-block bg-primary/20 px-2.5 py-1 font-semibold text-primary">
                        {sub.plan}
                      </span>
                    </td>
                    <td className="border border-border px-4 py-3 text-foreground">
                      {new Date(sub.renewalDate).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  )
}
