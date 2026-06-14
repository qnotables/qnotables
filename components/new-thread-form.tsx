"use client"

import { useState, useTransition } from "react"
import { createThread } from "@/app/forum/actions"

export function NewThreadForm() {
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  function action(formData: FormData) {
    setError(null)
    startTransition(async () => {
      const res = await createThread(formData)
      if (res?.error) setError(res.error)
    })
  }

  return (
    <form action={action} className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <label htmlFor="title" className="label-mono text-muted-foreground">
          Thread Title
        </label>
        <input
          id="title"
          name="title"
          required
          maxLength={140}
          placeholder="What's the dispatch?"
          className="border border-border bg-background px-4 py-3 text-foreground outline-none transition-colors focus:border-primary"
        />
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="body" className="label-mono text-muted-foreground">
          Opening Post
        </label>
        <textarea
          id="body"
          name="body"
          required
          rows={8}
          placeholder="Lay out the claim. Bring a source if you have one."
          className="resize-y border border-border bg-background px-4 py-3 text-foreground outline-none transition-colors focus:border-primary"
        />
      </div>

      {error ? (
        <p className="label-mono border border-destructive/50 bg-destructive/10 px-4 py-3 text-destructive">
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="label-mono w-full bg-primary py-3 font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
      >
        {pending ? "Posting..." : "Post Thread"}
      </button>
    </form>
  )
}
