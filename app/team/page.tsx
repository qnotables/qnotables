import { Suspense } from "react"
import { Users } from "lucide-react"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { TeamMemberCard } from "@/components/team/team-member-card"
import { TeamFilters } from "@/components/team/team-filters"
import { getTeamMembers, getTeamGroups } from "@/lib/team"

export const metadata = {
  title: "Team — Hot and Fresh",
  description: "Meet the team behind Hot and Fresh news operation.",
}

interface PageProps {
  searchParams: Promise<{ group?: string }>
}

async function TeamContent({ group }: { group?: string }) {
  const [members, groups] = await Promise.all([getTeamMembers(group), getTeamGroups()])

  return (
    <>
      {/* Filters */}
      <div className="mx-auto max-w-7xl px-4 py-6 md:px-6">
        <TeamFilters groups={groups} selectedGroup={group || null} />
      </div>

      {/* Grid */}
      {members.length === 0 ? (
        <div className="mx-auto max-w-7xl px-4 py-12 text-center md:px-6">
          <p className="text-muted-foreground">No team members to display yet.</p>
        </div>
      ) : (
        <div className="mx-auto max-w-7xl px-4 py-8 md:px-6">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {members.map((member) => (
              <TeamMemberCard key={member.id} member={member} />
            ))}
          </div>
        </div>
      )}
    </>
  )
}

export default async function TeamPage({ searchParams }: PageProps) {
  const params = await searchParams
  const group = params.group || undefined

  return (
    <div id="top" className="min-h-screen tactical-grid">
      <SiteHeader />

      <main className="flex-1">
        {/* Hero */}
        <div className="border-b border-border bg-card">
          <div className="mx-auto max-w-7xl px-4 py-12 md:px-6">
            <div className="flex items-start gap-4">
              <Users className="mt-1 h-6 w-6 text-primary flex-shrink-0" />
              <div>
                <h1 className="stencil text-4xl text-foreground md:text-5xl">Team</h1>
                <p className="label-mono mt-2 text-muted-foreground">
                  The journalists, researchers, and technologists powering Hot and Fresh.
                </p>
              </div>
            </div>
          </div>
        </div>

        <Suspense fallback={<div className="py-20 text-center text-muted-foreground">Loading team...</div>}>
          <TeamContent group={group} />
        </Suspense>
      </main>

      <SiteFooter />
    </div>
  )
}
