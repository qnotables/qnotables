"use client"

import { useMemo, useState, useTransition } from "react"
import { ArrowDown, ArrowUp, Eye, Loader2, Plus, Save, Send, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { SiteFooterClient } from "@/components/site-footer-client"
import type { FooterConfig, FooterLink, FooterSocialProfile } from "@/lib/footer-config"
import { publishFooter, saveFooter } from "@/app/dashboard/footer/actions"

type Tab = "settings" | "links" | "social" | "preview"

function newId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
}

function moveItem<T extends { sortOrder: number }>(items: T[], index: number, direction: -1 | 1) {
  const nextIndex = index + direction
  if (nextIndex < 0 || nextIndex >= items.length) return items
  const next = [...items]
  ;[next[index], next[nextIndex]] = [next[nextIndex], next[index]]
  return next.map((item, itemIndex) => ({ ...item, sortOrder: (itemIndex + 1) * 10 }))
}

function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return <label className="flex flex-col gap-2"><span className="label-mono text-muted-foreground">{label}</span>{children}{hint ? <span className="text-xs leading-5 text-muted-foreground">{hint}</span> : null}</label>
}

export function FooterManager({ initialConfig }: { initialConfig: FooterConfig }) {
  const [config, setConfig] = useState(initialConfig)
  const [tab, setTab] = useState<Tab>("settings")
  const [notice, setNotice] = useState<{ type: "success" | "error"; message: string } | null>(null)
  const [pending, startTransition] = useTransition()

  const footerLinks = useMemo(() => config.links.filter((link) => link.placement !== "legal"), [config.links])
  const legalLinks = useMemo(() => config.links.filter((link) => link.placement === "legal"), [config.links])

  function updateConfig(patch: Partial<FooterConfig>) {
    setConfig((current) => ({ ...current, ...patch }))
    setNotice(null)
  }

  function saveDraft() {
    setNotice(null)
    startTransition(async () => {
      const result = await saveFooter(config)
      setNotice(result.success ? { type: "success", message: "Draft saved. Publish when it is ready for the public site." } : { type: "error", message: result.error ?? "Draft could not be saved." })
    })
  }

  function publish() {
    setNotice(null)
    startTransition(async () => {
      const saved = await saveFooter(config)
      if (!saved.success) {
        setNotice({ type: "error", message: saved.error ?? "Draft could not be saved." })
        return
      }
      const result = await publishFooter()
      setNotice(result.success ? { type: "success", message: "Footer published and live." } : { type: "error", message: result.error ?? "Footer could not be published." })
    })
  }

  function updateLink(id: string, patch: Partial<FooterLink>) {
    updateConfig({ links: config.links.map((link) => link.id === id ? { ...link, ...patch } : link) })
  }

  function removeLink(id: string) {
    if (!window.confirm("Remove this footer link from the draft?")) return
    updateConfig({ links: config.links.filter((link) => link.id !== id) })
  }

  function addLink(placement: FooterLink["placement"] = "footer") {
    const newLink: FooterLink = { id: newId("link"), label: "New link", href: "/", description: "", category: placement === "legal" ? "Legal" : "Explore", placement, icon: "ArrowUpRight", enabled: true, openInNewTab: false, sortOrder: (config.links.length + 1) * 10 }
    updateConfig({ links: [...config.links, newLink] })
  }

  function updateSocial(id: string, patch: Partial<FooterSocialProfile>) {
    updateConfig({ socialProfiles: config.socialProfiles.map((profile) => profile.id === id ? { ...profile, ...patch } : profile) })
  }

  function removeSocial(id: string) {
    if (!window.confirm("Remove this social profile from the draft?")) return
    updateConfig({ socialProfiles: config.socialProfiles.filter((profile) => profile.id !== id) })
  }

  function addSocial() {
    updateConfig({ socialProfiles: [...config.socialProfiles, { id: newId("social"), platform: "New platform", label: "Follow on new platform", href: "https://", icon: "", enabled: true, sortOrder: (config.socialProfiles.length + 1) * 10 }] })
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 border-b border-border pb-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap gap-2" role="tablist" aria-label="Footer editor sections">
          {(["settings", "links", "social", "preview"] as Tab[]).map((item) => (
            <Button key={item} type="button" role="tab" aria-selected={tab === item} variant={tab === item ? "default" : "outline"} onClick={() => setTab(item)}>{item === "settings" ? "Footer Settings" : item === "links" ? "Link Manager" : item === "social" ? "Social Profiles" : "Preview"}</Button>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" disabled={pending} onClick={saveDraft}><Save data-icon="inline-start" />{pending ? "Saving..." : "Save Draft"}</Button>
          <Button type="button" disabled={pending} onClick={publish}><Send data-icon="inline-start" />Publish</Button>
        </div>
      </div>

      {notice ? <p className={notice.type === "success" ? "border border-primary/40 bg-primary/10 px-4 py-3 text-sm text-primary" : "border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive"} role="status">{notice.message}</p> : null}

      {tab === "settings" ? (
        <section className="grid gap-6 lg:grid-cols-2" role="tabpanel">
          <div className="flex flex-col gap-5 border border-border bg-card p-5">
            <div><p className="label-mono text-primary">Identity</p><h2 className="stencil mt-2 text-xl">Footer voice</h2></div>
            <Field label="Site name"><Input value={config.siteName} maxLength={80} onChange={(event) => updateConfig({ siteName: event.target.value })} /></Field>
            <Field label="Eyebrow"><Input value={config.eyebrow} maxLength={80} onChange={(event) => updateConfig({ eyebrow: event.target.value })} /></Field>
            <Field label="Mission statement"><textarea value={config.mission} maxLength={500} rows={4} onChange={(event) => updateConfig({ mission: event.target.value })} className="w-full resize-y border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary" /></Field>
            <Field label="Copyright line" hint="Use {year} if the current year should be inserted automatically."><Input value={config.copyrightText} maxLength={80} onChange={(event) => updateConfig({ copyrightText: event.target.value })} /></Field>
          </div>
          <div className="flex flex-col gap-5 border border-border bg-card p-5">
            <div><p className="label-mono text-primary">Briefing</p><h2 className="stencil mt-2 text-xl">Newsletter panel</h2></div>
            <Field label="Panel title"><Input value={config.newsletterTitle} maxLength={80} onChange={(event) => updateConfig({ newsletterTitle: event.target.value })} /></Field>
            <Field label="Panel description"><textarea value={config.newsletterDescription} maxLength={300} rows={4} onChange={(event) => updateConfig({ newsletterDescription: event.target.value })} className="w-full resize-y border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary" /></Field>
            <label className="flex items-center gap-3 border border-border p-3 text-sm"><input type="checkbox" checked={config.showStatus} onChange={(event) => updateConfig({ showStatus: event.target.checked })} className="size-4 accent-primary" /> Show operational status</label>
            <Field label="Status label"><Input value={config.statusLabel} maxLength={80} onChange={(event) => updateConfig({ statusLabel: event.target.value })} /></Field>
            <Field label="Back-to-top label"><Input value={config.backToTopLabel} maxLength={80} onChange={(event) => updateConfig({ backToTopLabel: event.target.value })} /></Field>
          </div>
        </section>
      ) : null}

      {tab === "links" ? (
        <section className="flex flex-col gap-5" role="tabpanel">
          <div className="flex flex-wrap items-center justify-between gap-3"><div><p className="label-mono text-primary">Navigation</p><h2 className="stencil mt-2 text-xl">Manage destinations</h2></div><div className="flex gap-2"><Button type="button" variant="outline" onClick={() => addLink("footer")}><Plus data-icon="inline-start" />Add link</Button><Button type="button" variant="outline" onClick={() => addLink("legal")}><Plus data-icon="inline-start" />Add legal</Button></div></div>
          <div className="flex flex-col gap-4">
            {[...footerLinks, ...legalLinks].sort((a, b) => a.sortOrder - b.sortOrder).map((link, index, list) => (
              <article key={link.id} className="flex flex-col gap-4 border border-border bg-card p-4">
                <div className="flex flex-wrap items-start justify-between gap-3"><div><p className="label-mono text-primary">{link.placement} / {link.category}</p><h3 className="stencil mt-1 text-lg">{link.label}</h3></div><div className="flex items-center gap-1"><Button type="button" variant="ghost" size="icon-sm" aria-label={`Move ${link.label} up`} disabled={index === 0} onClick={() => updateConfig({ links: moveItem(list, index, -1) })}><ArrowUp /></Button><Button type="button" variant="ghost" size="icon-sm" aria-label={`Move ${link.label} down`} disabled={index === list.length - 1} onClick={() => updateConfig({ links: moveItem(list, index, 1) })}><ArrowDown /></Button><Button type="button" variant="ghost" size="icon-sm" aria-label={`Remove ${link.label}`} onClick={() => removeLink(link.id)}><Trash2 /></Button></div></div>
                <div className="grid gap-4 md:grid-cols-2"><Field label="Label"><Input value={link.label} maxLength={80} onChange={(event) => updateLink(link.id, { label: event.target.value })} /></Field><Field label="URL" hint="Internal paths must start with /. External links must use https://."><Input value={link.href} maxLength={2048} onChange={(event) => updateLink(link.id, { href: event.target.value })} /></Field><Field label="Category"><Input value={link.category} maxLength={80} onChange={(event) => updateLink(link.id, { category: event.target.value })} /></Field><Field label="Icon" hint="Use any icon name from lucide.dev/icons, such as badge-check or BadgeCheck."><Input value={link.icon} placeholder="e.g. badge-check" onChange={(event) => updateLink(link.id, { icon: event.target.value })} /></Field></div>
                <Field label="Description"><Input value={link.description} maxLength={240} onChange={(event) => updateLink(link.id, { description: event.target.value })} /></Field>
                <div className="flex flex-wrap gap-4 text-sm"><label className="flex items-center gap-2"><input type="checkbox" checked={link.enabled} onChange={(event) => updateLink(link.id, { enabled: event.target.checked })} className="size-4 accent-primary" /> Enabled</label><label className="flex items-center gap-2"><input type="checkbox" checked={link.openInNewTab} onChange={(event) => updateLink(link.id, { openInNewTab: event.target.checked })} className="size-4 accent-primary" /> Open in new tab</label><label className="flex items-center gap-2"><span className="text-muted-foreground">Placement</span><select value={link.placement} onChange={(event) => updateLink(link.id, { placement: event.target.value as FooterLink["placement"] })} className="border border-border bg-background px-2 py-1 text-sm text-foreground"><option value="footer">Footer columns</option><option value="explore">Explore dialog</option><option value="legal">Legal row</option></select></label></div>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      {tab === "social" ? (
        <section className="flex flex-col gap-5" role="tabpanel">
          <div className="flex flex-wrap items-center justify-between gap-3"><div><p className="label-mono text-primary">Outbound</p><h2 className="stencil mt-2 text-xl">Social profiles</h2></div><Button type="button" variant="outline" onClick={addSocial}><Plus data-icon="inline-start" />Add profile</Button></div>
          <div className="grid gap-4 lg:grid-cols-2">
            {config.socialProfiles.map((profile) => <article key={profile.id} className="flex flex-col gap-4 border border-border bg-card p-4"><div className="flex items-center justify-between gap-3"><div><p className="label-mono text-primary">{profile.platform}</p><h3 className="stencil mt-1 text-lg">{profile.label}</h3></div><Button type="button" variant="ghost" size="icon-sm" aria-label={`Remove ${profile.platform}`} onClick={() => removeSocial(profile.id)}><Trash2 /></Button></div><Field label="Platform"><Input value={profile.platform} maxLength={80} onChange={(event) => updateSocial(profile.id, { platform: event.target.value })} /></Field><Field label="Label"><Input value={profile.label} maxLength={80} onChange={(event) => updateSocial(profile.id, { label: event.target.value })} /></Field><Field label="Profile URL" hint="Social profiles must use an http(s) URL."><Input value={profile.href} maxLength={2048} onChange={(event) => updateSocial(profile.id, { href: event.target.value })} /></Field><Field label="Icon" hint="Use any icon name from lucide.dev/icons, such as badge-check or BadgeCheck."><Input value={profile.icon} placeholder="e.g. badge-check" onChange={(event) => updateSocial(profile.id, { icon: event.target.value })} /></Field><label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={profile.enabled} onChange={(event) => updateSocial(profile.id, { enabled: event.target.checked })} className="size-4 accent-primary" /> Enabled</label></article>)}
          </div>
        </section>
      ) : null}

      {tab === "preview" ? (
        <section role="tabpanel" className="flex flex-col gap-4"><div className="flex items-center gap-2 text-sm text-muted-foreground"><Eye className="size-4" aria-hidden="true" /> Preview uses the current draft and does not publish changes.</div><div className="overflow-hidden border border-border"><SiteFooterClient config={config} preview /></div></section>
      ) : null}

      {pending ? <div className="fixed bottom-4 right-4 flex items-center gap-2 border border-border bg-card px-3 py-2 text-sm text-muted-foreground shadow-lg" role="status"><Loader2 className="size-4 animate-spin" aria-hidden="true" /> Saving footer changes</div> : null}
    </div>
  )
}
