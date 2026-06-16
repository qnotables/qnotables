import { createClient } from "@/lib/supabase/server"

export interface TeamMember {
  id: string
  username: string
  display_name: string
  avatar_url: string | null
  title: string | null
  team_sort_order: number
  website_url: string | null
  twitter_url: string | null
  truth_social_url: string | null
  public_email: string | null
  show_email_publicly: boolean
}

export async function getTeamMembers(groupFilter?: string): Promise<TeamMember[]> {
  const supabase = await createClient()

  let query = supabase
    .from("profiles")
    .select(
      "id, username, display_name, avatar_url, title, team_sort_order, website_url, twitter_url, truth_social_url, public_email, show_email_publicly"
    )
    .eq("show_on_team_page", true)
    .order("team_sort_order", { ascending: true })
    .order("display_name", { ascending: true })

  const { data, error } = await query

  if (error) {
    console.error("Error fetching team members:", error)
    return []
  }

  return (data || []) as TeamMember[]
}

export async function getTeamGroups(): Promise<string[]> {
  return []
}
