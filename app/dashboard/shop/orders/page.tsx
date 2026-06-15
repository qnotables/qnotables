import { Suspense } from "react"
import Link from "next/link"
import { getOrders } from "@/lib/shop/products"
import { formatPrice } from "@/lib/shop/products"
import { Eye } from "lucide-react"

export const dynamic = "force-dynamic"

async function OrdersTable() {
  const orders = await getOrders()

  const statusColors: Record<string, string> = {
    pending: "bg-amber-500/20 text-amber-700",
    paid: "bg-blue-500/20 text-blue-700",
    in_production: "bg-purple-500/20 text-purple-700",
    fulfilled: "bg-green-500/20 text-green-700",
    cancelled: "bg-red-500/20 text-red-700",
    refunded: "bg-orange-500/20 text-orange-700",
    failed: "bg-red-500/20 text-red-700",
  }

  return (
    <div className="border border-border bg-background">
      {orders.length === 0 ? (
        <div className="p-12 text-center">
          <p className="label-mono text-muted-foreground">No orders yet.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="px-6 py-4 text-left font-semibold text-foreground">ORDER</th>
                <th className="px-6 py-4 text-left font-semibold text-foreground">CUSTOMER</th>
                <th className="px-6 py-4 text-left font-semibold text-foreground">TOTAL</th>
                <th className="px-6 py-4 text-left font-semibold text-foreground">STATUS</th>
                <th className="px-6 py-4 text-left font-semibold text-foreground">DATE</th>
                <th className="px-6 py-4 text-center font-semibold text-foreground">ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id} className="border-b border-border/50 transition-colors hover:bg-muted/20">
                  <td className="px-6 py-4">
                    <p className="font-semibold text-foreground">{order.order_number}</p>
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <p className="text-foreground">{order.customer_name || "—"}</p>
                      <p className="label-mono text-xs text-muted-foreground">{order.customer_email}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="font-semibold text-foreground">
                      {order.total_cents ? formatPrice(order.total_cents) : "—"}
                    </p>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`label-mono inline-block px-2.5 py-1 text-xs font-semibold uppercase ${statusColors[order.status] || statusColors.pending}`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <p className="label-mono text-sm text-muted-foreground">
                      {new Date(order.created_at).toLocaleDateString()}
                    </p>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-center">
                      <Link
                        href={`/dashboard/shop/orders/${order.id}`}
                        className="rounded border border-border p-2 transition-colors hover:bg-muted"
                        title="View details"
                      >
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      </Link>
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

export default function OrdersPage() {
  return (
    <main className="min-h-screen bg-background">
      <div className="border-b border-border px-6 py-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">ORDERS</h1>
          <p className="label-mono mt-1 text-sm text-muted-foreground">Track and manage all orders</p>
        </div>
      </div>

      <div className="space-y-6 px-6 py-8">
        {/* Status Filter */}
        <div className="flex gap-2 overflow-x-auto">
          <button className="label-mono inline-block whitespace-nowrap border border-primary bg-primary px-4 py-2 font-semibold text-primary-foreground">
            ALL
          </button>
          <button className="label-mono inline-block whitespace-nowrap border border-border px-4 py-2 font-semibold text-foreground transition-colors hover:bg-muted">
            PENDING
          </button>
          <button className="label-mono inline-block whitespace-nowrap border border-border px-4 py-2 font-semibold text-foreground transition-colors hover:bg-muted">
            PAID
          </button>
          <button className="label-mono inline-block whitespace-nowrap border border-border px-4 py-2 font-semibold text-foreground transition-colors hover:bg-muted">
            IN PRODUCTION
          </button>
          <button className="label-mono inline-block whitespace-nowrap border border-border px-4 py-2 font-semibold text-foreground transition-colors hover:bg-muted">
            FULFILLED
          </button>
        </div>

        {/* Orders Table */}
        <Suspense fallback={<div className="h-96 animate-pulse bg-muted" />}>
          <OrdersTable />
        </Suspense>
      </div>
    </main>
  )
}
