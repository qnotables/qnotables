"use client"

import { useState, useTransition } from "react"
import { ThumbsUp, ThumbsDown, Eye } from "lucide-react"
import { voteOnArchivePost } from "@/app/actions/archive-vote-actions"

interface ArchiveVotesProps {
  postId: string
  slug: string
  initialUpVotes: number
  initialDownVotes: number
  userVote: "up" | "down" | null
  viewCount: number
}

export function ArchiveVotes({
  postId,
  slug,
  initialUpVotes,
  initialDownVotes,
  userVote,
  viewCount,
}: ArchiveVotesProps) {
  const [upVotes, setUpVotes] = useState(initialUpVotes)
  const [downVotes, setDownVotes] = useState(initialDownVotes)
  const [currentVote, setCurrentVote] = useState<"up" | "down" | null>(userVote)
  const [pending, startTransition] = useTransition()

  function handleVote(voteType: "up" | "down") {
    startTransition(async () => {
      const res = await voteOnArchivePost(postId, slug, voteType)
      if (!res?.error) {
        if (currentVote === voteType) {
          // Retract vote
          setCurrentVote(null)
          voteType === "up"
            ? setUpVotes((v) => Math.max(0, v - 1))
            : setDownVotes((v) => Math.max(0, v - 1))
        } else if (!currentVote) {
          // New vote
          setCurrentVote(voteType)
          voteType === "up" ? setUpVotes((v) => v + 1) : setDownVotes((v) => v + 1)
        } else {
          // Change vote
          if (currentVote === "up") {
            setUpVotes((v) => Math.max(0, v - 1))
            setDownVotes((v) => v + 1)
          } else {
            setDownVotes((v) => Math.max(0, v - 1))
            setUpVotes((v) => v + 1)
          }
          setCurrentVote(voteType)
        }
      }
    })
  }

  const netVotes = upVotes - downVotes

  return (
    <div className="flex items-center gap-4">
      {/* Views */}
      <div className="flex items-center gap-1.5 text-muted-foreground">
        <Eye className="h-4 w-4" />
        <span className="label-mono text-xs">{viewCount.toLocaleString()}</span>
      </div>

      <div className="h-4 w-px bg-border" />

      {/* Upvote */}
      <button
        onClick={() => handleVote("up")}
        disabled={pending}
        className={`flex items-center gap-1.5 px-2 py-1 transition-colors disabled:opacity-50 ${
          currentVote === "up"
            ? "bg-primary/20 text-primary"
            : "text-muted-foreground hover:bg-muted hover:text-foreground"
        }`}
        title="Upvote this record"
        aria-pressed={currentVote === "up"}
      >
        <ThumbsUp className="h-4 w-4" />
        <span className="label-mono text-xs">{upVotes}</span>
      </button>

      {/* Net score */}
      <span
        className={`label-mono text-xs font-semibold ${
          netVotes > 0
            ? "text-primary"
            : netVotes < 0
              ? "text-destructive"
              : "text-muted-foreground"
        }`}
      >
        {netVotes > 0 ? `+${netVotes}` : netVotes}
      </span>

      {/* Downvote */}
      <button
        onClick={() => handleVote("down")}
        disabled={pending}
        className={`flex items-center gap-1.5 px-2 py-1 transition-colors disabled:opacity-50 ${
          currentVote === "down"
            ? "bg-destructive/20 text-destructive"
            : "text-muted-foreground hover:bg-muted hover:text-foreground"
        }`}
        title="Downvote this record"
        aria-pressed={currentVote === "down"}>
        <ThumbsDown className="h-4 w-4" />
        <span className="label-mono text-xs">{downVotes}</span>
      </button>
    </div>
  )
}
