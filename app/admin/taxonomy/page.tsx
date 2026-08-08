import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { isAdminEmail } from "@/lib/admin"
import { TaxonomyClient } from "./taxonomy-client"
import { getTaxonomyStats, getLegacyCategoryList } from "@/app/actions/taxonomy-actions"

export const metadata = {
  title: "Archive Taxonomy Cleanup | Admin",
  description: "Preview and apply desk / content-type / tag taxonomy to archive posts.",
}

export default async function TaxonomyPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user || !isAdminEmail(user.email)) {
    redirect("/")
  }

  const [stats, legacyCategories] = await Promise.all([
    getTaxonomyStats(),
    getLegacyCategoryList(),
  ])

  return <TaxonomyClient initialStats={stats} legacyCategories={legacyCategories} />
}
