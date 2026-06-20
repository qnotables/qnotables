"use client"

import { useState, useTransition } from "react"
import { Trash2, EyeOff, Eye, ImageOff, Loader2 } from "lucide-react"
import { deleteReplyAdmin, hideReply, unhideReply } from "@/app/dashboard/actions"
import { removeReplyMedia } from "@/app/forum/actions"

interface ReplyModControlsProps {
  replyId: string
  isHidden?: boolean
  onRemoved?: () => void
  onBodyChange?: (newBody: string) => void
  onHiddenChange?: (hidden: boolean) => void
}

export function ReplyModControls({
  replyId,
  isHidden = false,
  onRemoved,
  onBodyChange,
  onHiddenChange,
}: ReplyModControlsProps) {
  const [pending, startTransition] = useTransition()
  const [done, setDone] = useState(false)
  const [hidden, setHidden] = useState(isHidden)
  const [busyAction, setBusyAction] = useState<string | null>(null)

  function handleDelete() {
    if (!confirm("Delete this reply permanently? This cannot be undone.")) return
    setBusyAction("delete")
    startTransition(async () => {
      const res = await deleteReplyAdmin(replyId)
      if (res.success) {
        setDone(true)
        onRemoved?.()
      }
      setBusyAction(null)
    })
  }

  function handleHideToggle() {
    setBusyAction("hide")
    startTransition(async () => {
      const res = hidden ? await unhideReply(replyId) : await hideReply(replyId)
      if (res.success) {
        const next = !hidden
        setHidden(next)
        onHiddenChange?.(next)
      }
      setBusyAction(null)
    })
  }

  function handleStripMedia() {
    if (!confirm("Remove all images and embeds from this reply?")) return
    setBusyAction("media")
    startTransition(async () => {
      const res = await removeReplyMedia(replyId)
      if (!res.error && res.cleanBody !== undefined) {
        onBodyChange?.(res.cleanBody)
      }
      setBusyAction(null)
    })
  }

  if (done) return null

  const isBusy = pending && busyAction !== null

  return (
    <div className="flex items-center gap-1">
      {isBusy ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
      ) : (
        <>
          {/* Hide / Unhide */}
          <button
            type="button"
            onClick={handleHideToggle}
            disabled={pending}
            title={hidden ? "Restore reply" : "Hide reply"}
            className={`flex items-center gap-0.5 border px-1.5 py-0.5 text-[10px] transition-colors disabled:opacity-50 ${
              hidden
                ? "border-amber-500/60 text-amber-400 hover:border-amber-500"
                : "border-border text-muted-foreground hover:border-amber-500 hover:text-amber-400"
            }`}
          >
            {hidden ? <Eye className="h-2.5 w-2.5" /> : <EyeOff className="h-2.5 w-2.5" />}
            {hidden ? "SHOW" : "HIDE"}
          </button>

          {/* Strip media */}
          <button
            type="button"
            onClick={handleStripMedia}
            disabled={pending}
            title="Remove all images and embeds"
            className="flex items-center gap-0.5 border border-border px-1.5 py-0.5 text-[10px] text-muted-foreground transition-colors hover:border-primary hover:text-primary disabled:opacity-50"
          >
            <ImageOff className="h-2.5 w-2.5" /> MEDIA
          </button>

          {/* Delete */}
          <button
            type="button"
            onClick={handleDelete}
            disabled={pending}
            title="Delete reply (admin)"
            className="flex items-center gap-0.5 border border-border px-1.5 py-0.5 text-[10px] text-muted-foreground transition-colors hover:border-destructive hover:text-destructive disabled:opacity-50"
          >
            <Trash2 className="h-2.5 w-2.5" /> DEL
          </button>
        </>
      )}
    </div>
  )
}
