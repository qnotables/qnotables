"use client"

import { useState, useCallback } from "react"
import { Send, AlertCircle, Loader2, LogIn } from "lucide-react"
import { createBlogComment } from "@/app/actions/blog-comment-actions"
import Link from "next/link"

interface BlogCommentFormProps {
  postId: string
  parentCommentId?: string | null
  currentUserId?: string | null
  onCommentAdded?: () => void
  isReply?: boolean
}

export function BlogCommentForm({
  postId,
  parentCommentId = null,
  currentUserId,
  onCommentAdded,
  isReply = false,
}: BlogCommentFormProps) {
  const [body, setBody] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      setError(null)
      setSuccess(false)

      if (!body.trim()) {
        setError("Comment cannot be empty")
        return
      }

      setIsLoading(true)

      try {
        const result = await createBlogComment(postId, body, parentCommentId)

        if (result.success) {
          setBody("")
          setSuccess(true)
          setTimeout(() => setSuccess(false), 3000)
          onCommentAdded?.()
        } else {
          setError(result.error || "Failed to post comment")
        }
      } catch (err) {
        setError("An error occurred. Please try again.")
      } finally {
        setIsLoading(false)
      }
    },
    [postId, parentCommentId, body, onCommentAdded]
  )

  // Not logged in — show gate
  if (!currentUserId) {
    return (
      <div className={`border border-border bg-muted/20 p-4 ${isReply ? "ml-4 mt-3" : ""}`}>
        <p className="label-mono mb-3 text-sm text-muted-foreground">
          You must be logged in to leave a comment.
        </p>
        <Link
          href="/auth/login"
          className="label-mono inline-flex items-center gap-2 bg-primary px-4 py-2 text-xs font-semibold text-background hover:bg-primary/90 transition-colors"
        >
          <LogIn className="h-3 w-3" />
          LOG IN TO COMMENT
        </Link>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className={`space-y-3 ${isReply ? "ml-4 mt-3 pl-4 border-l border-border" : ""}`}>
      {/* Comment body */}
      <textarea
        placeholder={isReply ? "Add a reply..." : "Add your comment..."}
        value={body}
        onChange={(e) => setBody(e.target.value)}
        maxLength={1000}
        className="label-mono w-full border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none resize-none"
        rows={isReply ? 3 : 4}
        disabled={isLoading}
      />

      <div className="flex items-center justify-between">
        <div className="text-xs text-muted-foreground">{body.length}/1000</div>

        <div className="flex items-center gap-3">
          {error && (
            <div className="flex items-center gap-1 text-xs text-red-500">
              <AlertCircle className="h-3 w-3" />
              {error}
            </div>
          )}
          {success && <div className="label-mono text-xs text-green-600">POSTED</div>}
        </div>
      </div>

      <button
        type="submit"
        disabled={isLoading || !body.trim()}
        className="label-mono inline-flex items-center gap-2 bg-primary px-4 py-2 text-xs font-semibold text-background hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {isLoading ? (
          <>
            <Loader2 className="h-3 w-3 animate-spin" />
            POSTING...
          </>
        ) : (
          <>
            <Send className="h-3 w-3" />
            {isReply ? "POST REPLY" : "POST COMMENT"}
          </>
        )}
      </button>
    </form>
  )
}
