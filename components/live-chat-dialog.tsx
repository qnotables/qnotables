"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import type { KeyboardEvent } from "react"
import Link from "next/link"
import { Flag, Hash, LogIn, Radio, Send, Trash2, X } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

type ChatMessage = {
  id: string
  userId: string
  body: string
  createdAt: string
  author: {
    id: string
    displayName: string
    username: string | null
    avatarUrl: string | null
  }
}

type ChatButtonProps = {
  onlineCount: number | null
}

function formatTime(value: string) {
  return new Date(value).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })
}

function MessageBody({ body }: { body: string }) {
  const parts = body.split(/(https?:\/\/[^\s<]+|www\.[^\s<]+)/gi)

  return (
    <p className="whitespace-pre-wrap break-words text-sm leading-6 text-foreground">
      {parts.map((part, index) => {
        const match = part.match(/^(https?:\/\/[^\s<]+|www\.[^\s<]+)$/i)
        if (!match) return <span key={`${part}-${index}`}>{part}</span>

        const trailing = match[1].match(/[),.!?:;]+$/)?.[0] ?? ""
        const label = trailing ? match[1].slice(0, -trailing.length) : match[1]
        const href = label.startsWith("www.") ? `https://${label}` : label

        return (
          <span key={`${part}-${index}`}>
            <a href={href} target="_blank" rel="noreferrer noopener" className="text-primary underline underline-offset-2 hover:text-primary/80">
              {label}
            </a>
            {trailing}
          </span>
        )
      })}
    </p>
  )
}

export function LiveChatButton({ onlineCount }: ChatButtonProps) {
  const [open, setOpen] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const [unread, setUnread] = useState(0)
  const unreadRef = useRef(0)
  const handleIncoming = useCallback((incomingUserId: string) => {
    if (!open || incomingUserId === userId) return
    unreadRef.current += 1
    setUnread(unreadRef.current)
  }, [open, userId])

  useEffect(() => {
    const supabase = createClient()
    let mounted = true
    void supabase.auth.getUser().then(({ data }) => {
      if (mounted) setUserId(data.user?.id ?? null)
    }).catch(() => {
      if (mounted) setUserId(null)
    })
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      if (mounted) setUserId(session?.user?.id ?? null)
    })
    return () => {
      mounted = false
      data.subscription.unsubscribe()
    }
  }, [])

  useEffect(() => {
    if (open) {
      unreadRef.current = 0
      setUnread(0)
    }
  }, [open])

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="relative flex min-h-9 items-center gap-2 border border-border px-2.5 text-muted-foreground transition-colors hover:border-primary hover:text-primary"
        aria-label={userId ? "Open QNotables live chat" : "Sign in to join QNotables live chat"}
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        <Hash className="h-4 w-4" aria-hidden="true" />
        <span className="label-mono text-foreground">Chat</span>
        {unread > 0 && !open ? <span className="label-mono bg-primary px-1.5 py-0.5 text-[10px] text-primary-foreground">{unread > 9 ? "9+" : unread}</span> : null}
      </button>
      <LiveChatDialog open={open} onOpenChange={setOpen} userId={userId} onlineCount={onlineCount} onIncoming={handleIncoming} />
    </>
  )
}

