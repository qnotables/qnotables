"use client"

import { useMemo, useRef, useState } from "react"
import Image from "next/image"
import { AlertTriangle, Check, ImagePlus, Lock, RotateCcw, Shield, Trash2, Upload, X } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { getProfileForEdit, profileThemes, profileTopics, type MockProfile } from "@/lib/mock-profile"

export function EditProfileForm() {
  const [profile, setProfile] = useState<MockProfile>(() => getProfileForEdit())
  const [saved, setSaved] = useState(false)
  const [dirty, setDirty] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const avatarInput = useRef<HTMLInputElement>(null)
  const bannerInput = useRef<HTMLInputElement>(null)

  const update = <K extends keyof MockProfile>(key: K, value: MockProfile[K]) => {
    setProfile((current) => ({ ...current, [key]: value }))
    setDirty(true)
    setSaved(false)
  }

  const validate = () => {
    const next: Record<string, string> = {}
    if (!profile.displayName.trim()) next.displayName = "Add a display name so people know who they are meeting."
    if (!/^[a-z0-9_]{3,20}$/.test(profile.username)) next.username = "Use 3–20 lowercase letters, numbers, or underscores."
    if (profile.website && !/^[a-z0-9.-]+\.[a-z]{2,}$/i.test(profile.website)) next.website = "Enter a domain like qnotables.ai."
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const save = () => {
    if (!validate()) return
    setDirty(false)
    setSaved(true)
  }

  const cancel = () => {
    if (dirty && !window.confirm("Discard your unsaved profile changes?")) return
    setProfile(getProfileForEdit())
    setErrors({})
    setDirty(false)
    setSaved(false)
  }

  const handleImage = (key: "avatarUrl" | "bannerUrl", file?: File) => {
    if (!file) return
    if (!file.type.startsWith("image/")) {
      setErrors((current) => ({ ...current, [key]: "Please choose an image file." }))
      return
    }
    const url = URL.createObjectURL(file)
    update(key, url)
    setErrors((current) => ({ ...current, [key]: "" }))
  }

  const toggleTopic = (topic: string) => update("topics", profile.topics.includes(topic) ? profile.topics.filter((item) => item !== topic) : [...profile.topics, topic])
  const togglePrivacy = (key: "showActivity" | "showLocation" | "showFollowers") => update("privacy", { ...profile.privacy, [key]: !profile.privacy[key] })
  const canSave = useMemo(() => dirty && !saved, [dirty, saved])

  return <div className="min-h-screen bg-background"><main className="mx-auto max-w-6xl px-4 py-8 md:px-6 md:py-12">
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4"><div><p className="label-mono text-xs text-primary">PROFILE SETTINGS</p><h1 className="mt-2 font-serif text-4xl font-semibold tracking-tight">Shape your corner of the Town Hall.</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">Choose what to share, how you want to be found, and what kind of presence feels useful.</p></div><div className="flex gap-2"><Button variant="outline" onClick={cancel}><RotateCcw data-icon="inline-start" /> Cancel</Button><Button onClick={save} disabled={!canSave}>{saved ? <Check data-icon="inline-start" /> : <Upload data-icon="inline-start" />} {saved ? "Saved" : "Save changes"}</Button></div></div>
    {saved && <div role="status" className="mb-6 flex items-center gap-3 border border-primary/30 bg-primary/10 px-4 py-3 text-sm text-foreground"><Check className="size-4 text-primary" /> Your profile preview is saved locally for this session.</div>}
    {Object.keys(errors).length > 0 && <div role="alert" className="mb-6 flex items-start gap-3 border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm"><AlertTriangle className="mt-0.5 size-4 text-destructive" /><div><p className="font-medium">A few details need another look.</p><p className="mt-1 text-muted-foreground">Fix the highlighted fields before saving.</p></div></div>}

    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_330px]">
      <div className="flex flex-col gap-6">
        <Card><CardHeader><CardTitle>Profile identity</CardTitle><CardDescription>These details appear beside your posts and replies.</CardDescription></CardHeader><CardContent className="flex flex-col gap-6">
          <div className="relative h-36 overflow-hidden bg-muted sm:h-48"><Image src={profile.bannerUrl} alt="Banner preview" fill className="object-cover" sizes="(max-width: 1024px) 100vw, 800px" unoptimized /><div className="absolute inset-0 flex items-center justify-center bg-foreground/20"><Button variant="secondary" onClick={() => bannerInput.current?.click()}><ImagePlus data-icon="inline-start" /> Change banner</Button></div><input ref={bannerInput} type="file" accept="image/png,image/jpeg,image/webp" className="sr-only" onChange={(event) => handleImage("bannerUrl", event.target.files?.[0])} /></div>
          {errors.bannerUrl && <p className="text-xs text-destructive">{errors.bannerUrl}</p>}
          <div className="flex flex-wrap items-center gap-4"><div className="relative size-20 overflow-hidden rounded-full border-4 border-card bg-muted shadow-sm"><Image src={profile.avatarUrl} alt="Avatar preview" fill className="object-cover" sizes="80px" unoptimized /><button type="button" onClick={() => avatarInput.current?.click()} className="absolute inset-0 flex items-center justify-center bg-foreground/60 text-background opacity-0 transition-opacity hover:opacity-100" aria-label="Change avatar"><ImagePlus className="size-5" /></button><input ref={avatarInput} type="file" accept="image/png,image/jpeg,image/webp" className="sr-only" onChange={(event) => handleImage("avatarUrl", event.target.files?.[0])} /></div><div><p className="text-sm font-medium">Profile photo</p><p className="mt-1 text-xs text-muted-foreground">JPG, PNG, or WebP. Crop preview available when uploads are connected.</p><Button variant="ghost" size="sm" className="mt-2" onClick={() => update("avatarUrl", "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=256&h=256&fit=crop&auto=format")}><Trash2 data-icon="inline-start" /> Remove</Button></div></div>
          <div className="grid gap-5 sm:grid-cols-2"><Field label="Display name" error={errors.displayName}><Input value={profile.displayName} onChange={(event) => update("displayName", event.target.value)} aria-invalid={Boolean(errors.displayName)} /></Field><Field label="Username" error={errors.username}><div className="flex items-center rounded-md border border-input bg-background px-3"><span className="text-muted-foreground">@</span><Input className="border-0 px-2 shadow-none focus-visible:ring-0" value={profile.username} onChange={(event) => update("username", event.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))} aria-invalid={Boolean(errors.username)} /></div></Field><Field label="Bio" className="sm:col-span-2"><textarea value={profile.bio} onChange={(event) => update("bio", event.target.value)} maxLength={160} className="min-h-24 w-full resize-y rounded-md border border-input bg-background px-3 py-2 text-sm leading-6 outline-none focus-visible:ring-2 focus-visible:ring-ring" /><p className="text-xs text-muted-foreground">{profile.bio.length}/160</p></Field><Field label="Pronouns"><Input value={profile.pronouns} onChange={(event) => update("pronouns", event.target.value)} /></Field><Field label="Location"><Input value={profile.location} onChange={(event) => update("location", event.target.value)} /></Field><Field label="Website" error={errors.website}><Input value={profile.website} onChange={(event) => update("website", event.target.value)} placeholder="qnotables.ai" aria-invalid={Boolean(errors.website)} /></Field><Field label="Social links"><Input value={profile.socialLinks.join(", ")} onChange={(event) => update("socialLinks", event.target.value.split(",").map((item) => item.trim()).filter(Boolean))} placeholder="x.com/you, bsky.app/profile/you" /></Field></div>
        </CardContent></Card>

        <Card><CardHeader><CardTitle>Topics and presence</CardTitle><CardDescription>Help people find the conversations you care about.</CardDescription></CardHeader><CardContent className="flex flex-col gap-6"><div><Label>Topics of interest</Label><div className="mt-3 flex flex-wrap gap-2">{profileTopics.map((topic) => <button key={topic} type="button" onClick={() => toggleTopic(topic)} className={`rounded-full border px-3 py-1.5 text-sm transition-colors ${profile.topics.includes(topic) ? "border-primary bg-primary/10 text-foreground" : "border-border text-muted-foreground hover:border-primary/60"}`} aria-pressed={profile.topics.includes(topic)}>{profile.topics.includes(topic) && <Check className="mr-1 inline size-3.5" />}{topic}</button>)}</div></div><Separator /><div><Label>Profile theme</Label><div className="mt-3 grid gap-3 sm:grid-cols-3">{profileThemes.map((theme) => <button key={theme.name} type="button" onClick={() => update("theme", theme)} className={`rounded-lg border p-3 text-left transition-colors ${profile.theme.name === theme.name ? "border-primary bg-primary/10" : "border-border hover:border-primary/60"}`}><span className="mb-3 block h-8 rounded-md bg-muted" /><span className="text-sm font-medium">{theme.name}</span><span className="mt-1 block text-xs text-muted-foreground">{theme.accent} accent · {theme.background} surface</span></button>)}</div></div><Separator /><div><Label>Visibility</Label><div className="mt-3 flex flex-col gap-3">{([["showActivity", "Show activity on profile", "Posts and replies will appear in your activity tabs."], ["showLocation", "Show location", "Keep the location line visible on your public profile."], ["showFollowers", "Show follower count", "Follower counts are hidden by default."]] as const).map(([key, label, description]) => <label key={key} className="flex cursor-pointer items-start gap-3"><input type="checkbox" checked={profile.privacy[key]} onChange={() => togglePrivacy(key)} className="mt-1 size-4 accent-primary" /><span><span className="block text-sm font-medium">{label}</span><span className="mt-1 block text-xs leading-5 text-muted-foreground">{description}</span></span></label>)}</div></div></CardContent></Card>
      </div>
      <aside className="flex flex-col gap-6"><Card><CardHeader><CardTitle>Live preview</CardTitle><CardDescription>What visitors will see first.</CardDescription></CardHeader><CardContent><div className="overflow-hidden rounded-lg border border-border"><div className="relative h-20 bg-muted"><Image src={profile.bannerUrl} alt="Preview banner" fill className="object-cover" sizes="300px" unoptimized /></div><div className="px-4 pb-4"><div className="relative -mt-7 size-14 overflow-hidden rounded-full border-2 border-card bg-muted"><Image src={profile.avatarUrl} alt="Preview avatar" fill className="object-cover" sizes="56px" unoptimized /></div><p className="mt-3 font-medium">{profile.displayName || "Your name"}</p><p className="text-xs text-muted-foreground">@{profile.username || "username"}</p><p className="mt-3 text-sm leading-5 text-muted-foreground">{profile.bio || "Your short bio will appear here."}</p></div></div></CardContent></Card><Card><CardHeader><CardTitle>Profile controls</CardTitle><CardDescription>Choose the community signals you want to feature.</CardDescription></CardHeader><CardContent className="flex flex-col gap-3"><Label htmlFor="pinned-post">Pinned post</Label><select id="pinned-post" className="h-9 rounded-md border border-input bg-background px-3 text-sm" defaultValue="budget"><option value="budget">How to read a city budget</option><option value="records">A field guide to public records</option><option value="none">No pinned post</option></select><Label htmlFor="badge" className="mt-3">Profile badge</Label><select id="badge" className="h-9 rounded-md border border-input bg-background px-3 text-sm" defaultValue="reporter"><option value="reporter">Field reporter</option><option value="neighbor">Helpful neighbor</option><option value="early">Early member</option></select></CardContent></Card><Card><CardHeader><CardTitle className="flex items-center gap-2"><Shield className="size-4 text-primary" /> Safety and privacy</CardTitle><CardDescription>These controls only affect your local preview for now.</CardDescription></CardHeader><CardContent className="flex flex-col gap-3"><Button variant="outline" className="justify-between">Muted users <span className="text-muted-foreground">0</span></Button><Button variant="outline" className="justify-between">Blocked users <span className="text-muted-foreground">0</span></Button><Button variant="outline" className="justify-between">Content filter <span className="text-muted-foreground">Standard</span></Button><p className="mt-2 flex items-start gap-2 text-xs leading-5 text-muted-foreground"><Lock className="mt-0.5 size-3.5 shrink-0" />Safety settings will connect to your account when profile persistence is enabled.</p></CardContent></Card></aside>
    </div>
  </main></div>
}

function Field({ label, error, className = "", children }: { label: string; error?: string; className?: string; children: React.ReactNode }) {
  return <div className={`flex flex-col gap-2 ${className}`}><Label>{label}</Label>{children}{error && <p className="text-xs text-destructive">{error}</p>}</div>
}
