"use client"

import { useState } from "react"
import { Trash2 } from "lucide-react"
import { deleteThreadAsAdmin } from "@/app/forum/actions"

export function ForumDeleteButton({ threadId }: { threadId: string }) {
  const [loading, setLoading] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const handleDelete = async () => {
    setLoading(true)
    const result = await deleteThreadAsAdmin(threadId)
    setLoading(false)

    if (result.error) {
      alert(`Error: ${result.error}`)
      setShowConfirm(false)
    } else {
      // Success handled by server-side revalidatePath
      setShowConfirm(false)
    }
  }

  if (showConfirm) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
        <div className="border border-border bg-card p-6 rounded">
          <h2 className="stencil text-lg text-foreground mb-4">Delete Thread?</h2>
          <p className="text-sm text-muted-foreground mb-6">
            This action cannot be undone. The thread and all its replies will be permanently deleted.
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => setShowConfirm(false)}
              className="label-mono flex-1 border border-border px-3 py-2 text-muted-foreground transition-colors hover:border-primary hover:text-primary"
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              disabled={loading}
              className="label-mono flex-1 border border-destructive bg-destructive/10 px-3 py-2 text-destructive transition-colors hover:bg-destructive/20 disabled:opacity-50"
            >
              {loading ? "Deleting…" : "Delete"}
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <button
      onClick={() => setShowConfirm(true)}
      className="flex items-center justify-center rounded p-2 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
      title="Delete thread"
    >
      <Trash2 className="h-4 w-4" />
    </button>
  )
}
