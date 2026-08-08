import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { isAdminEmail } from "@/lib/admin"
import { ReclassifyClient } from "./reclassify-client"
import { getCategoryDistribution } from "@/app/actions/reclassify-actions"

export const metadata = {
  title: "Reclassify Stories | Admin",
}

export default async function ReclassifyPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user || !isAdminEmail(user.email)) {
    redirect("/")
  }

  const distribution = await getCategoryDistribution()

  return <ReclassifyClient initialDistribution={distribution} />
}
