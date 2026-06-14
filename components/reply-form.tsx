"use client"

import { useRef, useState, useTransition } from "react"
import { createReply } from "@/app/forum/actions"

export function ReplyForm({ threadId }: { threadId: string }) {
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()
  const formRef = useRef<HTMLFormElement>(null)

  function action(formData: FormData) {
    setError(null)
    startTransition(async () => {
      const res = await createReply(formData)
      if (res?.error) {
        setError(res.error)
      } else {
        formRef.current?.reset()
      }
    })
  }

  return (
    <form ref={formRef} action={action} className="flex flex-col gap-3">
      <input type="hidden" name="thread_id" value={threadId} />
      <label htmlFor="reply-body" className="label-mono text-muted-foreground">
        Add Your Reply
      </label>
      <textarea
        id="reply-body"
        name="body"
        required
        rows={4}
        placeholder="Argue the claim, not the operator."
        className="resize-y border border-border bg-background px-4 py-3 text-foreground outline-none transition-colors focus:border-primary"
      />
      {error ? (
        <p className="label-mono border border-destructive/50 bg-destructive/10 px-4 py-2 text-destructive">
          {error}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={pending}
        className="label-mono self-start bg-primary px-6 py-2.5 font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
      >
        {pending ? "Posting..." : "Post Reply"}
      </button>
    </form>
  )
}
