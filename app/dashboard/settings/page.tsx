import { redirect } from "next/navigation"
import { createAdminClient } from "@/lib/supabase/admin"
import { validateDashboardAccess } from "@/lib/dashboard-auth"
import { PageHeader } from "@/components/dashboard/ui"
import { SettingsForm, type SiteSettings } from "@/components/dashboard/settings-form"
import { SearchAliasManager, type SearchAliasGroupView } from "@/components/dashboard/search-alias-manager"

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
  forum_moderation_mode: false,
  forum_max_links: 8,
  forum_max_embeds: 4,
  signal_analysis_enabled: false,
  signal_preview_enabled: false,
  signal_analysis_min_score: 55,
  signal_analysis_max_items: 24,
}

export default async function SettingsPage() {
  const hasAccess = await validateDashboardAccess()
  if (!hasAccess) redirect("/dashboard/login")

  const admin = createAdminClient()
  const [{ data }, { data: aliasGroups }, { data: aliasTerms }] = await Promise.all([
    admin.from("site_settings").select("*").eq("id", 1).maybeSingle(),
    admin.from("search_alias_groups").select("id, label, slug, enabled").order("label"),
    admin.from("search_alias_terms").select("group_id, term").order("term"),
  ])
  const aliasViews: SearchAliasGroupView[] = (aliasGroups ?? []).map((group) => ({
    id: group.id,
    label: group.label,
    slug: group.slug,
    enabled: group.enabled,
    terms: (aliasTerms ?? []).filter((term) => term.group_id === group.id).map((term) => term.term),
  }))

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
        forum_moderation_mode: data.forum_moderation_mode ?? false,
        forum_max_links: data.forum_max_links ?? 8,
        forum_max_embeds: data.forum_max_embeds ?? 4,
        signal_analysis_enabled: data.signal_analysis_enabled ?? false,
        signal_preview_enabled: data.signal_preview_enabled ?? false,
        signal_analysis_min_score: data.signal_analysis_min_score ?? 55,
        signal_analysis_max_items: data.signal_analysis_max_items ?? 24,
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
      <SearchAliasManager groups={aliasViews} />
    </div>
  )
}
