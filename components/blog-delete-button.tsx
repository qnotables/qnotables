"use client"

import { Trash2 } from "lucide-react"
import { deletePost } from "@/app/blog/actions"

export function BlogDeleteButton({ id, title }: { id: string; title: string }) {
  return (
    <form
      action={deletePost}
      onSubmit={(e) => {
        if (!confirm(`Delete "${title}"? This cannot be undone.`)) {
          e.preventDefault()
        }
      }}
    >
      <input type="hidden" name="id" value={id} />
      <button
        type="submit"
        title="Delete post"
        className="flex items-center gap-1 border border-border px-2.5 py-1.5 text-muted-foreground transition-colors hover:border-destructive hover:text-destructive"
      >
        <Trash2 className="h-3.5 w-3.5" />
        <span className="label-mono">Delete</span>
      </button>
    </form>
  )
}
