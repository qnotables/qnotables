import { createClient } from "@/lib/supabase/server"

export type TeamRole = "owner" | "admin" | "moderator"

export interface TeamMember {
  id: string
  display_name: string
  role: TeamRole
  avatar_url: string | null
  karma: number
  post_count: number
  created_at: string
}

const ROLE_ORDER: Record<TeamRole, number> = {
  owner: 0,
  admin: 1,
  moderator: 2,
}

const ROLE_LABELS: Record<TeamRole, string> = {
  owner: "Owner",
  admin: "Admin",
  moderator: "Moderator",
}

export function getRoleLabel(role: TeamRole): string {
  return ROLE_LABELS[role] ?? role
}

export async function getTeamMembers(roleFilter?: string): Promise<TeamMember[]> {
  const supabase = await createClient()

  let query = supabase
    .from("profiles")
    .select("id, display_name, role, avatar_url, karma, post_count, created_at")
    .in("role", ["owner", "admin", "moderator"])
    .eq("status", "active")

  if (roleFilter && ["owner", "admin", "moderator"].includes(roleFilter)) {
    query = query.eq("role", roleFilter)
  }

  const { data, error } = await query

  if (error) {
    console.error("[team] fetch error:", error.message)
    return []
  }

  // Sort: owner → admin → moderator, then by display_name
  return ((data ?? []) as TeamMember[]).sort((a, b) => {
    const ro = (ROLE_ORDER[a.role] ?? 99) - (ROLE_ORDER[b.role] ?? 99)
    if (ro !== 0) return ro
    return (a.display_name ?? "").localeCompare(b.display_name ?? "")
  })
}

export async function getTeamGroups(): Promise<string[]> {
  return ["owner", "admin", "moderator"]
}
