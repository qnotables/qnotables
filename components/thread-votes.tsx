"use client"

import { useState, useTransition } from "react"
import { ChevronUp, ChevronDown } from "lucide-react"
import { voteOnThread } from "@/app/forum/actions"

interface ThreadVotesProps {
  threadId: string
  initialScore: number
  userVote?: 1 | -1 | null
  isSignedIn: boolean
}

export function ThreadVotes({ threadId, initialScore, userVote, isSignedIn }: ThreadVotesProps) {
  const [score, setScore] = useState(initialScore)
  const [current, setCurrent] = useState<1 | -1 | null>(userVote ?? null)
  const [pending, startTransition] = useTransition()

  function handleVote(vote: 1 | -1) {
    if (!isSignedIn) return
    startTransition(async () => {
      const res = await voteOnThread(threadId, vote)
      if (!res?.error) {
        if (current === vote) {
          // Undo vote
          setScore((s) => s - vote)
          setCurrent(null)
        } else {
          // New or flipped vote
          const delta = vote - (current ?? 0)
          setScore((s) => s + delta)
          setCurrent(vote)
        }
      }
    })
  }

  return (
    <div className="flex items-center gap-1">
      <button
        onClick={() => handleVote(1)}
        disabled={pending || !isSignedIn}
        title={isSignedIn ? "Upvote" : "Sign in to vote"}
        className={`flex items-center justify-center rounded p-1 transition-colors disabled:opacity-50 ${
          current === 1
            ? "bg-primary/20 text-primary"
            : "text-muted-foreground hover:bg-muted hover:text-foreground"
        }`}
      >
        <ChevronUp className="h-4 w-4" />
      </button>

      <span
        className={`label-mono min-w-[2ch] text-center text-sm font-semibold tabular-nums ${
          score > 0 ? "text-primary" : score < 0 ? "text-destructive" : "text-muted-foreground"
        }`}
      >
        {score > 0 ? `+${score}` : score}
      </span>

      <button
        onClick={() => handleVote(-1)}
        disabled={pending || !isSignedIn}
        title={isSignedIn ? "Downvote" : "Sign in to vote"}
        className={`flex items-center justify-center rounded p-1 transition-colors disabled:opacity-50 ${
          current === -1
            ? "bg-destructive/20 text-destructive"
            : "text-muted-foreground hover:bg-muted hover:text-foreground"
        }`}
      >
        <ChevronDown className="h-4 w-4" />
      </button>
    </div>
  )
}
