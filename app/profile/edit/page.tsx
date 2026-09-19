import { SiteHeader } from "@/components/site-header"
import { EditProfileForm } from "@/components/profile/edit-profile-form"
import { getCurrentProfile } from "@/lib/profile-data"
import { redirect } from "next/navigation"

export const metadata = {
  title: "Edit profile — qnotables.ai",
  description: "Customize your qnotables.ai community profile.",
}

export default async function EditProfileRoute() {
  const profile = await getCurrentProfile()
  if (!profile) redirect("/login?next=/profile/edit")
  return <><SiteHeader /><EditProfileForm initialProfile={profile} /></>
}
