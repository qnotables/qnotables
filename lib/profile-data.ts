import { createClient } from "@/lib/supabase/server"
import { mockProfile, type MockProfile } from "@/lib/mock-profile"

type ProfileRow = {
  id: string
  display_name: string | null
  username: string | null
  avatar_url: string | null
  banner_url: string | null
  bio: string | null
  pronouns: string | null
  location: string | null
  website_url: string | null
  social_links: Record<string, string> | string[] | null
  privacy: Record<string, boolean> | null
  created_at: string
  karma: number | null
}

function socialLinks(value: ProfileRow["social_links"]): string[] {
  if (Array.isArray(value)) return value.filter(Boolean)
  return value ? Object.values(value).filter(Boolean) : []
}

export function toProfileView(row: ProfileRow, activity?: Partial<MockProfile>): MockProfile {
  const privacy = row.privacy ?? {}
  return {
    ...mockProfile,
    ...activity,
    displayName: row.display_name || "Community member",
    username: row.username || row.id.slice(0, 8),
    avatarUrl: row.avatar_url || mockProfile.avatarUrl,
    bannerUrl: row.banner_url || mockProfile.bannerUrl,
    bio: row.bio || "Sharing useful notes with the community.",
    pronouns: row.pronouns || "",
    location: row.location || "",
    joined: `Joined ${new Date(row.created_at).toLocaleDateString("en-US", { month: "long", year: "numeric" })}`,
    website: row.website_url || "",
    socialLinks: socialLinks(row.social_links),
    privacy: {
      ...mockProfile.privacy,
      ...privacy,
      showLocation: privacy.show_location ?? privacy.showLocation ?? true,
      showFollowers: privacy.show_followers ?? privacy.showFollowers ?? false,
      showActivity: privacy.show_activity ?? privacy.showActivity ?? true,
    },
  }
}

export async function getCurrentProfile() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data } = await supabase.from("profiles").select("id, display_name, username, avatar_url, banner_url, bio, pronouns, location, website_url, social_links, privacy, created_at, karma").eq("id", user.id).maybeSingle()
  return data ? toProfileView(data as ProfileRow) : null
}
