"use client"

import { useState, useTransition } from "react"
import { Loader2, Save, Check } from "lucide-react"
import { saveSettings } from "@/app/dashboard/actions"
import { PulseSettingsPanel } from "@/components/dashboard/pulse-settings-panel"
import type { PulseCard } from "@/lib/pulse"

export interface SiteSettings {
  site_name: string
  tagline: string | null
  default_image_url: string | null
  rss_title: string | null
  rss_description: string | null
  shop_preview_mode: boolean
  public_registration: boolean
  maintenance_mode: boolean
  forum_moderation_mode: boolean
  forum_max_links: number
  forum_max_embeds: number
  signal_analysis_enabled: boolean
  signal_preview_enabled: boolean
  signal_analysis_min_score: number
  signal_analysis_max_items: number
  pulse_enabled: boolean
  pulse_editor_thread_id: string | null
  pulse_excluded_thread_ids: string[]
  pulse_active_max_age_days: number
  pulse_backchannel_max_age_days: number
  pulse_kicker: string
  pulse_title: string
  pulse_description: string
  pulse_enter_label: string
  pulse_start_label: string
}

function Toggle({ name, label, description, defaultChecked }: { name: string; label: string; description: string; defaultChecked: boolean }) {
  return (
    <label className="flex items-start justify-between gap-4 border border-border bg-card p-4">
      <span className="flex flex-col gap-1">
        <span className="font-semibold text-foreground">{label}</span>
        <span className="label-mono text-sm text-muted-foreground">{description}</span>
      </span>
      <input type="checkbox" name={name} defaultChecked={defaultChecked} className="mt-1 h-5 w-5 shrink-0 accent-primary" />
    </label>
  )
}

export function SettingsForm({ settings, pulsePreview }: { settings: SiteSettings; pulsePreview: PulseCard[] }) {
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)
  const inputClass = "border border-border bg-background px-3 py-2 text-foreground outline-none focus:border-primary w-full"

  function onSubmit(formData: FormData) {
    setError(null)
    setSaved(false)
    startTransition(async () => {
      const res = await saveSettings(formData)
      if (res.success) {
        setSaved(true)
        setTimeout(() => setSaved(false), 2500)
      } else {
        setError(res.error ?? "Failed to save")
      }
    })
  }

  return (
    <form action={onSubmit} className="flex max-w-2xl flex-col gap-8">
      <section className="flex flex-col gap-4">
        <h2 className="stencil text-lg text-foreground">General</h2>
        <div className="flex flex-col gap-1">
          <label className="label-mono text-muted-foreground">Site Name</label>
          <input name="site_name" defaultValue={settings.site_name} className={inputClass} />
        </div>
        <div className="flex flex-col gap-1">
          <label className="label-mono text-muted-foreground">Tagline</label>
          <input name="tagline" defaultValue={settings.tagline ?? ""} className={inputClass} />
        </div>
        <div className="flex flex-col gap-1">
          <label className="label-mono text-muted-foreground">Default Share Image URL</label>
          <input name="default_image_url" defaultValue={settings.default_image_url ?? ""} placeholder="https://…" className={inputClass} />
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="stencil text-lg text-foreground">RSS Feed</h2>
        <div className="flex flex-col gap-1">
          <label className="label-mono text-muted-foreground">Feed Title</label>
          <input name="rss_title" defaultValue={settings.rss_title ?? ""} className={inputClass} />
        </div>
        <div className="flex flex-col gap-1">
          <label className="label-mono text-muted-foreground">Feed Description</label>
          <textarea name="rss_description" rows={2} defaultValue={settings.rss_description ?? ""} className={`${inputClass} resize-y`} />
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="stencil text-lg text-foreground">Toggles</h2>
        <Toggle name="public_registration" label="Public Registration" description="Allow new users to sign up." defaultChecked={settings.public_registration} />
        <Toggle name="shop_preview_mode" label="Shop Preview Mode" description="Display the shop in preview-only mode." defaultChecked={settings.shop_preview_mode} />
        <Toggle name="maintenance_mode" label="Maintenance Mode" description="Take the public site offline for maintenance." defaultChecked={settings.maintenance_mode} />
      </section>

      <section className="flex flex-col gap-4">
        <div>
          <h2 className="stencil text-lg text-foreground">Signal Analysis</h2>
          <p className="label-mono mt-1 text-xs text-muted-foreground">Score recent wire and notables items for manual review before public preview.</p>
        </div>
        <Toggle name="signal_analysis_enabled" label="Enable Analysis Runs" description="Allow the protected cron or dashboard action to build the review queue." defaultChecked={settings.signal_analysis_enabled} />
        <Toggle name="signal_preview_enabled" label="Enable Public Preview" description="Show approved analysis items in the public stream." defaultChecked={settings.signal_preview_enabled} />
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1">
            <label className="label-mono text-muted-foreground">Minimum score <span className="ml-1 normal-case text-muted-foreground/60">(0–100)</span></label>
            <input name="signal_analysis_min_score" type="number" min={0} max={100} defaultValue={settings.signal_analysis_min_score ?? 55} className={inputClass} />
          </div>
          <div className="flex flex-col gap-1">
            <label className="label-mono text-muted-foreground">Max items per run <span className="ml-1 normal-case text-muted-foreground/60">(1–100)</span></label>
            <input name="signal_analysis_max_items" type="number" min={1} max={100} defaultValue={settings.signal_analysis_max_items ?? 24} className={inputClass} />
          </div>
        </div>
      </section>

      <PulseSettingsPanel settings={settings} previewCards={pulsePreview} />

      <section className="flex flex-col gap-4">
        <h2 className="stencil text-lg text-foreground">Forum</h2>
        <Toggle
          name="forum_moderation_mode"
          label="Moderation Mode"
          description="Hold posts and replies from new users (fewer than 5 posts or account younger than 7 days) for manual review before they appear publicly."
          defaultChecked={settings.forum_moderation_mode}
        />
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1">
            <label className="label-mono text-muted-foreground">
              Max links per post
              <span className="ml-1 normal-case text-muted-foreground/60">(1–50)</span>
            </label>
            <input
              name="forum_max_links"
              type="number"
              min={1}
              max={50}
              defaultValue={settings.forum_max_links ?? 8}
              className={inputClass}
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="label-mono text-muted-foreground">
              Max embeds per post
              <span className="ml-1 normal-case text-muted-foreground/60">(1–20)</span>
            </label>
            <input
              name="forum_max_embeds"
              type="number"
              min={1}
              max={20}
              defaultValue={settings.forum_max_embeds ?? 4}
              className={inputClass}
            />
          </div>
        </div>
      </section>

      {error ? <p className="label-mono text-destructive">{error}</p> : null}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="label-mono inline-flex items-center gap-2 bg-primary px-5 py-2.5 font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : saved ? <Check className="h-4 w-4" /> : <Save className="h-4 w-4" />}
          {pending ? "Saving…" : saved ? "Saved" : "Save Settings"}
        </button>
      </div>
    </form>
  )
}
