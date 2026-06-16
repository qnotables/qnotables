import { redirect } from "next/navigation"
import { createAdminClient } from "@/lib/supabase/admin"
import { validateDashboardAccess } from "@/lib/dashboard-auth"
import { PageHeader, StatCard } from "@/components/dashboard/ui"
import { UsersTable, type UserRow } from "@/components/dashboard/users-table"
import { Users, ShieldCheck, UserX } from "lucide-react"

export const dynamic = "force-dynamic"

export const metadata = {
  title: "User Management — Admin Dashboard",
  description: "Manage user roles and account status.",
}

export default async function UsersPage() {
  const hasAccess = await validateDashboardAccess()
  if (!hasAccess) redirect("/dashboard/login")

  const admin = createAdminClient()
  const { data } = await admin
    .from("profiles")
    .select("id, display_name, username, email, role, status, karma, created_at")
    .order("created_at", { ascending: false })

  const users: UserRow[] = (data || []).map((u: any) => ({
    id: u.id,
    name: u.display_name || u.username || "Anonymous",
    email: u.email,
    role: u.role || "user",
    status: u.status || "active",
    karma: u.karma ?? 0,
    createdAt: u.created_at,
  }))

  const staff = users.filter((u) => u.role === "admin" || u.role === "moderator").length
  const restricted = users.filter((u) => u.status !== "active").length

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="User Management"
        description="Assign roles and manage account status across the community."
        breadcrumbs={[{ label: "Users" }]}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Total Users" value={users.length} icon={Users} />
        <StatCard label="Staff" value={staff} icon={ShieldCheck} />
        <StatCard label="Restricted" value={restricted} icon={UserX} />
      </div>

      <UsersTable users={users} />
    </div>
  )
}
