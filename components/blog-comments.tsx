"use client"

import { useState, useCallback } from "react"
import { BlogComment, deleteBlogComment } from "@/app/actions/blog-comment-actions"
import { formatRelativeTime, buildCommentTree, getChildComments } from "@/lib/blog-comments"
import { BlogCommentForm } from "@/components/blog-comment-form"
import { MessageCircle, Trash2 } from "lucide-react"

interface BlogCommentsProps {
  postId: string
  initialComments: BlogComment[]
  currentUserId?: string | null
}

export function BlogComments({ postId, initialComments, currentUserId }: BlogCommentsProps) {
  const [comments, setComments] = useState<BlogComment[]>(initialComments)
  const [showReplyForm, setShowReplyForm] = useState<string | null>(null)

  const handleCommentAdded = useCallback(() => {
    window.location.reload()
  }, [])

  const topLevelComments = buildCommentTree(comments)

  if (!comments || comments.length === 0) {
    return (
      <div className="border-t border-border py-8">
        <div className="mb-8">
          <h2 className="stencil mb-6 text-lg font-bold text-foreground flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            COMMENTS
          </h2>
          <p className="label-mono mb-6 text-sm text-muted-foreground">No comments yet. Be the first to comment!</p>
        </div>
        <BlogCommentForm postId={postId} currentUserId={currentUserId} onCommentAdded={handleCommentAdded} />
      </div>
    )
  }

  return (
    <div className="border-t border-border py-8 space-y-8">
      {/* Header */}
      <div>
        <h2 className="stencil mb-6 text-lg font-bold text-foreground flex items-center gap-2">
          <MessageCircle className="h-5 w-5" />
          COMMENTS ({comments.filter(c => !c.is_deleted).length})
        </h2>

        {/* Top-level comment form */}
        <div className="mb-8">
          <BlogCommentForm postId={postId} currentUserId={currentUserId} onCommentAdded={handleCommentAdded} />
        </div>
      </div>

      {/* Comments list */}
      <div className="space-y-6">
        {topLevelComments.map((comment) => (
          <BlogCommentThread
            key={comment.id}
            comment={comment}
            allComments={comments}
            postId={postId}
            currentUserId={currentUserId}
            onReplyClick={() => setShowReplyForm(showReplyForm === comment.id ? null : comment.id)}
            showReplyForm={showReplyForm === comment.id}
            onCommentAdded={handleCommentAdded}
          />
        ))}
      </div>
    </div>
  )
}

interface BlogCommentThreadProps {
  comment: BlogComment
  allComments: BlogComment[]
  postId: string
  currentUserId?: string | null
  onReplyClick: () => void
  showReplyForm: boolean
  onCommentAdded: () => void
}

function BlogCommentThread({
  comment,
  allComments,
  postId,
  currentUserId,
  onReplyClick,
  showReplyForm,
  onCommentAdded,
}: BlogCommentThreadProps) {
  const replies = getChildComments(comment.id, allComments)
  const [deleting, setDeleting] = useState(false)

  async function handleDelete() {
    if (!confirm("Delete this comment?")) return
    setDeleting(true)
    await deleteBlogComment(comment.id)
    onCommentAdded() // reload
  }

  return (
    <div className="space-y-4">
      {/* Comment */}
      <div className="border border-border bg-muted/20 p-4">
        {/* Header */}
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center">
              <span className="label-mono text-xs font-bold text-primary">
                {comment.author_name.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <p className="label-mono text-sm font-semibold text-foreground">{comment.author_name}</p>
              <p className="text-xs text-muted-foreground">{formatRelativeTime(comment.created_at)}</p>
            </div>
          </div>

          {/* Delete button (if owner) */}
          {currentUserId && currentUserId === comment.author_id && (
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="p-1 text-muted-foreground hover:text-destructive transition-colors disabled:opacity-50"
              title="Delete comment"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Body */}
        <p className="text-sm leading-relaxed text-foreground/90 whitespace-pre-wrap">{comment.body}</p>

        {/* Reply button */}
        <button
          onClick={onReplyClick}
          className="label-mono mt-3 text-xs font-semibold text-primary hover:text-primary/80 transition-colors"
        >
          {showReplyForm ? "CANCEL" : "REPLY"}
        </button>
      </div>

      {/* Reply form */}
      {showReplyForm && (
        <div className="ml-4 pl-4 border-l-2 border-primary/50">
          <BlogCommentForm
            postId={postId}
            parentCommentId={comment.id}
            currentUserId={currentUserId}
            onCommentAdded={onCommentAdded}
            isReply
          />
        </div>
      )}

      {/* Replies */}
      {replies.length > 0 && (
        <div className="ml-4 space-y-4 pl-4 border-l border-border/50">
          {replies.map((reply) => (
            <BlogCommentThread
              key={reply.id}
              comment={reply}
              allComments={allComments}
              postId={postId}
              currentUserId={currentUserId}
              onReplyClick={() => onCommentAdded()}
              showReplyForm={false}
              onCommentAdded={onCommentAdded}
            />
          ))}
        </div>
      )}
    </div>
  )
}
