import { redirect } from "next/navigation"
import { validateDashboardAccess } from "@/lib/dashboard-auth"
import { ProductEditor } from "@/components/dashboard/shop/product-editor"

export const dynamic = "force-dynamic"

export const metadata = {
  title: "Create Product — Dashboard",
  description: "Create a new product for your shop",
}

export default async function ProductEditorPage() {
  const hasAccess = await validateDashboardAccess()
  if (!hasAccess) redirect("/dashboard/login")

  return (
    <main className="min-h-screen bg-background">
      <div className="border-b border-border px-6 py-8">
        <h1 className="text-3xl font-bold text-foreground">NEW PRODUCT</h1>
        <p className="label-mono mt-1 text-sm text-muted-foreground">Create a new product for your shop</p>
      </div>

      <div className="px-6 py-8">
        <ProductEditor isNew={true} />
      </div>
    </main>
  )
}
