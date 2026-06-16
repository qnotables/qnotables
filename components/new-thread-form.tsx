"use client"

import { useState, useTransition } from "react"
import { ChevronDown } from "lucide-react"
import { createThread } from "@/app/forum/actions"
import { MarkdownEditor } from "@/components/markdown-editor"
import { FORUM_CATEGORIES } from "@/lib/forum-utils"

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
      {/* Title */}
      <div className="flex flex-col gap-2">
        <label htmlFor="title" className="label-mono text-muted-foreground">
          Thread Title <span className="text-destructive">*</span>
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

      {/* Category + Tags row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <label htmlFor="category" className="label-mono text-muted-foreground">
            Category
          </label>
          <div className="relative">
            <select
              id="category"
              name="category"
              defaultValue=""
              className="label-mono w-full appearance-none border border-border bg-background py-3 pl-3 pr-8 text-sm text-foreground outline-none transition-colors focus:border-primary"
            >
              <option value="">-- Select category --</option>
              {FORUM_CATEGORIES.map((c) => (
                <option key={c.slug} value={c.slug}>
                  {c.name}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="tags" className="label-mono text-muted-foreground">
            Tags
            <span className="ml-2 normal-case text-muted-foreground/60">
              (comma-separated, max 8)
            </span>
          </label>
          <input
            id="tags"
            name="tags"
            maxLength={200}
            placeholder="e.g. trump, economy, 2024"
            className="border border-border bg-background px-4 py-3 text-foreground outline-none transition-colors focus:border-primary"
          />
        </div>
      </div>

      {/* Source URL */}
      <div className="flex flex-col gap-2">
        <label htmlFor="source_url" className="label-mono text-muted-foreground">
          Source URL
          <span className="ml-2 normal-case text-muted-foreground/60">
            (optional — original article, post, or document)
          </span>
        </label>
        <input
          id="source_url"
          name="source_url"
          type="url"
          maxLength={2048}
          placeholder="https://example.com/article"
          className="border border-border bg-background px-4 py-3 text-foreground outline-none transition-colors focus:border-primary"
        />
      </div>

      {/* Body */}
      <div className="flex flex-col gap-2">
        <label className="label-mono text-muted-foreground">
          Opening Post <span className="text-destructive">*</span>
          <span className="ml-2 normal-case text-muted-foreground/60">
            (Markdown — bold, images, links, code)
          </span>
        </label>
        <MarkdownEditor
          name="body"
          id="body"
          required
          rows={10}
          isSignedIn
          placeholder={
            "Lay out the claim. Bring a source if you have one.\n\nTip: paste an image directly into this box to upload it."
          }
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
