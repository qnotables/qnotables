import { redirect } from "next/navigation"
import { validateDashboardAccess } from "@/lib/dashboard-auth"
import { ShopSettingsForm } from "@/components/dashboard/shop/shop-settings-form"

export const dynamic = "force-dynamic"

export const metadata = {
  title: "Shop Settings — Dashboard",
  description: "Configure your shop behavior and defaults",
}

export default async function ShopSettingsPage() {
  const hasAccess = await validateDashboardAccess()
  if (!hasAccess) redirect("/dashboard/login")

  return (
    <main className="min-h-screen bg-background">
      <div className="border-b border-border px-6 py-8">
        <h1 className="text-3xl font-bold text-foreground">SHOP SETTINGS</h1>
        <p className="label-mono mt-1 text-sm text-muted-foreground">Configure your shop behavior and defaults</p>
      </div>

      <ShopSettingsForm />
    </main>
  )
}
