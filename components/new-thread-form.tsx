"use client"

import { useEffect, useRef, useState, useTransition } from "react"
import { ChevronDown } from "lucide-react"
import { createThread } from "@/app/forum/actions"
import { TiptapEditor } from "@/components/tiptap-editor"
import { FORUM_CATEGORIES, FORUM_DESKS } from "@/lib/forum-utils"

const TITLE_MAX = 140

export function NewThreadForm() {
  const [error, setError] = useState<string | null>(null)
  const [pendingMsg, setPendingMsg] = useState<string | null>(null)
  const [draftMsg, setDraftMsg] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()
  const [title, setTitle] = useState("")
  const [dirty, setDirty] = useState(false)
  const intentRef = useRef<"publish" | "draft">("publish")

  // Warn on tab close / navigation if the form has unsaved input
  useEffect(() => {
    function handleBeforeUnload(e: BeforeUnloadEvent) {
      if (!dirty) return
      e.preventDefault()
      e.returnValue = ""
    }
    window.addEventListener("beforeunload", handleBeforeUnload)
    return () => window.removeEventListener("beforeunload", handleBeforeUnload)
  }, [dirty])

  function action(formData: FormData) {
    setError(null)
    setPendingMsg(null)
    setDraftMsg(null)
    formData.set("intent", intentRef.current)
    startTransition(async () => {
      const res = await createThread(formData)
      if (res?.error) {
        setError(res.error)
      } else if (res?.pending) {
        setDirty(false)
        setPendingMsg(res.message ?? "Your post is pending review by a moderator.")
      } else if (res?.draft) {
        setDirty(false)
        setDraftMsg(res.message ?? "Draft saved. You can find it and publish it later.")
      }
      // On success (published, no pending/draft), the server action redirects.
    })
  }

  return (
    <form action={action} className="flex flex-col gap-5">
      {/* Title */}
      <div className="flex flex-col gap-2">
        <div className="flex items-baseline justify-between">
          <label htmlFor="title" className="label-mono text-muted-foreground">
            Thread Title <span className="text-destructive">*</span>
          </label>
          <span
            className={`label-mono text-[10px] ${
              title.length > TITLE_MAX - 15 ? "text-amber-400" : "text-muted-foreground/60"
            }`}
          >
            {title.length}/{TITLE_MAX}
          </span>
        </div>
        <input
          id="title"
          name="title"
          required
          maxLength={TITLE_MAX}
          value={title}
          onChange={(e) => {
            setTitle(e.target.value)
            setDirty(true)
          }}
          placeholder="Title"
          className="border border-border bg-background px-4 py-3 text-foreground outline-none transition-colors focus:border-primary"
        />
      </div>

      {/* Desk + Category row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <label htmlFor="desk" className="label-mono text-muted-foreground">
            Desk
          </label>
          <div className="relative">
            <select
              id="desk"
              name="desk"
              defaultValue="other"
              onChange={() => setDirty(true)}
              className="label-mono w-full appearance-none border border-border bg-background py-3 pl-3 pr-8 text-sm text-foreground outline-none transition-colors focus:border-primary"
            >
              {FORUM_DESKS.map((d) => (
                <option key={d.slug} value={d.slug}>
                  {d.label}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="category" className="label-mono text-muted-foreground">
            Category
          </label>
          <div className="relative">
            <select
              id="category"
              name="category"
              defaultValue=""
              onChange={() => setDirty(true)}
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
      </div>

      {/* Tags + Source URL row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
            placeholder="e.g. trump, economy, Q"
            onChange={() => setDirty(true)}
            className="border border-border bg-background px-4 py-3 text-foreground outline-none transition-colors focus:border-primary"
          />
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="source_url" className="label-mono text-muted-foreground">
            Source URL
            <span className="ml-2 normal-case text-muted-foreground/60">(optional)</span>
          </label>
          <input
            id="source_url"
            name="source_url"
            type="url"
            maxLength={2048}
            placeholder="https://example.com/article"
            onChange={() => setDirty(true)}
            className="border border-border bg-background px-4 py-3 text-foreground outline-none transition-colors focus:border-primary"
          />
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-col gap-2">
        <label className="label-mono text-muted-foreground">
          Opening Post <span className="text-destructive">*</span>
          <span className="ml-2 normal-case text-muted-foreground/60">
            (Markdown — bold, images, links, code)
          </span>
        </label>
        <TiptapEditor
          name="body"
          id="body"
          required
          uploadFolder="forum"
          isSignedIn
          onChange={() => setDirty(true)}
          placeholder="Build your opening post with headings, lists, quotes, links, images, video, and approved embeds."
        />
        <input type="hidden" name="content_format" value="tiptap" />
      </div>

      {error ? (
        <p className="label-mono border border-destructive/50 bg-destructive/10 px-4 py-3 text-destructive">
          {error}
        </p>
      ) : null}

      {pendingMsg ? (
        <p className="label-mono border border-amber-500/50 bg-amber-500/10 px-4 py-3 text-amber-400">
          {pendingMsg}
        </p>
      ) : null}

      {draftMsg ? (
        <p className="label-mono border border-primary/40 bg-primary/10 px-4 py-3 text-primary">
          {draftMsg}
        </p>
      ) : null}

      <div className="flex flex-col gap-2 sm:flex-row">
        <button
          type="submit"
          onClick={() => {
            intentRef.current = "draft"
          }}
          disabled={pending || Boolean(pendingMsg) || Boolean(draftMsg)}
          className="label-mono order-2 border border-border py-3 font-semibold text-foreground transition-colors hover:border-primary hover:text-primary disabled:opacity-60 sm:order-1 sm:flex-1"
        >
          {pending && intentRef.current === "draft" ? "Saving…" : "Save Draft"}
        </button>
        <button
          type="submit"
          onClick={() => {
            intentRef.current = "publish"
          }}
          disabled={pending || Boolean(pendingMsg) || Boolean(draftMsg)}
          className="label-mono order-1 bg-primary py-3 font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60 sm:order-2 sm:flex-1"
        >
          {pending && intentRef.current === "publish" ? "Posting…" : "Post Thread"}
        </button>
      </div>
    </form>
  )
}
