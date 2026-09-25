import { SiteHeader } from "@/components/site-header"
import { ProfilePage } from "@/components/profile/profile-page"
import { mockProfile, type ProfileTab } from "@/lib/mock-profile"
import { createClient } from "@/lib/supabase/server"
import { getProfileHub } from "@/lib/profile-data"

export const metadata = {
  title: "Profile — qnotables.ai",
  description: "A community profile on qnotables.ai.",
}

export default async function ProfileRoute({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const { tab } = await searchParams
  const activeTab: ProfileTab = tab === "threads" || tab === "replies" || tab === "media" || tab === "about" ? tab : "overview"
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const profile = user ? (await getProfileHub(user.id)) ?? mockProfile : mockProfile
  return <><SiteHeader /><ProfilePage profile={profile} activeTab={activeTab} isOwner={Boolean(user)} /></>
}
