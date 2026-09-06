"use client"

import { useState, useTransition } from "react"
import { ThumbsDown, ThumbsUp } from "lucide-react"
import { voteOnThread } from "@/app/forum/actions"

export function ThreadVotes({
  threadId,
  initialUpVotes,
  initialDownVotes,
  userVote,
}: {
  threadId: string
  initialUpVotes: number
  initialDownVotes: number
  userVote?: 1 | -1 | null
}) {
  const [upVotes, setUpVotes] = useState(initialUpVotes)
  const [downVotes, setDownVotes] = useState(initialDownVotes)
  const [currentVote, setCurrentVote] = useState<1 | -1 | null>(userVote ?? null)
  const [pending, startTransition] = useTransition()

  function handleVote(vote: 1 | -1) {
    startTransition(async () => {
      const result = await voteOnThread(threadId, vote)
      if (result?.error) return

      if (currentVote === vote) {
        setCurrentVote(null)
        if (vote === 1) setUpVotes((count) => Math.max(0, count - 1))
        else setDownVotes((count) => Math.max(0, count - 1))
      } else if (currentVote === null) {
        setCurrentVote(vote)
        if (vote === 1) setUpVotes((count) => count + 1)
        else setDownVotes((count) => count + 1)
      } else {
        setCurrentVote(vote)
        if (vote === 1) {
          setUpVotes((count) => count + 1)
          setDownVotes((count) => Math.max(0, count - 1))
        } else {
          setDownVotes((count) => count + 1)
          setUpVotes((count) => Math.max(0, count - 1))
        }
      }
    })
  }

  const netVotes = upVotes - downVotes

  return (
    <div className="flex items-center gap-2" aria-label="Thread votes">
      <button
        type="button"
        onClick={() => handleVote(1)}
        disabled={pending}
        className={`flex items-center gap-1 border px-2 py-1 transition-colors ${
          currentVote === 1
            ? "border-primary bg-primary/15 text-primary"
            : "border-border text-muted-foreground hover:border-primary hover:text-primary"
        } disabled:opacity-50`}
        title="Upvote this thread"
        aria-pressed={currentVote === 1}
      >
        <ThumbsUp className="h-3.5 w-3.5" />
        <span className="label-mono text-xs">{upVotes}</span>
      </button>
      <span
        className={`label-mono min-w-8 text-center text-xs font-semibold ${
          netVotes > 0 ? "text-primary" : netVotes < 0 ? "text-destructive" : "text-muted-foreground"
        }`}
        aria-label={`${netVotes} net votes`}
      >
        {netVotes > 0 ? `+${netVotes}` : netVotes}
      </span>
      <button
        type="button"
        onClick={() => handleVote(-1)}
        disabled={pending}
        className={`flex items-center gap-1 border px-2 py-1 transition-colors ${
          currentVote === -1
            ? "border-destructive bg-destructive/15 text-destructive"
            : "border-border text-muted-foreground hover:border-destructive hover:text-destructive"
        } disabled:opacity-50`}
        title="Downvote this thread"
        aria-pressed={currentVote === -1}
      >
        <ThumbsDown className="h-3.5 w-3.5" />
        <span className="label-mono text-xs">{downVotes}</span>
      </button>
    </div>
  )
}
