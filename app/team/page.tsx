export const dynamic = "force-dynamic"

import { Suspense } from "react"
import { Shield } from "lucide-react"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { TeamMemberCard } from "@/components/team/team-member-card"
import { TeamFilters } from "@/components/team/team-filters"
import { getTeamMembers, getTeamGroups, getRoleLabel, type TeamRole } from "@/lib/team"

export const metadata = {
  title: "Team — Qnotables",
  description: "Meet the owners, admins, and moderators of Qnotables.",
}

interface PageProps {
  searchParams: Promise<{ group?: string }>
}

const ROLE_SECTIONS: { role: TeamRole; description: string }[] = [
  { role: "owner", description: "Site owners and founders." },
  { role: "admin", description: "Administrators who manage the platform." },
  { role: "moderator", description: "Moderators who keep the community on track." },
]

async function TeamContent({ group }: { group?: string }) {
  const [members, groups] = await Promise.all([getTeamMembers(group), getTeamGroups()])

  // Group members by role for sectioned display (only when showing all)
  const sections = group
    ? [{ role: group as TeamRole, description: "", members }]
    : ROLE_SECTIONS.map((s) => ({
        ...s,
        members: members.filter((m) => m.role === s.role),
      })).filter((s) => s.members.length > 0)

  return (
    <>
      {/* Role filters */}
      <div className="border-b border-border bg-muted/20">
        <div className="mx-auto max-w-7xl px-4 py-4 md:px-6">
          <TeamFilters groups={groups} selectedGroup={group || null} />
        </div>
      </div>

      {members.length === 0 ? (
        <div className="mx-auto max-w-7xl px-4 py-20 text-center md:px-6">
          <p className="label-mono text-muted-foreground">No team members found.</p>
        </div>
      ) : (
        <div className="mx-auto max-w-7xl px-4 py-10 md:px-6 space-y-12">
          {sections.map((section) => (
            <section key={section.role}>
              {/* Section header — only shown when listing all roles */}
              {!group && (
                <div className="mb-6 border-b border-border pb-3">
                  <h2 className="stencil text-2xl text-foreground">
                    {getRoleLabel(section.role)}s
                  </h2>
                  {section.description && (
                    <p className="label-mono mt-1 text-xs text-muted-foreground">
                      {section.description}
                    </p>
                  )}
                </div>
              )}
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {section.members.map((member) => (
                  <TeamMemberCard key={member.id} member={member} />
                ))}
              </div>
            </section>
          ))}
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
              <Shield className="mt-1 h-6 w-6 text-primary flex-shrink-0" aria-hidden="true" />
              <div>
                <h1 className="stencil text-4xl text-foreground md:text-5xl">The Team</h1>
                <p className="label-mono mt-2 text-muted-foreground">
                  Owners, admins, and moderators of Qnotables.
                </p>
              </div>
            </div>
          </div>
        </div>

        <Suspense
          fallback={
            <div className="py-20 text-center">
              <p className="label-mono text-muted-foreground">Loading team...</p>
            </div>
          }
        >
          <TeamContent group={group} />
        </Suspense>
      </main>

      <SiteFooter />
    </div>
  )
}
