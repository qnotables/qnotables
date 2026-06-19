"use client"

import { useState } from "react"
import Link from "next/link"
import { Clock, Pencil, Trash2, X, Loader2, Pin, Lock, Star, Eye, EyeOff } from "lucide-react"
import { updateThread, deleteThread } from "@/app/forum/actions"
import { moderateThread } from "@/app/dashboard/actions"
import { timeAgo } from "@/lib/time"
import { Markdown } from "@/components/markdown"
import { MarkdownEditor } from "@/components/markdown-editor"
import { ShareButtons } from "@/components/share-buttons"
import { FORUM_CATEGORIES, normalizeCategoryName, preprocessBody } from "@/lib/forum-utils"

interface ThreadArticleProps {
  id: string
  title: string
  body: string
  createdAt: string
  authorId: string | null
  authorName: string
  isOwner: boolean
  isAdmin: boolean
  category: string | null
  tags: string | null
  is_pinned: boolean
  is_locked: boolean
  is_featured: boolean
  is_soft_deleted: boolean
}

function CategoryBadge({ category }: { category: string | null }) {
  if (!category) return null
  const label = normalizeCategoryName(category) ?? category
  return (
    <span className="label-mono border border-primary/40 bg-primary/10 px-2 py-0.5 text-[10px] text-primary">
      {label.toUpperCase()}
    </span>
  )
}

function StatusBadges({
  is_pinned,
  is_locked,
  is_featured,
}: {
  is_pinned: boolean
  is_locked: boolean
  is_featured: boolean
}) {
  return (
    <>
      {is_pinned && (
        <span className="label-mono flex items-center gap-1 border border-primary/40 bg-primary/10 px-2 py-0.5 text-[10px] text-primary">
          <Pin className="h-2.5 w-2.5" /> PINNED
        </span>
      )}
      {is_featured && (
        <span className="label-mono flex items-center gap-1 border border-amber-500/40 bg-amber-500/10 px-2 py-0.5 text-[10px] text-amber-400">
          <Star className="h-2.5 w-2.5" /> FEATURED
        </span>
      )}
      {is_locked && (
        <span className="label-mono flex items-center gap-1 border border-border bg-muted/40 px-2 py-0.5 text-[10px] text-muted-foreground">
          <Lock className="h-2.5 w-2.5" /> LOCKED
        </span>
      )}
    </>
  )
}

