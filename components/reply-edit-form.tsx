"use client"

import { useState, useTransition } from "react"
import { Pencil } from "lucide-react"
import { updateReply } from "@/app/forum/actions"
import { TiptapEditor } from "@/components/tiptap-editor"

/**
 * Inline edit control for a reply the current user owns. Renders an "Edit"
 * button that swaps the rendered reply for a Markdown editor pre-filled with
 * the current body. On save it calls the updateReply server action, which
 * revalidates the thread so the edited content re-renders server-side.
 */
export function ReplyEditForm({
  replyId,
  initialBody,
  contentVersion = 1,
  locked = false,
}: {
  replyId: string
  initialBody: string
  contentVersion?: number
  locked?: boolean
}) {
  const [editing, setEditing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  function action(formData: FormData) {
    setError(null)
    formData.set("reply_id", replyId)
    startTransition(async () => {
      const res = await updateReply(formData)
      if (res?.error) {
        setError(res.error)
      } else {
        setEditing(false)
      }
    })
  }

  if (locked) return null

  if (!editing) {
    return (
      <button
        type="button"
        onClick={() => setEditing(true)}
        className="label-mono inline-flex items-center gap-1 text-[10px] text-muted-foreground transition-colors hover:text-primary"
        aria-label="Edit your reply"
      >
        <Pencil className="h-3 w-3" />
        EDIT
      </button>
    )
  }

  return (
    <form action={action} className="mt-2 flex flex-col gap-3">
      <TiptapEditor
        name="body"
        id={`edit-reply-${replyId}`}
        required
        uploadFolder="forum"
        isSignedIn
        defaultValue={initialBody}
        placeholder="Edit your reply…"
      />
      <input type="hidden" name="content_format" value="tiptap" />
      <input type="hidden" name="content_version" value={contentVersion} />
      {error ? (
        <p className="label-mono border border-destructive/50 bg-destructive/10 px-4 py-2 text-destructive">
          {error}
        </p>
      ) : null}
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={pending}
          className="label-mono bg-primary px-5 py-2 font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
        >
          {pending ? "Saving…" : "Save Changes"}
        </button>
        <button
          type="button"
          onClick={() => {
            setEditing(false)
            setError(null)
          }}
          className="label-mono border border-border px-5 py-2 transition-colors hover:border-primary"
        >
          Cancel
        </button>
      </div>
    </form>
  )
}
