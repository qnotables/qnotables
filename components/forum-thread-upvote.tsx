"use client"

import { useState, useTransition } from "react"
import { ThumbsUp } from "lucide-react"
import { voteOnThread } from "@/app/forum/actions"

export function ForumThreadUpvote({
  threadId,
  initialUpVotes,
  userVote,
}: {
  threadId: string
  initialUpVotes: number
  userVote?: 1 | -1 | null
}) {
  const [upVotes, setUpVotes] = useState(initialUpVotes)
  const [currentVote, setCurrentVote] = useState<1 | -1 | null>(userVote ?? null)
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()
  const isUpvoted = currentVote === 1

  function handleUpvote() {
    startTransition(async () => {
      setError(null)
      const result = await voteOnThread(threadId, 1)
      if (result?.error) {
        setError(result.error)
        return
      }

      if (isUpvoted) {
        setCurrentVote(null)
        setUpVotes((count) => Math.max(0, count - 1))
      } else {
        setCurrentVote(1)
        setUpVotes((count) => count + 1)
      }
    })
  }

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={handleUpvote}
        disabled={pending}
        className={`label-mono flex items-center gap-1.5 border px-2.5 py-1.5 text-[10px] transition-colors ${
          isUpvoted
            ? "border-primary bg-primary/15 text-primary"
            : "border-border text-muted-foreground hover:border-primary hover:text-primary"
        } disabled:opacity-50`}
        title={isUpvoted ? "Remove your upvote" : "Upvote this thread"}
        aria-pressed={isUpvoted}
      >
        <ThumbsUp className="h-3.5 w-3.5" />
        <span>{upVotes}</span>
      </button>
      {error && <span className="text-xs text-destructive" role="alert">{error}</span>}
    </div>
  )
}
