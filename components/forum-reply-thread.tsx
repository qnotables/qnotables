"use client"

import Link from "next/link"
import { useMemo, useState } from "react"
import { Clock, CornerDownRight } from "lucide-react"
import { ReplyEditForm } from "@/components/reply-edit-form"
import { ReplyForm } from "@/components/reply-form"
import { ReplyModControls } from "@/components/reply-mod-controls"
import { ReplyVotes } from "@/components/reply-votes"
import { ReportButton } from "@/components/report-button"
import { TiptapRenderer } from "@/components/tiptap-renderer"
import { timeAgo } from "@/lib/time"

export interface ForumReply {
  id: string
  body: string
  created_at: string
  updated_at: string | null
  author_id: string
  parent_reply_id: string | null
  is_hidden: boolean
  content_format: string | null
  content_version: number
  profiles: { display_name: string } | null
}

type VoteTotals = Record<string, { up: number; down: number; userVote?: "up" | "down" }>

interface ForumReplyThreadProps {
  replies: ForumReply[]
  threadId: string
  isLocked: boolean
  currentUserId?: string
  isAdmin: boolean
  votes: VoteTotals
}

export function ForumReplyThread({
  replies,
  threadId,
  isLocked,
  currentUserId,
  isAdmin,
  votes,
}: ForumReplyThreadProps) {
  const roots = useMemo(() => {
    const byParent = new Map<string | null, ForumReply[]>()
    const ids = new Set(replies.map((reply) => reply.id))

    for (const reply of replies) {
      const parent = reply.parent_reply_id && ids.has(reply.parent_reply_id) ? reply.parent_reply_id : null
      byParent.set(parent, [...(byParent.get(parent) ?? []), reply])
    }

    return { replies: byParent.get(null) ?? [], byParent }
  }, [replies])

  return (
    <div className="flex flex-col gap-3">
      {roots.replies.map((reply) => (
        <ReplyBranch
          key={reply.id}
          reply={reply}
          byParent={roots.byParent}
          threadId={threadId}
          isLocked={isLocked}
          currentUserId={currentUserId}
          isAdmin={isAdmin}
          votes={votes}
          depth={0}
          ancestry={new Set()}
        />
      ))}
    </div>
  )
}

function ReplyBranch({
  reply,
  byParent,
  threadId,
  isLocked,
  currentUserId,
  isAdmin,
  votes,
  depth,
  ancestry,
}: {
  reply: ForumReply
  byParent: Map<string | null, ForumReply[]>
  threadId: string
  isLocked: boolean
  currentUserId?: string
  isAdmin: boolean
  votes: VoteTotals
  depth: number
  ancestry: Set<string>
}) {
  const [replying, setReplying] = useState(false)
  const children = ancestry.has(reply.id) ? [] : byParent.get(reply.id) ?? []
  const nextAncestry = new Set(ancestry).add(reply.id)
  const totals = votes[reply.id] ?? { up: 0, down: 0 }
  const nested = depth > 0
  const indented = depth > 0 && depth <= 3

  return (
    <div className={indented ? "border-l-2 border-border pl-3 sm:pl-4" : undefined}>
      <article
        className={`border ${nested ? "p-4" : "p-5"} ${
          reply.is_hidden ? "border-amber-500/30 bg-amber-500/5" : nested ? "border-border bg-muted/20" : "border-border bg-card"
        }`}
      >
        <div className="label-mono mb-2 flex flex-col gap-2 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-3">
            <Link href={`/u/${reply.author_id}`} className="text-primary underline-offset-4 hover:underline">
              {reply.profiles?.display_name ?? "operator"}
            </Link>
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" /> {timeAgo(reply.created_at)}
            </span>
            {reply.updated_at && reply.updated_at !== reply.created_at && (
              <span className="text-[10px] italic text-muted-foreground/70">(edited)</span>
            )}
            {reply.is_hidden && (
              <span className="border border-amber-500/40 bg-amber-500/10 px-1.5 py-0.5 text-[10px] text-amber-400">HIDDEN</span>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {isAdmin && <ReplyModControls replyId={reply.id} isHidden={reply.is_hidden} />}
            {currentUserId && currentUserId !== reply.author_id && (
              <ReportButton contentType="forum_reply" contentId={reply.id} isSignedIn compact={nested} />
            )}
            <ReplyVotes
              replyId={reply.id}
              initialUpVotes={totals.up}
              initialDownVotes={totals.down}
              userVote={totals.userVote}
            />
          </div>
        </div>

        <div className={nested ? "mt-2 text-sm" : "mt-2"}>
          <TiptapRenderer content={reply.body} />
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-3 border-t border-border/50 pt-2">
          {currentUserId && !isLocked && (
            <button
              type="button"
              onClick={() => setReplying((value) => !value)}
              aria-expanded={replying}
              aria-controls={`reply-form-${reply.id}`}
              className="label-mono inline-flex items-center gap-1 text-xs text-primary transition-opacity hover:opacity-80"
            >
              <CornerDownRight className="h-3.5 w-3.5" /> {replying ? "Cancel reply" : "Reply"}
            </button>
          )}
          {currentUserId === reply.author_id && !isLocked && (
            <ReplyEditForm
              replyId={reply.id}
              initialBody={reply.body}
              contentVersion={reply.content_version}
              locked={isLocked}
            />
          )}
        </div>

        {replying && currentUserId && !isLocked && (
          <div id={`reply-form-${reply.id}`} className="mt-4 border-t border-border pt-4">
            <ReplyForm
              threadId={threadId}
              parentReplyId={reply.id}
              onCancel={() => setReplying(false)}
              isSignedIn
            />
          </div>
        )}
      </article>

      {children.length > 0 && (
        <div className="mt-3 flex flex-col gap-3">
          {children.map((child) => (
            <ReplyBranch
              key={child.id}
              reply={child}
              byParent={byParent}
              threadId={threadId}
              isLocked={isLocked}
              currentUserId={currentUserId}
              isAdmin={isAdmin}
              votes={votes}
              depth={depth + 1}
              ancestry={nextAncestry}
            />
          ))}
        </div>
      )}
    </div>
  )
}
