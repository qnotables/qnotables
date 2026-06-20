"use client"

import { useState, useTransition } from "react"
import { ThumbsUp, ThumbsDown } from "lucide-react"
import { voteOnRecord, VoteType } from "@/app/archives/actions"

interface RecordVotesProps {
  recordId: string
  initialUpVotes: number
  initialDownVotes: number
  userVote?: VoteType | null
}

export function RecordVotes({
  recordId,
  initialUpVotes,
  initialDownVotes,
  userVote,
}: RecordVotesProps) {
  const [upVotes, setUpVotes] = useState(initialUpVotes)
  const [downVotes, setDownVotes] = useState(initialDownVotes)
  const [currentVote, setCurrentVote] = useState<VoteType | null>(userVote ?? null)
  const [pending, startTransition] = useTransition()
  const [authError, setAuthError] = useState(false)

  function handleVote(voteType: VoteType) {
    setAuthError(false)
    startTransition(async () => {
      // Optimistic update
      const prevVote = currentVote
      const prevUp = upVotes
      const prevDown = downVotes

      if (currentVote === voteType) {
        // Retract
        setCurrentVote(null)
        if (voteType === "up") setUpVotes((v) => Math.max(0, v - 1))
        else setDownVotes((v) => Math.max(0, v - 1))
      } else if (!currentVote) {
        // First vote
        setCurrentVote(voteType)
        if (voteType === "up") setUpVotes((v) => v + 1)
        else setDownVotes((v) => v + 1)
      } else {
        // Switch vote
        setCurrentVote(voteType)
        if (voteType === "up") {
          setUpVotes((v) => v + 1)
          setDownVotes((v) => Math.max(0, v - 1))
        } else {
          setDownVotes((v) => v + 1)
          setUpVotes((v) => Math.max(0, v - 1))
        }
      }

      const res = await voteOnRecord(recordId, voteType)

      if (res.error) {
        // Revert optimistic update
        setCurrentVote(prevVote)
        setUpVotes(prevUp)
        setDownVotes(prevDown)
        setAuthError(true)
      } else if (res.counts) {
        // Sync with server counts
        setUpVotes(res.counts.up)
        setDownVotes(res.counts.down)
      }
    })
  }

  return (
    <div className="flex items-center gap-1" title={authError ? "Sign in to vote" : undefined}>
      <button
        onClick={() => handleVote("up")}
        disabled={pending}
        aria-label={`Upvote${upVotes > 0 ? ` (${upVotes})` : ""}`}
        className={`flex items-center gap-1 rounded px-2 py-1 transition-colors disabled:opacity-50 ${
          currentVote === "up"
            ? "bg-primary/15 text-primary"
            : "text-muted-foreground hover:bg-muted hover:text-foreground"
        }`}
      >
        <ThumbsUp className="h-3.5 w-3.5" />
        {upVotes > 0 && (
          <span className="label-mono text-xs">{upVotes}</span>
        )}
      </button>

      <button
        onClick={() => handleVote("down")}
        disabled={pending}
        aria-label={`Downvote${downVotes > 0 ? ` (${downVotes})` : ""}`}
        className={`flex items-center gap-1 rounded px-2 py-1 transition-colors disabled:opacity-50 ${
          currentVote === "down"
            ? "bg-destructive/15 text-destructive"
            : "text-muted-foreground hover:bg-muted hover:text-foreground"
        }`}
      >
        <ThumbsDown className="h-3.5 w-3.5" />
        {downVotes > 0 && (
          <span className="label-mono text-xs">{downVotes}</span>
        )}
      </button>

      {authError && (
        <span className="label-mono text-xs text-destructive ml-1">sign in to vote</span>
      )}
    </div>
  )
}
