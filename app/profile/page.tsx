import { SiteHeader } from "@/components/site-header"
import { ProfilePage } from "@/components/profile/profile-page"
import { mockProfile, type ProfileTab } from "@/lib/mock-profile"

export const metadata = {
  title: "Profile — qnotables.ai",
  description: "A community profile on qnotables.ai.",
}

export default async function ProfileRoute({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const { tab } = await searchParams
  const activeTab: ProfileTab = tab === "replies" || tab === "saved" || tab === "about" ? tab : "posts"
  return <><SiteHeader /><ProfilePage profile={mockProfile} activeTab={activeTab} /></>
}