export function ThreadArticle({
  id,
  title,
  body,
  createdAt,
  authorId,
  authorName,
  isOwner,
  isAdmin,
  category,
  tags,
  is_pinned,
  is_locked,
  is_featured,
  is_soft_deleted,
}: ThreadArticleProps) {
  const [editing, setEditing] = useState(false)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Local mod state mirrors
  const [localPinned, setLocalPinned] = useState(is_pinned)
  const [localLocked, setLocalLocked] = useState(is_locked)
  const [localFeatured, setLocalFeatured] = useState(is_featured)
  const [localHidden, setLocalHidden] = useState(is_soft_deleted)
  const [modBusy, setModBusy] = useState(false)

  const tagList = tags ? tags.split(/[,\s]+/).filter(Boolean).slice(0, 8) : []
  const categoryName = normalizeCategoryName(category)

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
    if (!confirm("Delete this thread and all its replies? This cannot be undone.")) return
    setPending(true)
    await deleteThread(formData)
    setPending(false)
  }

  async function modToggle(
    field: "is_pinned" | "is_locked" | "is_featured" | "is_soft_deleted",
    current: boolean,
    setter: (v: boolean) => void,
  ) {
    setModBusy(true)
    const res = await moderateThread(id, field, !current)
    if (res.success) setter(!current)
    setModBusy(false)
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
            <label htmlFor="edit-category" className="label-mono text-muted-foreground">
              Category
            </label>
            <select
              id="edit-category"
              name="category"
              defaultValue={category ?? ""}
              className="border border-border bg-background px-3 py-2 text-foreground outline-none focus:border-primary"
            >
              <option value="">-- No category --</option>
              {FORUM_CATEGORIES.map((c) => (
                <option key={c.slug} value={c.slug}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="edit-tags" className="label-mono text-muted-foreground">
              Tags
              <span className="ml-2 normal-case text-muted-foreground/60">(comma-separated)</span>
            </label>
            <input
              id="edit-tags"
              name="tags"
              defaultValue={tags ?? ""}
              placeholder="e.g. trump, economy, 2024"
              className="border border-border bg-background px-3 py-2 text-foreground outline-none focus:border-primary"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="edit-body" className="label-mono text-muted-foreground">
              Body
            </label>
            <MarkdownEditor id="edit-body" name="body" defaultValue={body} required rows={8} />
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
      {/* Status badges */}
      {(localPinned || localFeatured || localLocked || categoryName) && (
        <div className="mb-3 flex flex-wrap items-center gap-1.5">
          <StatusBadges is_pinned={localPinned} is_locked={localLocked} is_featured={localFeatured} />
          <CategoryBadge category={categoryName} />
        </div>
      )}

      <h1 className="stencil text-balance text-2xl leading-tight text-foreground md:text-3xl">
        {title}
      </h1>

      {/* Tags */}
      {tagList.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {tagList.map((tag) => (
            <span
              key={tag}
              className="label-mono border border-border px-1.5 py-0.5 text-[10px] text-muted-foreground"
            >
              #{tag}
            </span>
          ))}
        </div>
      )}

      {/* Meta row */}
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

        {/* Owner controls */}
        {isOwner && (
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
        )}
      </div>

      {/* Body */}
      <div className="mt-5">
        <Markdown content={preprocessBody(body)} />
      </div>

      {/* Footer: share + mod controls */}
      <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
        <ShareButtons
          title={title}
          url={typeof window !== "undefined" ? `${window.location.origin}/forum/${id}` : `/forum/${id}`}
        />

        {/* Admin / mod controls */}
        {isAdmin && (
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="label-mono text-[10px] text-muted-foreground">MOD:</span>
            <button
              type="button"
              disabled={modBusy}
              onClick={() => modToggle("is_pinned", localPinned, setLocalPinned)}
              title={localPinned ? "Unpin" : "Pin"}
              className={`flex items-center gap-1 border px-2 py-1 text-[11px] transition-colors disabled:opacity-50 ${
                localPinned
                  ? "border-primary text-primary"
                  : "border-border text-muted-foreground hover:border-primary hover:text-primary"
              }`}
            >
              <Pin className="h-3 w-3" /> {localPinned ? "Pinned" : "Pin"}
            </button>
            <button
              type="button"
              disabled={modBusy}
              onClick={() => modToggle("is_locked", localLocked, setLocalLocked)}
              title={localLocked ? "Unlock" : "Lock"}
              className={`flex items-center gap-1 border px-2 py-1 text-[11px] transition-colors disabled:opacity-50 ${
                localLocked
                  ? "border-primary text-primary"
                  : "border-border text-muted-foreground hover:border-primary hover:text-primary"
              }`}
            >
              <Lock className="h-3 w-3" /> {localLocked ? "Locked" : "Lock"}
            </button>
            <button
              type="button"
              disabled={modBusy}
              onClick={() => modToggle("is_featured", localFeatured, setLocalFeatured)}
              title={localFeatured ? "Unfeature" : "Feature"}
              className={`flex items-center gap-1 border px-2 py-1 text-[11px] transition-colors disabled:opacity-50 ${
                localFeatured
                  ? "border-amber-500 text-amber-400"
                  : "border-border text-muted-foreground hover:border-amber-500 hover:text-amber-400"
              }`}
            >
              <Star className="h-3 w-3" /> {localFeatured ? "Featured" : "Feature"}
            </button>
            <button
              type="button"
              disabled={modBusy}
              onClick={() => modToggle("is_soft_deleted", localHidden, setLocalHidden)}
              title={localHidden ? "Restore" : "Hide"}
              className={`flex items-center gap-1 border px-2 py-1 text-[11px] transition-colors disabled:opacity-50 ${
                localHidden
                  ? "border-destructive text-destructive"
                  : "border-border text-muted-foreground hover:border-destructive hover:text-destructive"
              }`}
            >
              {localHidden ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
              {localHidden ? "Restore" : "Hide"}
            </button>
          </div>
        )}
      </div>
    </article>
  )
}
