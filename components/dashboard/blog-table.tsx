"use client"

import { useMemo, useState, useTransition } from "react"
import Link from "next/link"
import { Pencil, Eye, Trash2, Star, Send, EyeOff, Archive } from "lucide-react"
import type { BlogPost } from "@/lib/blog-posts"
import { StatusBadge, EmptyState, PrimaryButton } from "@/components/dashboard/ui"
import {
  setBlogStatus,
  toggleBlogFeatured,
  deleteBlogPost,
} from "@/app/dashboard/actions"

function formatDate(iso?: string) {
  if (!iso) return "—"
  return new Date(iso).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })
}

export function BlogTable({ posts }: { posts: BlogPost[] }) {
  const [query, setQuery] = useState("")
  const [status, setStatus] = useState("all")
  const [postType, setPostType] = useState("all")
  const [isPending, startTransition] = useTransition()
  const [busyId, setBusyId] = useState<string | null>(null)

  const categories = useMemo(
    () => Array.from(new Set(posts.map((p) => p.category).filter(Boolean))) as string[],
    [posts],
  )
  const [category, setCategory] = useState("all")

  const postTypes = useMemo(
    () => Array.from(new Set(posts.map((p) => p.postType).filter(Boolean))) as string[],
    [posts],
  )

  const filtered = posts.filter((p) => {
    if (query && !p.title.toLowerCase().includes(query.toLowerCase())) return false
    if (status !== "all" && (p.status ?? "draft") !== status) return false
    if (category !== "all" && p.category !== category) return false
    if (postType !== "all" && p.postType !== postType) return false
    return true
  })

  function run(id: string, fn: () => Promise<{ success: boolean; error?: string }>) {
    setBusyId(id)
    startTransition(async () => {
      const res = await fn()
      if (!res.success) alert(res.error ?? "Action failed")
      setBusyId(null)
    })
  }

  const selectClass =
    "label-mono border border-border bg-background px-2 py-2 text-sm text-foreground outline-none focus:border-primary"

  return (
    <div className="flex flex-col gap-4">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search titles..."
          className="label-mono min-w-48 flex-1 border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
        />
        <select value={status} onChange={(e) => setStatus(e.target.value)} className={selectClass}>
          <option value="all">All Status</option>
          <option value="draft">Draft</option>
          <option value="published">Published</option>
          <option value="scheduled">Scheduled</option>
          <option value="hidden">Hidden</option>
          <option value="archived">Archived</option>
        </select>
        <select value={category} onChange={(e) => setCategory(e.target.value)} className={selectClass}>
          <option value="all">All Categories</option>
          {categories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        {postTypes.length > 0 && (
          <select value={postType} onChange={(e) => setPostType(e.target.value)} className={selectClass}>
            <option value="all">All Types</option>
            {postTypes.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        )}
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          title="No posts match"
          description="Adjust your filters or create a new post."
          action={<PrimaryButton href="/dashboard/blog/new">New Post</PrimaryButton>}
        />
      ) : (
        <div className="overflow-x-auto border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th className="label-mono px-3 py-2 text-left text-xs uppercase text-muted-foreground">Title</th>
                <th className="label-mono px-3 py-2 text-left text-xs uppercase text-muted-foreground">Status</th>
                <th className="label-mono px-3 py-2 text-left text-xs uppercase text-muted-foreground">Category</th>
                <th className="label-mono px-3 py-2 text-left text-xs uppercase text-muted-foreground">Published</th>
                <th className="label-mono px-3 py-2 text-right text-xs uppercase text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((post) => {
                const busy = busyId === post.id && isPending
                const isPublished = (post.status ?? "draft") === "published"
                return (
                  <tr key={post.id} className="border-b border-border hover:bg-muted/20">
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-2">
                        {post.featured ? <Star className="h-3.5 w-3.5 fill-primary text-primary" /> : null}
                        <Link href={`/blog/${post.slug}`} className="font-semibold text-foreground hover:text-primary">
                          {post.title}
                        </Link>
                      </div>
                      <p className="label-mono text-[11px] text-muted-foreground">{post.author}</p>
                    </td>
                    <td className="px-3 py-2">
                      <StatusBadge status={post.status ?? "draft"} />
                    </td>
                    <td className="px-3 py-2 text-muted-foreground">{post.category || "—"}</td>
                    <td className="px-3 py-2 text-muted-foreground">{formatDate(post.publishedAt)}</td>
                    <td className="px-3 py-2">
                      <div className="flex items-center justify-end gap-1">
                        <Link
                          href={`/dashboard/blog/${post.id}/edit`}
                          title="Edit"
                          className="p-1.5 text-muted-foreground hover:text-foreground"
                        >
                          <Pencil className="h-4 w-4" />
                        </Link>
                        <Link
                          href={`/blog/${post.slug}`}
                          title="Preview"
                          className="p-1.5 text-muted-foreground hover:text-foreground"
                        >
                          <Eye className="h-4 w-4" />
                        </Link>
                        <button
                          type="button"
                          disabled={busy}
                          title={isPublished ? "Unpublish" : "Publish"}
                          onClick={() =>
                            run(post.id!, () => setBlogStatus(post.id!, isPublished ? "draft" : "published"))
                          }
                          className="p-1.5 text-muted-foreground hover:text-primary disabled:opacity-40"
                        >
                          {isPublished ? <EyeOff className="h-4 w-4" /> : <Send className="h-4 w-4" />}
                        </button>
                        <button
                          type="button"
                          disabled={busy}
                          title="Toggle featured"
                          onClick={() => run(post.id!, () => toggleBlogFeatured(post.id!, !post.featured))}
                          className="p-1.5 text-muted-foreground hover:text-primary disabled:opacity-40"
                        >
                          <Star className={`h-4 w-4 ${post.featured ? "fill-primary text-primary" : ""}`} />
                        </button>
                        <button
                          type="button"
                          disabled={busy}
                          title="Archive"
                          onClick={() => run(post.id!, () => setBlogStatus(post.id!, "archived"))}
                          className="p-1.5 text-muted-foreground hover:text-foreground disabled:opacity-40"
                        >
                          <Archive className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          disabled={busy}
                          title="Delete"
                          onClick={() => {
                            if (confirm(`Delete "${post.title}"? This cannot be undone.`))
                              run(post.id!, () => deleteBlogPost(post.id!))
                          }}
                          className="p-1.5 text-muted-foreground hover:text-destructive disabled:opacity-40"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
