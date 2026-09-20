import type React from "react"
import { validateDashboardAccess } from "@/lib/dashboard-auth"
import { DashboardShell } from "@/components/dashboard/dashboard-shell"

export const dynamic = "force-dynamic"

export const metadata = {
  title: "Control Room",
  description: "Administrative control room for QNotables.",
  robots: { index: false, follow: false },
  alternates: { canonical: "https://www.qnotables.ai/dashboard" },
}

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const hasAccess = await validateDashboardAccess()

  // Not authenticated: render the page bare so the login page (which handles
  // its own UI and redirect) shows without the shell. Protected pages each
  // call validateDashboardAccess() and redirect to /dashboard/login.
  if (!hasAccess) {
    return <>{children}</>
  }

  // Secret-key holders are treated as full admins.
  return <DashboardShell role="admin">{children}</DashboardShell>
}
