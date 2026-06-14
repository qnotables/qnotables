"use client"

import { useState, useTransition } from "react"
import { ThumbsUp, ThumbsDown } from "lucide-react"
import { voteOnReply } from "@/app/forum/actions"

export function ReplyVotes({
  replyId,
  initialUpVotes,
  initialDownVotes,
  userVote,
}: {
  replyId: string
  initialUpVotes: number
  initialDownVotes: number
  userVote?: "up" | "down" | null
}) {
  const [upVotes, setUpVotes] = useState(initialUpVotes)
  const [downVotes, setDownVotes] = useState(initialDownVotes)
  const [currentVote, setCurrentVote] = useState<"up" | "down" | null>(userVote ?? null)
  const [pending, startTransition] = useTransition()

  function handleVote(voteType: "up" | "down") {
    startTransition(async () => {
      const res = await voteOnReply(replyId, voteType)
      if (!res?.error) {
        // Optimistic update
        if (currentVote === voteType) {
          // Removing vote
          setCurrentVote(null)
          if (voteType === "up") {
            setUpVotes(Math.max(0, upVotes - 1))
          } else {
            setDownVotes(Math.max(0, downVotes - 1))
          }
        } else if (!currentVote) {
          // Adding first vote
          setCurrentVote(voteType)
          if (voteType === "up") {
            setUpVotes(upVotes + 1)
          } else {
            setDownVotes(downVotes + 1)
          }
        } else {
          // Changing vote
          if (currentVote === "up") {
            setUpVotes(Math.max(0, upVotes - 1))
            setDownVotes(downVotes + 1)
          } else {
            setDownVotes(Math.max(0, downVotes - 1))
            setUpVotes(upVotes + 1)
          }
          setCurrentVote(voteType)
        }
      }
    })
  }

  const netVotes = upVotes - downVotes

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={() => handleVote("up")}
        disabled={pending}
        className={`flex items-center gap-1 rounded px-2 py-1 transition-colors ${
          currentVote === "up"
            ? "bg-primary/20 text-primary"
            : "text-muted-foreground hover:bg-muted hover:text-foreground"
        } disabled:opacity-50`}
        title="Upvote this reply"
      >
        <ThumbsUp className="h-3.5 w-3.5" />
        <span className="label-mono text-xs">{upVotes}</span>
      </button>

      <span className={`label-mono text-xs font-semibold ${netVotes > 0 ? "text-primary" : netVotes < 0 ? "text-destructive" : "text-muted-foreground"}`}>
        {netVotes > 0 ? `+${netVotes}` : netVotes}
      </span>

      <button
        onClick={() => handleVote("down")}
        disabled={pending}
        className={`flex items-center gap-1 rounded px-2 py-1 transition-colors ${
          currentVote === "down"
            ? "bg-destructive/20 text-destructive"
            : "text-muted-foreground hover:bg-muted hover:text-foreground"
        } disabled:opacity-50`}
        title="Downvote this reply"
      >
        <ThumbsDown className="h-3.5 w-3.5" />
        <span className="label-mono text-xs">{downVotes}</span>
      </button>
    </div>
  )
}
