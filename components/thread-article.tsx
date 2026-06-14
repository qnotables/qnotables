"use client"

import { useState } from "react"
import Link from "next/link"
import { Clock, Pencil, Trash2, X, Loader2 } from "lucide-react"
import { updateThread, deleteThread } from "@/app/forum/actions"
import { timeAgo } from "@/lib/time"

interface ThreadArticleProps {
  id: string
  title: string
  body: string
  createdAt: string
  authorId: string | null
  authorName: string
  isOwner: boolean
}

export function ThreadArticle({
  id,
  title,
  body,
  createdAt,
  authorId,
  authorName,
  isOwner,
}: ThreadArticleProps) {
  const [editing, setEditing] = useState(false)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSave(formData: FormData) {
    setPending(true)
    setError(null)
    const res = await updateThread(formData)
    setPending(false)
    if (res?.error) {
      setError(res.error)
      return
    }
    setEditing(false)
  }

  async function handleDelete(formData: FormData) {
    if (!confirm("Delete this thread and all its replies? This cannot be undone.")) {
      return
    }
    setPending(true)
    await deleteThread(formData)
    // deleteThread redirects on success; if it returns, surface nothing.
    setPending(false)
  }

  if (editing) {
    return (
      <article className="corner-frame border border-primary bg-card p-6 md:p-8">
        <form action={handleSave} className="flex flex-col gap-4">
          <input type="hidden" name="thread_id" value={id} />
          <div className="flex flex-col gap-2">
            <label htmlFor="edit-title" className="label-mono text-muted-foreground">
              Title
            </label>
            <input
              id="edit-title"
              name="title"
              defaultValue={title}
              required
              minLength={4}
              className="border border-border bg-background px-3 py-2 text-foreground outline-none focus:border-primary"
            />
          </div>
          <div className="flex flex-col gap-2">
            <label htmlFor="edit-body" className="label-mono text-muted-foreground">
              Body
            </label>
            <textarea
              id="edit-body"
              name="body"
              defaultValue={body}
              required
              minLength={4}
              rows={8}
              className="resize-y border border-border bg-background px-3 py-2 leading-relaxed text-foreground outline-none focus:border-primary"
            />
          </div>

          {error ? <p className="label-mono text-destructive">{error}</p> : null}

          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={pending}
              className="label-mono flex items-center gap-2 bg-primary px-4 py-2 font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
            >
              {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Save Changes
            </button>
            <button
              type="button"
              onClick={() => {
                setEditing(false)
                setError(null)
              }}
              className="label-mono flex items-center gap-2 border border-border px-4 py-2 text-muted-foreground transition-colors hover:border-primary hover:text-primary"
            >
              <X className="h-4 w-4" /> Cancel
            </button>
          </div>
        </form>
      </article>
    )
  }

  return (
    <article className="corner-frame border border-border bg-card p-6 md:p-8">
      <h1 className="stencil text-balance text-2xl leading-tight text-foreground md:text-3xl">
        {title}
      </h1>
      <div className="label-mono mt-3 flex flex-wrap items-center gap-4 text-muted-foreground">
        {authorId ? (
          <Link href={`/u/${authorId}`} className="text-primary underline-offset-4 hover:underline">
            {authorName}
          </Link>
        ) : (
          <span className="text-primary">{authorName}</span>
        )}
        <span className="flex items-center gap-1">
          <Clock className="h-3.5 w-3.5" /> {timeAgo(createdAt)}
        </span>
        {isOwner ? (
          <span className="ml-auto flex items-center gap-2">
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="flex items-center gap-1 border border-border px-2 py-1 text-muted-foreground transition-colors hover:border-primary hover:text-primary"
            >
              <Pencil className="h-3.5 w-3.5" /> Edit
            </button>
            <form action={handleDelete}>
              <input type="hidden" name="thread_id" value={id} />
              <button
                type="submit"
                disabled={pending}
                className="flex items-center gap-1 border border-border px-2 py-1 text-muted-foreground transition-colors hover:border-destructive hover:text-destructive disabled:opacity-60"
              >
                <Trash2 className="h-3.5 w-3.5" /> Delete
              </button>
            </form>
          </span>
        ) : null}
      </div>
      <p className="mt-5 whitespace-pre-wrap text-pretty leading-relaxed text-foreground/90">
        {body}
      </p>
    </article>
  )
}
