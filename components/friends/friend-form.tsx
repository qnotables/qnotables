"use client"

import { useActionState, useState } from "react"
import Link from "next/link"
import { saveFriend, type FriendFormState } from "@/app/dashboard/friends/actions"
import type { Friend, FriendCategory } from "@/lib/friends"

const initialState: FriendFormState = {}

export function FriendForm({ categories, friend }: { categories: FriendCategory[]; friend?: Friend | null }) {
  const [state, action, pending] = useActionState(saveFriend, initialState)
  const [logoUrl, setLogoUrl] = useState(friend?.logo_url ?? '')
  const [uploading, setUploading] = useState(false)
  const social = friend?.social_links ?? {}

  async function uploadLogo(file: File) {
    setUploading(true)
    const body = new FormData(); body.set('file', file)
    const response = await fetch('/api/friends/upload', { method: 'POST', body })
    const result = await response.json()
    setUploading(false)
    if (response.ok) setLogoUrl(result.url)
    else window.alert(result.error ?? 'Upload failed.')
  }

  return (
    <form action={action} className="flex flex-col gap-6">
      {friend?.id && <input type="hidden" name="friend_id" value={friend.id} />}
      <div className="border border-border bg-card p-5">
        <div className="mb-5 flex items-end justify-between gap-4 border-b border-border pb-4">
          <div><p className="label-mono text-primary">FRIEND LISTING</p><h1 className="stencil mt-1 text-2xl">{friend ? 'Edit Friend' : 'Add a Friend'}</h1></div>
          <span className="label-mono text-xs text-muted-foreground">PUBLIC AFTER APPROVAL</span>
        </div>
        <div className="grid gap-5 md:grid-cols-2">
          <label className="flex flex-col gap-2 text-sm"><span className="label-mono text-xs text-muted-foreground">Name</span><input required name="name" defaultValue={friend?.name} maxLength={120} className="border border-input bg-background px-3 py-2 text-foreground outline-none focus:border-primary" placeholder="A trusted friend of QNotables" /></label>
          <label className="flex flex-col gap-2 text-sm"><span className="label-mono text-xs text-muted-foreground">Destination URL</span><input required name="url" defaultValue={friend?.url} className="border border-input bg-background px-3 py-2 text-foreground outline-none focus:border-primary" placeholder="https://example.com" type="url" /></label>
          <label className="flex flex-col gap-2 text-sm md:col-span-2"><span className="label-mono text-xs text-muted-foreground">Short description</span><textarea required name="short_description" defaultValue={friend?.short_description} maxLength={280} rows={3} className="resize-y border border-input bg-background px-3 py-2 text-foreground outline-none focus:border-primary" placeholder="What makes this friend worth visiting?" /></label>
          <label className="flex flex-col gap-2 text-sm"><span className="label-mono text-xs text-muted-foreground">Category</span><select name="category_id" defaultValue={friend?.category_id ?? ''} className="border border-input bg-background px-3 py-2 text-foreground outline-none focus:border-primary"><option value="">Choose a category</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></label>
          <label className="flex flex-col gap-2 text-sm"><span className="label-mono text-xs text-muted-foreground">Contact email (admin only)</span><input name="contact_email" defaultValue={friend?.contact_email ?? ''} type="email" className="border border-input bg-background px-3 py-2 text-foreground outline-none focus:border-primary" placeholder="hello@example.com" /></label>
        </div>
      </div>
      <div className="border border-border bg-card p-5">
        <p className="label-mono mb-4 text-primary">IMAGE / LOGO</p>
        <div className="grid gap-5 md:grid-cols-[1fr_1fr]">
          <label className="flex flex-col gap-2 text-sm"><span className="text-muted-foreground">Upload a landscape logo or image</span><input type="file" accept="image/png,image/jpeg,image/webp" disabled={uploading} onChange={(event) => { const file = event.target.files?.[0]; if (file) void uploadLogo(file) }} className="text-sm text-muted-foreground" /><span className="text-xs text-muted-foreground">PNG, JPEG, or WebP up to 2 MB.</span></label>
          <label className="flex flex-col gap-2 text-sm"><span className="label-mono text-xs text-muted-foreground">Image alt text</span><input name="logo_alt" defaultValue={friend?.logo_alt ?? ''} className="border border-input bg-background px-3 py-2 text-foreground outline-none focus:border-primary" placeholder="Describe the image" /><input type="hidden" name="logo_url" value={logoUrl} readOnly /></label>
        </div>
        {logoUrl && <p className="mt-3 truncate text-xs text-muted-foreground">Image ready: {logoUrl}</p>}
      </div>
      <div className="border border-border bg-card p-5">
        <p className="label-mono mb-4 text-primary">OPTIONAL SOCIAL LINKS</p>
        <div className="grid gap-4 md:grid-cols-2"><input name="social_instagram" defaultValue={social.instagram} className="border border-input bg-background px-3 py-2 text-sm text-foreground" placeholder="Instagram URL" /><input name="social_youtube" defaultValue={social.youtube} className="border border-input bg-background px-3 py-2 text-sm text-foreground" placeholder="YouTube URL" /><input name="social_x" defaultValue={social.x} className="border border-input bg-background px-3 py-2 text-sm text-foreground" placeholder="X URL" /><input name="social_discord" defaultValue={social.discord} className="border border-input bg-background px-3 py-2 text-sm text-foreground" placeholder="Discord invite URL" /></div>
        <label className="mt-5 flex items-start gap-3 text-sm text-muted-foreground"><input type="checkbox" name="permission_confirmed" defaultChecked={friend?.permission_confirmed} className="mt-1 accent-primary" /><span>I confirm I have permission to submit this link and image.</span></label>
      </div>
      {(state.error || state.success) && <div role="status" className={`border px-4 py-3 text-sm ${state.error ? 'border-destructive text-destructive' : 'border-primary text-primary'}`}>{state.error ?? state.success}</div>}
      <div className="flex flex-wrap items-center gap-3"><button type="submit" name="intent" value="draft" disabled={pending || uploading} className="border border-border px-4 py-2 text-sm text-foreground hover:border-primary disabled:opacity-50">{pending ? 'Saving…' : 'Save draft'}</button><button type="submit" name="intent" value="submit" disabled={pending || uploading} className="bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50">Submit for review</button><Link href="/dashboard/friends" className="px-2 py-2 text-sm text-muted-foreground hover:text-foreground">Cancel</Link></div>
    </form>
  )
}
