import { notFound } from "next/navigation"
import { SiteHeader } from "@/components/site-header"
import { ProfilePage } from "@/components/profile/profile-page"
import { createClient } from "@/lib/supabase/server"
import { getProfileHub } from "@/lib/profile-data"

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data } = await supabase.from("profiles").select("display_name").eq("id", id).maybeSingle()
  const name = data?.display_name ?? "Community member"
  return {
    title: `${name} — qnotables.ai`,
    description: `Public profile and community contributions from ${name}.`,
  }
}

export default async function PublicProfileRoute({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ tab?: string }> }) {
  const [{ id }, { tab }] = await Promise.all([params, searchParams])
  const profile = await getProfileHub(id)
  if (!profile) notFound()

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const activeTab = tab === "threads" || tab === "replies" || tab === "media" || tab === "about" ? tab : "overview"

  return (
    <>
      <SiteHeader />
      <ProfilePage profile={profile} activeTab={activeTab} isOwner={user?.id === id} />
    </>
  )
}
