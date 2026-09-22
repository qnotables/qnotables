"use client"

import { useState, type FormEvent } from "react"
import { CheckCircle2, AlertTriangle, Loader2, Mail } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

const SUBJECT_MAX = 200
const MESSAGE_MAX = 10000

type SendResult = {
  messageId: string
  recipient: string
  subject: string
  sentAt: string
}

export function EmailSenderForm() {
  const [to, setTo] = useState("")
  const [subject, setSubject] = useState("")
  const [message, setMessage] = useState("")
  const [fromName, setFromName] = useState("")
  const [replyTo, setReplyTo] = useState("")

  const [confirming, setConfirming] = useState(false)
  const [sending, setSending] = useState(false)
  const [result, setResult] = useState<SendResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  function handleReview(event: FormEvent) {
    event.preventDefault()
    setError(null)
    setResult(null)

    if (!to.trim()) return setError("Enter a recipient email address.")
    if (!subject.trim()) return setError("Subject is required.")
    if (!message.trim()) return setError("Message is required.")

    setConfirming(true)
  }

  async function handleSend() {
    setSending(true)
    setError(null)
    try {
      const res = await fetch("/api/admin/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: to.trim(),
          subject: subject.trim(),
          message,
          fromName: fromName.trim() || undefined,
          replyTo: replyTo.trim() || undefined,
        }),
      })
      const data = (await res.json()) as SendResult & { error?: string }
      if (!res.ok) {
        setError(data.error ?? "Unable to send email. Please try again.")
        return
      }
      setResult({
        messageId: data.messageId,
        recipient: data.recipient,
        subject: data.subject,
        sentAt: data.sentAt,
      })
      setConfirming(false)
      setTo("")
      setSubject("")
      setMessage("")
      setFromName("")
      setReplyTo("")
    } catch {
      setError("Unable to send email. Please try again.")
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="border border-border bg-card p-6">
      <div className="mb-6 flex items-center gap-3">
        <Mail className="h-5 w-5 text-primary" />
        <h2 className="stencil text-lg text-foreground">One-Off Email</h2>
      </div>

      {result && (
        <div className="mb-6 flex items-start gap-3 border border-primary/40 bg-primary/5 p-4">
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
          <div className="space-y-1">
            <p className="label-mono text-foreground">Email sent successfully.</p>
            <p className="text-sm text-muted-foreground">
              <span className="text-foreground">To:</span> {result.recipient}
            </p>
            <p className="text-sm text-muted-foreground">
              <span className="text-foreground">Subject:</span> {result.subject}
            </p>
            <p className="text-sm text-muted-foreground">
              <span className="text-foreground">Sent:</span> {new Date(result.sentAt).toLocaleString()}
            </p>
            <p className="text-xs text-muted-foreground/70">Message ID: {result.messageId}</p>
          </div>
        </div>
      )}

      {error && (
        <div className="mb-6 flex items-start gap-3 border border-destructive/40 bg-destructive/5 p-4">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" />
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      <form onSubmit={handleReview} className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="email-to" className="label-mono text-muted-foreground">
            To
          </Label>
          <Input
            id="email-to"
            type="email"
            inputMode="email"
            autoComplete="off"
            placeholder="recipient@example.com"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            disabled={sending}
            required
          />
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="email-from-name" className="label-mono text-muted-foreground">
              From Name <span className="text-muted-foreground/60">(optional)</span>
            </Label>
            <Input
              id="email-from-name"
              type="text"
              maxLength={100}
              placeholder="QNotables"
              value={fromName}
              onChange={(e) => setFromName(e.target.value)}
              disabled={sending}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email-reply-to" className="label-mono text-muted-foreground">
              Reply-To <span className="text-muted-foreground/60">(optional)</span>
            </Label>
            <Input
              id="email-reply-to"
              type="email"
              inputMode="email"
              autoComplete="off"
              placeholder="reply@qnotables.ai"
              value={replyTo}
              onChange={(e) => setReplyTo(e.target.value)}
              disabled={sending}
            />
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="email-subject" className="label-mono text-muted-foreground">
              Subject
            </Label>
            <span className="text-xs text-muted-foreground/60">
              {subject.length}/{SUBJECT_MAX}
            </span>
          </div>
          <Input
            id="email-subject"
            type="text"
            maxLength={SUBJECT_MAX}
            placeholder="Subject line"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            disabled={sending}
            required
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="email-message" className="label-mono text-muted-foreground">
              Message
            </Label>
            <span className="text-xs text-muted-foreground/60">
              {message.length}/{MESSAGE_MAX}
            </span>
          </div>
          <textarea
            id="email-message"
            maxLength={MESSAGE_MAX}
            rows={10}
            placeholder="Write your message. Line breaks and paragraphs are preserved."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            disabled={sending}
            required
            className="flex w-full resize-y rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
          />
        </div>

        <div className="flex items-center justify-end">
          <Button type="submit" disabled={sending}>
            Send Email
          </Button>
        </div>
      </form>

      {confirming && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="confirm-title"
        >
          <div className="w-full max-w-md border border-border bg-card p-6">
            <h3 id="confirm-title" className="stencil text-lg text-foreground">
              Send this email?
            </h3>
            <div className="mt-4 space-y-1 text-sm text-muted-foreground">
              <p>
                <span className="text-foreground">To:</span> {to}
              </p>
              <p className="break-words">
                <span className="text-foreground">Subject:</span> {subject}
              </p>
            </div>
            <div className="mt-6 flex items-center justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setConfirming(false)}
                disabled={sending}
              >
                Cancel
              </Button>
              <Button type="button" onClick={handleSend} disabled={sending}>
                {sending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Sending
                  </>
                ) : (
                  "Send"
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
