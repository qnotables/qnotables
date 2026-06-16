"use client"

import { useState, useTransition } from "react"
import { Trash2, EyeOff, Loader2 } from "lucide-react"
import { deleteReplyAdmin } from "@/app/dashboard/actions"

interface ReplyModControlsProps {
  replyId: string
  onRemoved?: () => void
}

export function ReplyModControls({ replyId, onRemoved }: ReplyModControlsProps) {
  const [pending, startTransition] = useTransition()
  const [done, setDone] = useState(false)

  function handleDelete() {
    if (!confirm("Delete this reply permanently? This cannot be undone.")) return
    startTransition(async () => {
      const res = await deleteReplyAdmin(replyId)
      if (res.success) {
        setDone(true)
        onRemoved?.()
      }
    })
  }

  if (done) return null

  return (
    <div className="flex items-center gap-1">
      {pending ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
      ) : (
        <button
          type="button"
          onClick={handleDelete}
          title="Delete reply (admin)"
          className="flex items-center gap-0.5 border border-border px-1.5 py-0.5 text-[10px] text-muted-foreground transition-colors hover:border-destructive hover:text-destructive"
        >
          <Trash2 className="h-2.5 w-2.5" /> DEL
        </button>
      )}
    </div>
  )
}
