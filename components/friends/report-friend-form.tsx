"use client"

import { useState } from 'react'
import { reportFriend } from '@/app/dashboard/friends/actions'

export function ReportFriendForm({ friendId }: { friendId: string }) {
  const [open, setOpen] = useState(false)
  const [message, setMessage] = useState('')
  async function submit(formData: FormData) { const result = await reportFriend(friendId, String(formData.get('reason') ?? ''), String(formData.get('details') ?? '')); setMessage(result.error ?? result.success ?? '') }
  if (!open) return <button type="button" onClick={() => setOpen(true)} className="text-sm text-muted-foreground underline hover:text-foreground">Report this listing</button>
  return <form action={submit} className="flex max-w-md flex-col gap-3 border border-border bg-card p-4"><p className="label-mono text-xs text-primary">REPORT LISTING</p><label className="flex flex-col gap-2 text-sm"><span className="text-muted-foreground">Reason</span><select name="reason" required className="border border-input bg-background px-3 py-2 text-foreground"><option value="broken_link">Broken link</option><option value="impersonation">Impersonation</option><option value="spam">Spam</option><option value="inappropriate">Inappropriate content</option><option value="other">Other</option></select></label><textarea name="details" maxLength={500} rows={3} className="border border-input bg-background px-3 py-2 text-sm text-foreground" placeholder="Add context (optional)" /><div className="flex gap-2"><button className="bg-primary px-3 py-2 text-sm text-primary-foreground">Send report</button><button type="button" onClick={() => setOpen(false)} className="px-3 py-2 text-sm text-muted-foreground">Cancel</button></div>{message && <p role="status" className="text-sm text-muted-foreground">{message}</p>}</form>
}
