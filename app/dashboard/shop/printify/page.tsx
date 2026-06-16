import { redirect } from "next/navigation"
import { validateDashboardAccess } from "@/lib/dashboard-auth"
import { PrintifySettings } from "@/components/dashboard/shop/printify-settings"

export const dynamic = "force-dynamic"

export const metadata = {
  title: "Printify Integration — Dashboard",
  description: "Connect Printify for print-on-demand fulfillment",
}

export default async function PrintifySettingsPage() {
  const hasAccess = await validateDashboardAccess()
  if (!hasAccess) redirect("/dashboard/login")

  return (
    <main className="min-h-screen bg-background">
      <div className="border-b border-border px-6 py-8">
        <h1 className="text-3xl font-bold text-foreground">PRINTIFY INTEGRATION</h1>
        <p className="label-mono mt-1 text-sm text-muted-foreground">
          Connect your Printify account for print-on-demand fulfillment
        </p>
      </div>

      <PrintifySettings />
    </main>
  )
}
