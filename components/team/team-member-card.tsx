import Image from "next/image"
import Link from "next/link"
import { Shield, ShieldCheck, User } from "lucide-react"
import type { TeamMember, TeamRole } from "@/lib/team"
import { getRoleLabel } from "@/lib/team"

const ROLE_ICON: Record<TeamRole, React.ReactNode> = {
  owner: <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />,
  admin: <Shield className="h-3.5 w-3.5" aria-hidden="true" />,
  moderator: <User className="h-3.5 w-3.5" aria-hidden="true" />,
}

const ROLE_COLORS: Record<TeamRole, string> = {
  owner: "border-primary text-primary bg-primary/10",
  admin: "border-secondary text-secondary-foreground bg-secondary/20",
  moderator: "border-border text-muted-foreground bg-muted/40",
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("")
}

export function TeamMemberCard({ member }: { member: TeamMember }) {
  const roleLabel = getRoleLabel(member.role)
  const roleColor = ROLE_COLORS[member.role] ?? ROLE_COLORS.moderator
  const roleIcon = ROLE_ICON[member.role] ?? ROLE_ICON.moderator
  const name = member.display_name || "Anonymous"
  const joinYear = new Date(member.created_at).getFullYear()

  return (
    <Link
      href={`/u/${member.id}`}
      className="group flex flex-col border border-border bg-card transition-colors hover:border-primary"
    >
      {/* Avatar + name */}
      <div className="flex items-center gap-4 border-b border-border p-5">
        <div className="relative h-16 w-16 shrink-0 overflow-hidden border border-border bg-muted">
          {member.avatar_url ? (
            <Image
              src={member.avatar_url}
              alt={name}
              fill
              className="object-cover"
              sizes="64px"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-muted">
              <span className="stencil text-xl text-muted-foreground">{initials(name)}</span>
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <p className="stencil truncate text-lg text-foreground transition-colors group-hover:text-primary">
            {name}
          </p>
          <span
            className={`label-mono mt-1 inline-flex items-center gap-1 border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-widest ${roleColor}`}
          >
            {roleIcon}
            {roleLabel}
          </span>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 divide-x divide-border border-b border-border text-center">
        <div className="px-3 py-3">
          <p className="stencil text-lg text-foreground">{member.karma}</p>
          <p className="label-mono text-[10px] text-muted-foreground">KARMA</p>
        </div>
        <div className="px-3 py-3">
          <p className="stencil text-lg text-foreground">{member.post_count}</p>
          <p className="label-mono text-[10px] text-muted-foreground">POSTS</p>
        </div>
        <div className="px-3 py-3">
          <p className="stencil text-lg text-foreground">{joinYear}</p>
          <p className="label-mono text-[10px] text-muted-foreground">JOINED</p>
        </div>
      </div>

      {/* CTA */}
      <div className="px-5 py-3">
        <span className="label-mono text-[10px] text-muted-foreground transition-colors group-hover:text-primary">
          VIEW PROFILE →
        </span>
      </div>
    </Link>
  )
}
