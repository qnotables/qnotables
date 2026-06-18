"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Trash2, Eye, EyeOff, Loader2 } from "lucide-react"
import { deleteVideo, toggleVideoPublished } from "@/app/actions/video-actions"

export function DeleteVideoButton({ id, title }: { id: string; title: string }) {
  const [confirming, setConfirming] = useState(false)
  const [pending, startTransition] = useTransition()
  const router = useRouter()

  function handleDelete() {
    startTransition(async () => {
      await deleteVideo(id)
      router.refresh()
    })
  }

  if (confirming) {
    return (
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={handleDelete}
          disabled={pending}
          className="label-mono flex h-8 items-center gap-1 border border-destructive/60 bg-destructive/10 px-2 text-[11px] text-destructive hover:bg-destructive/20 transition-colors disabled:opacity-50"
        >
          {pending ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
          Delete
        </button>
        <button
          type="button"
          onClick={() => setConfirming(false)}
          className="label-mono flex h-8 items-center border border-border px-2 text-[11px] text-muted-foreground hover:text-foreground transition-colors"
        >
          Cancel
        </button>
      </div>
    )
  }

  return (
    <button
      type="button"
      onClick={() => setConfirming(true)}
      className="flex h-8 w-8 items-center justify-center border border-border text-muted-foreground hover:border-destructive/60 hover:text-destructive transition-colors"
      aria-label="Delete video"
    >
      <Trash2 className="h-3.5 w-3.5" />
    </button>
  )
}

export function TogglePublishedButton({ id, published }: { id: string; published: boolean }) {
  const [pending, startTransition] = useTransition()
  const router = useRouter()

  function handleToggle() {
    startTransition(async () => {
      await toggleVideoPublished(id, !published)
      router.refresh()
    })
  }

  return (
    <button
      type="button"
      onClick={handleToggle}
      disabled={pending}
      title={published ? "Unpublish" : "Publish"}
      className="flex h-8 w-8 items-center justify-center border border-border text-muted-foreground hover:border-primary hover:text-primary transition-colors disabled:opacity-50"
      aria-label={published ? "Unpublish video" : "Publish video"}
    >
      {pending ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : published ? (
        <EyeOff className="h-3.5 w-3.5" />
      ) : (
        <Eye className="h-3.5 w-3.5" />
      )}
    </button>
  )
}
