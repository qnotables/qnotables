"use client"

import { useState, useTransition } from "react"
import { Check, X, ExternalLink, Loader2, Clock, Link as LinkIcon, Film } from "lucide-react"
import { approveThread, rejectThread, approveReply, rejectReply } from "@/app/forum/actions"
import { buildExcerpt } from "@/lib/forum-utils"
import { countLinks as spamCountLinks, countEmbeds as spamCountEmbeds } from "@/lib/forum-spam-guard"
import { timeAgo } from "@/lib/time"

function fmt(iso: string) {
  try {
    return timeAgo(iso)
  } catch {
    return "—"
  }
}

export interface PendingThread {
  id: string
  title: string
  body: string
  created_at: string
  author_id: string
  authorName: string
}

export interface PendingReply {
  id: string
  thread_id: string
  threadTitle: string
  body: string
  created_at: string
  author_id: string
  authorName: string
}

interface Props {
  threads: PendingThread[]
  replies: PendingReply[]
}

function PendingThreadRow({ thread, onAction }: { thread: PendingThread; onAction: (id: string) => void }) {
  const [pending, startTransition] = useTransition()
  const [busyAction, setBusyAction] = useState<"approve" | "reject" | null>(null)

  const linkCount = spamCountLinks(thread.body)
  const embedCount = spamCountEmbeds(thread.body)
  const excerpt = buildExcerpt(thread.body, 160)

  function act(action: "approve" | "reject") {
    setBusyAction(action)
    startTransition(async () => {
      if (action === "approve") {
        await approveThread(thread.id)
      } else {
        await rejectThread(thread.id)
      }
      onAction(thread.id)
      setBusyAction(null)
    })
  }

  return (
    <div className="border border-border bg-card p-4">
      <div className="mb-2 flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <p className="font-semibold text-foreground">{thread.title}</p>
          <div className="label-mono flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
            <span>{thread.authorName}</span>
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" /> {fmt(thread.created_at)}
            </span>
            {linkCount > 0 && (
              <span className="flex items-center gap-1 text-amber-400">
                <LinkIcon className="h-3 w-3" /> {linkCount} link{linkCount !== 1 ? "s" : ""}
              </span>
            )}
            {embedCount > 0 && (
              <span className="flex items-center gap-1 text-amber-400">
                <Film className="h-3 w-3" /> {embedCount} embed{embedCount !== 1 ? "s" : ""}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {pending ? (
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          ) : (
            <>
              <a
                href={`/forum/${thread.id}`}
                target="_blank"
                rel="noopener noreferrer"
                title="Preview thread"
                className="flex items-center gap-1 border border-border px-2 py-1 text-xs text-muted-foreground transition-colors hover:border-primary hover:text-primary"
              >
                <ExternalLink className="h-3 w-3" /> View
              </a>
              <button
                type="button"
                onClick={() => act("approve")}
                disabled={pending}
                title="Approve"
                className="flex items-center gap-1 border border-border px-2 py-1 text-xs text-muted-foreground transition-colors hover:border-primary hover:text-primary disabled:opacity-50"
              >
                <Check className="h-3.5 w-3.5" /> Approve
              </button>
              <button
                type="button"
                onClick={() => act("reject")}
                disabled={pending}
                title="Reject"
                className="flex items-center gap-1 border border-border px-2 py-1 text-xs text-muted-foreground transition-colors hover:border-destructive hover:text-destructive disabled:opacity-50"
              >
                <X className="h-3.5 w-3.5" /> Reject
              </button>
            </>
          )}
        </div>
      </div>
      {excerpt && <p className="label-mono text-xs text-muted-foreground line-clamp-2">{excerpt}</p>}
    </div>
  )
}

function PendingReplyRow({ reply, onAction }: { reply: PendingReply; onAction: (id: string) => void }) {
  const [pending, startTransition] = useTransition()
  const [busyAction, setBusyAction] = useState<"approve" | "reject" | null>(null)

  const linkCount = spamCountLinks(reply.body)
  const embedCount = spamCountEmbeds(reply.body)
  const excerpt = buildExcerpt(reply.body, 140)

  function act(action: "approve" | "reject") {
    setBusyAction(action)
    startTransition(async () => {
      if (action === "approve") {
        await approveReply(reply.id)
      } else {
        await rejectReply(reply.id)
      }
      onAction(reply.id)
      setBusyAction(null)
    })
  }

  return (
    <div className="border border-border bg-card p-4">
      <div className="mb-2 flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <p className="label-mono text-xs text-muted-foreground">
            Reply to:{" "}
            <span className="text-foreground">{reply.threadTitle}</span>
          </p>
          <div className="label-mono flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
            <span>{reply.authorName}</span>
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" /> {fmt(reply.created_at)}
            </span>
            {linkCount > 0 && (
              <span className="flex items-center gap-1 text-amber-400">
                <LinkIcon className="h-3 w-3" /> {linkCount} link{linkCount !== 1 ? "s" : ""}
              </span>
            )}
            {embedCount > 0 && (
              <span className="flex items-center gap-1 text-amber-400">
                <Film className="h-3 w-3" /> {embedCount} embed{embedCount !== 1 ? "s" : ""}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          {pending ? (
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          ) : (
            <>
              <a
                href={`/forum/${reply.thread_id}`}
                target="_blank"
                rel="noopener noreferrer"
                title="View thread"
                className="flex items-center gap-1 border border-border px-2 py-1 text-xs text-muted-foreground transition-colors hover:border-primary hover:text-primary"
              >
                <ExternalLink className="h-3 w-3" /> View
              </a>
              <button
                type="button"
                onClick={() => act("approve")}
                disabled={pending}
                title="Approve reply"
                className="flex items-center gap-1 border border-border px-2 py-1 text-xs text-muted-foreground transition-colors hover:border-primary hover:text-primary disabled:opacity-50"
              >
                <Check className="h-3.5 w-3.5" /> Approve
              </button>
              <button
                type="button"
                onClick={() => act("reject")}
                disabled={pending}
                title="Reject reply"
                className="flex items-center gap-1 border border-border px-2 py-1 text-xs text-muted-foreground transition-colors hover:border-destructive hover:text-destructive disabled:opacity-50"
              >
                <X className="h-3.5 w-3.5" /> Reject
              </button>
            </>
          )}
        </div>
      </div>
      {excerpt && <p className="label-mono text-xs text-muted-foreground line-clamp-2">{excerpt}</p>}
    </div>
  )
}

export function PendingPostsQueue({ threads: initialThreads, replies: initialReplies }: Props) {
  const [threads, setThreads] = useState(initialThreads)
  const [replies, setReplies] = useState(initialReplies)

  const total = threads.length + replies.length

  if (total === 0) {
    return (
      <div className="border border-border bg-muted/20 p-6 text-center">
        <p className="label-mono text-sm text-muted-foreground">No posts pending review.</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2">
      {threads.map((t) => (
        <PendingThreadRow
          key={t.id}
          thread={t}
          onAction={(id) => setThreads((prev) => prev.filter((x) => x.id !== id))}
        />
      ))}
      {replies.map((r) => (
        <PendingReplyRow
          key={r.id}
          reply={r}
          onAction={(id) => setReplies((prev) => prev.filter((x) => x.id !== id))}
        />
      ))}
    </div>
  )
}
