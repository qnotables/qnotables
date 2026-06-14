"use client"

import { useRef, useState, useTransition } from "react"
import { createReply } from "@/app/forum/actions"
import { MarkdownEditor } from "@/components/markdown-editor"

export function ReplyForm({
  threadId,
  parentReplyId,
  onCancel,
}: {
  threadId: string
  parentReplyId?: string
  onCancel?: () => void
}) {
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()
  const formRef = useRef<HTMLFormElement>(null)
  const [resetKey, setResetKey] = useState(0)

  function action(formData: FormData) {
    setError(null)
    startTransition(async () => {
      const res = await createReply(formData)
      if (res?.error) {
        setError(res.error)
      } else {
        // Remount the editor to clear it
        setResetKey((k) => k + 1)
        onCancel?.()
      }
    })
  }

  return (
    <form ref={formRef} action={action} className="flex flex-col gap-3">
      <input type="hidden" name="thread_id" value={threadId} />
      {parentReplyId && <input type="hidden" name="parent_reply_id" value={parentReplyId} />}
      <label className="label-mono text-muted-foreground">
        {parentReplyId ? "Reply to this comment" : "Add Your Reply"}
        <span className="ml-2 normal-case text-muted-foreground/60">
          (Markdown supported)
        </span>
      </label>
      <MarkdownEditor
        key={resetKey}
        name="body"
        id="reply-body"
        required
        rows={parentReplyId ? 3 : 5}
        placeholder="Argue the claim, not the operator. Paste an image to embed it."
      />
      {error ? (
        <p className="label-mono border border-destructive/50 bg-destructive/10 px-4 py-2 text-destructive">
          {error}
        </p>
      ) : null}
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={pending}
          className="label-mono bg-primary px-6 py-2.5 font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
        >
          {pending ? "Posting..." : parentReplyId ? "Post Reply" : "Post Reply"}
        </button>
        {parentReplyId && onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="label-mono border border-border px-6 py-2.5 transition-colors hover:border-primary"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  )
}
