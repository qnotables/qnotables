import { SiteHeader } from "@/components/site-header"
import { EditProfileForm } from "@/components/profile/edit-profile-form"

export const metadata = {
  title: "Edit profile — qnotables.ai",
  description: "Customize your qnotables.ai community profile.",
}

export default function EditProfileRoute() {
  return <><SiteHeader /><EditProfileForm /></>
}
