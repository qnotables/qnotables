"use client"

import useSWR from "swr"
import { useState } from "react"
import { Check, Inbox, MailOpen, RefreshCw, Send } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"

type ReceivedEmail = {
  id: string
  from_address: string
  to_addresses: string[]
  subject: string | null
  text_body: string | null
  is_read: boolean
  received_at: string
}
type SentEmail = { id: string; action: string; target_id: string | null; details: string | null; created_at: string }
const fetcher = (url: string) => fetch(url).then(async (response) => {
  if (!response.ok) throw new Error("Unable to load email data")
  return response.json()
})

function formatDate(value: string) {
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(new Date(value))
}

export function EmailInbox() {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const inbox = useSWR<{ emails: ReceivedEmail[] }>("/api/admin/email/inbox", fetcher, { refreshInterval: 30_000 })
  const sent = useSWR<{ emails: SentEmail[] }>("/api/admin/email/sent", fetcher, { refreshInterval: 30_000 })
  const selected = inbox.data?.emails.find((email) => email.id === selectedId) ?? null
  const markRead = async (id: string) => {
    await fetch("/api/admin/email/inbox", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ id }) })
    await inbox.mutate()
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(20rem,0.85fr)]">
      <Card className="border-border bg-card">
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="stencil flex items-center gap-2"><Inbox className="h-4 w-4 text-primary" /> Inbox</CardTitle>
          <Button variant="ghost" size="icon" aria-label="Refresh inbox" onClick={() => inbox.mutate()}><RefreshCw className="h-4 w-4" /></Button>
        </CardHeader>
        <CardContent className="space-y-2">
          {inbox.error && <p className="label-mono text-destructive">Unable to load inbox.</p>}
          {!inbox.data && !inbox.error && <p className="label-mono text-muted-foreground">Loading inbox...</p>}
          {inbox.data?.emails.length === 0 && <p className="label-mono text-muted-foreground">No incoming emails yet.</p>}
          {inbox.data?.emails.map((email) => (
            <button key={email.id} type="button" onClick={() => { setSelectedId(email.id); if (!email.is_read) void markRead(email.id) }} className={cn("w-full border p-3 text-left transition-colors hover:border-primary", !email.is_read && "border-primary/60 bg-primary/5")}>
              <div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="truncate font-medium">{email.subject || "(No subject)"}</p><p className="label-mono truncate text-muted-foreground">{email.from_address}</p></div><time className="label-mono shrink-0 text-muted-foreground">{formatDate(email.received_at)}</time></div>
              <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{email.text_body || "No plain-text preview available."}</p>
            </button>
          ))}
        </CardContent>
      </Card>

      <div className="space-y-6">
        <Card className="border-border bg-card">
          <CardHeader><CardTitle className="stencil flex items-center gap-2"><MailOpen className="h-4 w-4 text-primary" /> Message</CardTitle></CardHeader>
          <CardContent>{selected ? <div className="space-y-3"><div><p className="label-mono text-muted-foreground">From</p><p>{selected.from_address}</p></div><div><p className="label-mono text-muted-foreground">Subject</p><p>{selected.subject || "(No subject)"}</p></div><div className="whitespace-pre-wrap border-t border-border pt-3 text-sm leading-6">{selected.text_body || "No plain-text body available."}</div></div> : <p className="label-mono text-muted-foreground">Select an email to read it.</p>}</CardContent>
        </Card>
        <Card className="border-border bg-card">
          <CardHeader><CardTitle className="stencil flex items-center gap-2"><Send className="h-4 w-4 text-primary" /> Sent history</CardTitle></CardHeader>
          <CardContent className="space-y-2">{sent.data?.emails.map((email) => <div key={email.id} className="border-b border-border pb-2 text-sm last:border-0"><div className="flex items-center justify-between gap-2"><span className={cn("label-mono", email.action.endsWith("failed") && "text-destructive")}>{email.action === "email.send" ? "Sent" : "Failed"}</span><time className="label-mono text-muted-foreground">{formatDate(email.created_at)}</time></div><p className="truncate">{email.target_id}</p><p className="truncate text-muted-foreground">{email.details}</p></div>)}{sent.data?.emails.length === 0 && <p className="label-mono text-muted-foreground">No sent email history yet.</p>}</CardContent>
        </Card>
      </div>
    </div>
  )
}