function LiveChatDialog({
  open,
  onOpenChange,
  userId,
  onlineCount,
  onIncoming,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  userId: string | null
  onlineCount: number | null
  onIncoming: (userId: string) => void
}) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [composer, setComposer] = useState("")
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const [status, setStatus] = useState("Realtime channel ready")
  const [error, setError] = useState<string | null>(null)
  const [isModerator, setIsModerator] = useState(false)
  const [hasMore, setHasMore] = useState(false)
  const [loadingEarlier, setLoadingEarlier] = useState(false)
  const [reportingId, setReportingId] = useState<string | null>(null)
  const [reportedIds, setReportedIds] = useState<Set<string>>(new Set())
  const scrollRef = useRef<HTMLDivElement>(null)
  const hasLoadedRef = useRef(false)
  const supabaseRef = useRef(createClient())

  const loadMessages = useCallback(async () => {
    if (!userId) return
    setLoading(true)
    setError(null)
    try {
      const response = await fetch("/api/chat/messages?limit=50", { cache: "no-store" })
      const payload = await response.json()
      if (!response.ok) {
        setError(payload.error || "Chat history is temporarily unavailable.")
      } else {
        setMessages(payload.messages || [])
        setHasMore(Boolean(payload.hasMore))
        hasLoadedRef.current = true
      }
    } catch {
      setError("Chat history is temporarily unavailable.")
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => {
    if (!open || !userId || hasLoadedRef.current) return
    void loadMessages()
  }, [loadMessages, open, userId])

  useEffect(() => {
    if (!userId) {
      setMessages([])
      setHasMore(false)
      hasLoadedRef.current = false
      return
    }
    let mounted = true
    void Promise.resolve(supabaseRef.current.from("profiles").select("role, status").eq("id", userId).maybeSingle().then(({ data }) => {
      if (mounted) setIsModerator(Boolean(data && data.status === "active" && ["moderator", "admin"].includes(data.role)))
    })).catch(() => {
      if (mounted) setIsModerator(false)
    })
    const channel = supabaseRef.current
      .channel("town-hall-live-chat")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "chat_messages", filter: "room_slug=eq.town-hall-live" }, async (payload) => {
        const next = payload.new as { id: string; user_id: string; body: string; created_at: string }
        const { data: author } = await supabaseRef.current.from("profiles").select("id, display_name, username, avatar_url").eq("id", next.user_id).maybeSingle()
        if (!mounted) return
        onIncoming(next.user_id)
        setMessages((current) => current.some((message) => message.id === next.id) ? current : [...current, {
          id: next.id,
          userId: next.user_id,
          body: next.body,
          createdAt: next.created_at,
          author: {
            id: next.user_id,
            displayName: author?.display_name || author?.username || "Community member",
            username: author?.username ?? null,
            avatarUrl: author?.avatar_url ?? null,
          },
        }])
        setStatus("Realtime channel ready")
      })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "chat_messages", filter: "room_slug=eq.town-hall-live" }, (payload) => {
        if ((payload.new as { deleted_at?: string | null }).deleted_at) {
          setMessages((current) => current.filter((message) => message.id !== (payload.new as { id: string }).id))
        }
      })
      .subscribe((subscriptionStatus) => {
        if (!mounted) return
        if (subscriptionStatus === "SUBSCRIBED") setStatus("Realtime channel ready")
        if (subscriptionStatus === "CHANNEL_ERROR" || subscriptionStatus === "TIMED_OUT") setStatus("Chat temporarily unavailable.")
      })

    return () => {
      mounted = false
      void Promise.resolve(supabaseRef.current.removeChannel(channel)).catch(() => undefined)
    }
  }, [onIncoming, userId])

  useEffect(() => {
    if (open && messages.length > 0) {
      requestAnimationFrame(() => {
        if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight
      })
    }
  }, [messages.length, open])

  async function loadEarlier() {
    const oldest = messages[0]
    if (!oldest || loadingEarlier || !hasMore) return
    setLoadingEarlier(true)
    try {
      const response = await fetch(`/api/chat/messages?limit=50&before=${encodeURIComponent(oldest.createdAt)}`, { cache: "no-store" })
      const payload = await response.json()
      if (response.ok) {
        setMessages((current) => [...(payload.messages || []), ...current.filter((message: ChatMessage) => !(payload.messages || []).some((older: ChatMessage) => older.id === message.id))])
        setHasMore(Boolean(payload.hasMore))
      } else {
        setError(payload.error || "Unable to load earlier messages.")
      }
    } catch {
      setError("Unable to load earlier messages.")
    } finally {
      setLoadingEarlier(false)
    }
  }

  async function sendMessage() {
    const body = composer.trim()
    if (!body || sending || !userId) return
    setSending(true)
    setError(null)
    try {
      const response = await fetch("/api/chat/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body }),
      })
      const payload = await response.json()
      if (!response.ok) {
        setError(payload.error || "Unable to send that message.")
      } else {
        setComposer("")
        if (payload.message) setMessages((current) => current.some((message) => message.id === payload.message.id) ? current : [...current, payload.message])
      }
    } catch {
      setError("Unable to send that message.")
    } finally {
      setSending(false)
    }
  }

  async function reportMessage(id: string) {
    const reason = window.prompt("Why are you reporting this message?", "Spam or harassment")?.trim()
    if (!reason || reportingId) return
    setReportingId(id)
    try {
      const response = await fetch("/api/chat/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messageId: id, reason }),
      })
      if (response.ok) setReportedIds((current) => new Set(current).add(id))
      else setError("Unable to submit that report.")
    } catch {
      setError("Unable to submit that report.")
    } finally {
      setReportingId(null)
    }
  }

  async function deleteMessage(id: string) {
    try {
      const response = await fetch(`/api/chat/messages/${id}`, { method: "DELETE" })
      if (!response.ok) {
        const payload = await response.json().catch(() => null)
        setError(payload?.error || "Unable to delete that message.")
      }
    } catch {
      setError("Unable to delete that message.")
    }
  }

  function handleComposerKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing && event.keyCode !== 229) {
      event.preventDefault()
      void sendMessage()
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={false} className="w-[calc(100%-1rem)] max-w-4xl gap-0 overflow-hidden border border-border bg-background p-0 shadow-2xl sm:w-[calc(100%-2rem)]">
        <DialogHeader className="flex-row items-start justify-between gap-4 border-b border-border px-4 py-3 sm:px-5">
          <div>
            <DialogTitle className="stencil flex items-center gap-2 text-lg text-foreground"><Radio className="h-4 w-4 text-primary" aria-hidden="true" /> QNotables Live Chat</DialogTitle>
            <DialogDescription className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs"><span>{onlineCount === null ? "—" : onlineCount} Anons Online</span><span>{status}</span></DialogDescription>
          </div>
          <button type="button" onClick={() => onOpenChange(false)} className="border border-border p-2 text-muted-foreground transition-colors hover:border-primary hover:text-primary" aria-label="Close live chat"><X className="h-4 w-4" aria-hidden="true" /></button>
        </DialogHeader>

        {!userId ? (
          <div className="flex min-h-72 flex-col items-center justify-center gap-4 px-6 py-12 text-center">
            <Hash className="h-8 w-8 text-primary" aria-hidden="true" />
            <div><p className="stencil text-lg">Members only</p><p className="mt-2 max-w-sm text-sm text-muted-foreground">Sign in to join the Town Hall Live conversation.</p></div>
            <Link href="/auth/login" onClick={() => onOpenChange(false)} className="label-mono inline-flex items-center gap-2 border border-primary bg-primary px-4 py-2 text-primary-foreground hover:opacity-90"><LogIn className="h-4 w-4" aria-hidden="true" /> Sign in to chat</Link>
          </div>
        ) : (
          <div className="flex min-h-0 flex-col">
            <div ref={scrollRef} className="h-[min(52vh,30rem)] overflow-y-auto px-4 py-4 sm:px-5" aria-live="polite" aria-label="Live chat messages">
              {loading ? <p className="py-10 text-center text-sm text-muted-foreground">Loading recent messages…</p> : null}
              {!loading && hasMore ? <button type="button" onClick={() => void loadEarlier()} disabled={loadingEarlier} className="label-mono mb-4 w-full border border-border px-3 py-2 text-xs text-muted-foreground transition-colors hover:border-primary hover:text-primary disabled:opacity-50">{loadingEarlier ? "Loading earlier messages…" : "Load earlier messages"}</button> : null}
              {!loading && messages.length === 0 ? <p className="py-10 text-center text-sm text-muted-foreground">No messages yet. Start the Town Hall conversation.</p> : null}
              <div className="flex flex-col gap-4">
                {messages.map((message) => (
                  <article key={message.id} className="group flex gap-3">
                    <div className="flex size-8 shrink-0 items-center justify-center overflow-hidden border border-border bg-muted text-xs text-muted-foreground">
                      {message.author.avatarUrl ? <img src={message.author.avatarUrl} alt="" className="size-full object-cover" /> : <span>{message.author.displayName.slice(0, 1).toUpperCase()}</span>}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5"><Link href={`/u/${message.author.id}`} className="text-sm font-semibold text-foreground hover:text-primary">{message.author.displayName}</Link><time className="text-[11px] text-muted-foreground" dateTime={message.createdAt}>{formatTime(message.createdAt)}</time><div className="ml-auto hidden items-center gap-2 group-hover:flex">{!reportedIds.has(message.id) ? <button type="button" onClick={() => void reportMessage(message.id)} disabled={reportingId === message.id} className="text-muted-foreground hover:text-primary" aria-label={`Report message from ${message.author.displayName}`} title="Report message"><Flag className="h-3.5 w-3.5" aria-hidden="true" /></button> : <span className="text-[10px] text-muted-foreground">Reported</span>}{isModerator ? <button type="button" onClick={() => void deleteMessage(message.id)} className="text-muted-foreground hover:text-destructive" aria-label={`Delete message from ${message.author.displayName}`} title="Delete message"><Trash2 className="h-3.5 w-3.5" aria-hidden="true" /></button> : null}</div></div>
                      <MessageBody body={message.body} />
                    </div>
                  </article>
                ))}
              </div>
            </div>
            <div className="border-t border-border p-3 sm:p-4"><div className="flex items-end gap-2"><textarea value={composer} onChange={(event) => setComposer(event.target.value)} onKeyDown={handleComposerKeyDown} maxLength={2000} rows={2} placeholder="Write to Town Hall Live…" aria-label="Chat message" className="min-h-12 flex-1 resize-none border border-border bg-card px-3 py-2 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-primary" /><button type="button" onClick={() => void sendMessage()} disabled={!composer.trim() || sending} className="inline-flex min-h-12 items-center gap-2 border border-primary bg-primary px-3 text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50" aria-label="Send chat message"><Send className="h-4 w-4" aria-hidden="true" /><span className="label-mono hidden sm:inline">Send</span></button></div><p className="mt-2 text-[11px] text-muted-foreground">Enter to send · Shift+Enter for a new line · {composer.length}/2000</p>{error ? <p role="status" className="mt-2 text-xs text-destructive">{error}</p> : null}</div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
