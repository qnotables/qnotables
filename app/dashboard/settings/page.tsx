import { redirect } from "next/navigation"
import { createAdminClient } from "@/lib/supabase/admin"
import { validateDashboardAccess } from "@/lib/dashboard-auth"
import { PageHeader } from "@/components/dashboard/ui"
import { SettingsForm, type SiteSettings } from "@/components/dashboard/settings-form"

export const metadata = {
  title: "Settings — Admin Dashboard",
  description: "Configure site-wide settings.",
}

const DEFAULTS: SiteSettings = {
  site_name: "HOT AND FRESH",
  tagline: "Global News, Hot and Fresh",
  default_image_url: null,
  rss_title: "HOT AND FRESH",
  rss_description: "Latest dispatches from HOT AND FRESH",
  shop_preview_mode: true,
  public_registration: true,
  maintenance_mode: false,
}

export default async function SettingsPage() {
  const hasAccess = await validateDashboardAccess()
  if (!hasAccess) redirect("/dashboard/login")

  const admin = createAdminClient()
  const { data } = await admin.from("site_settings").select("*").eq("id", 1).maybeSingle()

  const settings: SiteSettings = data
    ? {
        site_name: data.site_name ?? DEFAULTS.site_name,
        tagline: data.tagline,
        default_image_url: data.default_image_url,
        rss_title: data.rss_title,
        rss_description: data.rss_description,
        shop_preview_mode: data.shop_preview_mode ?? true,
        public_registration: data.public_registration ?? true,
        maintenance_mode: data.maintenance_mode ?? false,
      }
    : DEFAULTS

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Settings"
        description="Configure site-wide preferences and feature toggles."
        breadcrumbs={[{ label: "Settings" }]}
      />
      <SettingsForm settings={settings} />
    </div>
  )
}
