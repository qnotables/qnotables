import { redirect } from "next/navigation"
import { createAdminClient } from "@/lib/supabase/admin"
import { validateDashboardAccess } from "@/lib/dashboard-auth"
import { PageHeader } from "@/components/dashboard/ui"
import { SettingsForm, type SiteSettings } from "@/components/dashboard/settings-form"
import { SearchAliasManager, type SearchAliasGroupView } from "@/components/dashboard/search-alias-manager"
import { getTownHallPulse } from "@/lib/pulse"

export const metadata = {
  title: "Settings — Admin Dashboard",
  description: "Configure site-wide settings.",
}

const DEFAULTS: SiteSettings = {
  embed_learn_more_url: null,
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
  pulse_enabled: false,
  pulse_editor_thread_id: null,
  pulse_excluded_thread_ids: [],
  pulse_active_max_age_days: 14,
  pulse_backchannel_max_age_days: 14,
  pulse_kicker: "COMMUNITY SIGNAL",
  pulse_title: "THE TOWN HALL",
  pulse_description: "Follow the signal. Examine the evidence. Add to the record.",
  pulse_enter_label: "ENTER THE TOWN HALL",
  pulse_start_label: "START A THREAD",
}

export default async function SettingsPage() {
  const hasAccess = await validateDashboardAccess()
  if (!hasAccess) redirect("/dashboard/login")

  const admin = createAdminClient()
  const [{ data }, { data: aliasGroups }, { data: aliasTerms }, pulse] = await Promise.all([
    admin.from("site_settings").select("*").eq("id", 1).maybeSingle(),
    admin.from("search_alias_groups").select("id, label, slug, enabled").order("label"),
    admin.from("search_alias_terms").select("group_id, term").order("term"),
    getTownHallPulse(true),
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
        embed_learn_more_url: data.embed_learn_more_url ?? null,
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
        pulse_enabled: data.pulse_enabled ?? false,
        pulse_editor_thread_id: data.pulse_editor_thread_id ?? null,
        pulse_excluded_thread_ids: Array.isArray(data.pulse_excluded_thread_ids) ? data.pulse_excluded_thread_ids : [],
        pulse_active_max_age_days: data.pulse_active_max_age_days ?? 14,
        pulse_backchannel_max_age_days: data.pulse_backchannel_max_age_days ?? 14,
        pulse_kicker: data.pulse_kicker ?? DEFAULTS.pulse_kicker,
        pulse_title: data.pulse_title ?? DEFAULTS.pulse_title,
        pulse_description: data.pulse_description ?? DEFAULTS.pulse_description,
        pulse_enter_label: data.pulse_enter_label ?? DEFAULTS.pulse_enter_label,
        pulse_start_label: data.pulse_start_label ?? DEFAULTS.pulse_start_label,
      }
    : DEFAULTS

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Settings"
        description="Configure site-wide preferences and feature toggles."
        breadcrumbs={[{ label: "Settings" }]}
      />
      <SettingsForm settings={settings} pulsePreview={pulse.cards} />
      <SearchAliasManager groups={aliasViews} />
    </div>
  )
}
