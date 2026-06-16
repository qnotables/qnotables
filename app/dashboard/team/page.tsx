import { redirect } from "next/navigation"
import { Plus, Users, Eye, EyeOff } from "lucide-react"
import { createAdminClient } from "@/lib/supabase/admin"
import { validateDashboardAccess } from "@/lib/dashboard-auth"
import { PageHeader, StatCard } from "@/components/dashboard/ui"
import { Users as UsersIcon } from "lucide-react"

export const dynamic = "force-dynamic"

export const metadata = {
  title: "Team Management — Admin Dashboard",
  description: "Manage team members visibility and display on public team page.",
}

export default async function TeamDashboardPage() {
  const hasAccess = await validateDashboardAccess()
  if (!hasAccess) redirect("/dashboard/login")

  const admin = createAdminClient()
  const { data } = await admin
    .from("profiles")
    .select(
      "id, display_name, username, title, team_group, avatar_url, show_on_team_page, team_sort_order"
    )
    .order("team_sort_order", { ascending: true })
    .order("display_name", { ascending: true })

  const allMembers = (data || []).map((m: any) => ({
    id: m.id,
    name: m.display_name || m.username || "Anonymous",
    title: m.title,
    group: m.team_group,
    shown: m.show_on_team_page,
    order: m.team_sort_order,
  }))

  const teamMembers = allMembers.filter((m) => m.shown)
  const hiddenMembers = allMembers.filter((m) => !m.shown)

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Team Management"
        description="Manage which team members appear on the public team page."
        breadcrumbs={[{ label: "Team" }]}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Total Members" value={allMembers.length} icon={UsersIcon} />
        <StatCard label="On Team Page" value={teamMembers.length} icon={Eye} />
        <StatCard label="Hidden" value={hiddenMembers.length} icon={EyeOff} />
      </div>

      <div className="space-y-6">
        {/* Team Members Shown */}
        <div>
          <div className="mb-4 flex items-center gap-2">
            <Eye className="h-5 w-5 text-primary" />
            <h2 className="stencil text-lg text-foreground">Visible on Team Page</h2>
          </div>
          {teamMembers.length === 0 ? (
            <p className="text-muted-foreground">No team members are currently visible.</p>
          ) : (
            <div className="border border-border overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/30 border-b border-border">
                  <tr>
                    <th className="px-4 py-2 text-left font-semibold">Name</th>
                    <th className="px-4 py-2 text-left font-semibold">Title</th>
                    <th className="hidden px-4 py-2 text-left font-semibold sm:table-cell">Group</th>
                    <th className="hidden px-4 py-2 text-left font-semibold sm:table-cell">Order</th>
                    <th className="px-4 py-2 text-left font-semibold">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {teamMembers.map((m) => (
                    <tr key={m.id} className="border-b border-border hover:bg-muted/20">
                      <td className="px-4 py-2 text-foreground">{m.name}</td>
                      <td className="px-4 py-2 text-muted-foreground text-sm">{m.title || "—"}</td>
                      <td className="hidden px-4 py-2 text-muted-foreground text-sm sm:table-cell">{m.group || "—"}</td>
                      <td className="hidden px-4 py-2 text-muted-foreground text-sm sm:table-cell">{m.order}</td>
                      <td className="px-4 py-2">
                        <button className="text-muted-foreground hover:text-primary transition-colors text-sm label-mono">Edit</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Hidden Members */}
        {hiddenMembers.length > 0 && (
          <div>
            <div className="mb-4 flex items-center gap-2">
              <EyeOff className="h-5 w-5 text-muted-foreground" />
              <h2 className="stencil text-lg text-foreground">Hidden from Team Page</h2>
            </div>
            <div className="border border-border overflow-x-auto opacity-60">
              <table className="w-full text-sm">
                <thead className="bg-muted/30 border-b border-border">
                  <tr>
                    <th className="px-4 py-2 text-left font-semibold">Name</th>
                    <th className="px-4 py-2 text-left font-semibold">Title</th>
                    <th className="hidden px-4 py-2 text-left font-semibold sm:table-cell">Group</th>
                    <th className="px-4 py-2 text-left font-semibold">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {hiddenMembers.map((m) => (
                    <tr key={m.id} className="border-b border-border hover:bg-muted/20">
                      <td className="px-4 py-2 text-foreground">{m.name}</td>
                      <td className="px-4 py-2 text-muted-foreground text-sm">{m.title || "—"}</td>
                      <td className="hidden px-4 py-2 text-muted-foreground text-sm sm:table-cell">{m.group || "—"}</td>
                      <td className="px-4 py-2">
                        <button className="text-muted-foreground hover:text-primary transition-colors text-sm label-mono">Show</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
