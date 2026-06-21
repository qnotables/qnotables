"use client"

import { useState, useTransition } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ExternalLink, Edit, Trash2, CheckCircle, AlertCircle, ChevronDown, ChevronUp } from "lucide-react"
import { publishScrapedDraft, deleteScrapedDraft } from "@/app/actions/scraper-actions"
import { cn } from "@/lib/utils"

interface DraftPost {
  id: string
  title: string
  slug: string
  excerpt: string | null
  source_name: string | null
  source_url: string | null
  cover_image_url: string | null
  imported_at: string | null
  created_at: string
  status: string
  post_type: string
}

function formatDate(iso: string | null) {
  if (!iso) return "—"
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

function RowActions({ post, onDone }: { post: DraftPost; onDone: () => void }) {
  const [isPending, startTransition] = useTransition()
  const [actionStatus, setActionStatus] = useState<"idle" | "success" | "error">("idle")
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  async function handlePublish() {
    startTransition(async () => {
      try {
        await publishScrapedDraft(post.id)
        setActionStatus("success")
        setTimeout(() => onDone(), 800)
      } catch (err) {
        setActionStatus("error")
        setErrorMsg(err instanceof Error ? err.message : "Failed to publish")
      }
    })
  }

  async function handleDelete() {
    if (!confirm(`Delete draft "${post.title}"? This cannot be undone.`)) return
    startTransition(async () => {
      try {
        await deleteScrapedDraft(post.id)
        onDone()
      } catch (err) {
        setActionStatus("error")
        setErrorMsg(err instanceof Error ? err.message : "Failed to delete")
      }
    })
  }

  if (actionStatus === "success") {
    return (
      <span className="label-mono inline-flex items-center gap-1 text-xs text-green-600">
        <CheckCircle className="h-3 w-3" /> Published
      </span>
    )
  }

  return (
    <div className="flex items-center gap-2">
      {actionStatus === "error" && errorMsg && (
        <span className="label-mono flex items-center gap-1 text-xs text-destructive">
          <AlertCircle className="h-3 w-3" />
          {errorMsg}
        </span>
      )}
      <button
        type="button"
        onClick={handlePublish}
        disabled={isPending}
        className="label-mono inline-flex items-center gap-1 border border-green-600 px-2.5 py-1 text-xs text-green-600 transition-colors hover:bg-green-600 hover:text-white disabled:opacity-50"
      >
        <CheckCircle className="h-3 w-3" />
        Publish
      </button>
      <Link
        href={`/dashboard/archives/${post.id}/edit`}
        className="label-mono inline-flex items-center gap-1 border border-border px-2.5 py-1 text-xs text-muted-foreground transition-colors hover:border-primary hover:text-foreground"
        aria-label={`Edit ${post.title}`}
      >
        <Edit className="h-3 w-3" />
        Edit
      </Link>
      <button
        type="button"
        onClick={handleDelete}
        disabled={isPending}
        className="label-mono inline-flex items-center gap-1 border border-border px-2.5 py-1 text-xs text-muted-foreground transition-colors hover:border-destructive hover:text-destructive disabled:opacity-50"
        aria-label={`Delete ${post.title}`}
      >
        <Trash2 className="h-3 w-3" />
        Delete
      </button>
    </div>
  )
}

export function ScraperDraftsTable({ initialDrafts }: { initialDrafts: DraftPost[] }) {
  const router = useRouter()
  const [drafts, setDrafts] = useState(initialDrafts)
  const [sortField, setSortField] = useState<"imported_at" | "source_name" | "title">("imported_at")
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc")

  function handleDone() {
    router.refresh()
  }

  function toggleSort(field: typeof sortField) {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"))
    } else {
      setSortField(field)
      setSortDir("desc")
    }
  }

  const sorted = [...drafts].sort((a, b) => {
    const aVal = a[sortField] ?? ""
    const bVal = b[sortField] ?? ""
    return sortDir === "asc"
      ? aVal.localeCompare(bVal)
      : bVal.localeCompare(aVal)
  })

  function SortIcon({ field }: { field: typeof sortField }) {
    if (sortField !== field) return <ChevronDown className="h-3 w-3 opacity-30" />
    return sortDir === "asc" ? (
      <ChevronUp className="h-3 w-3" />
    ) : (
      <ChevronDown className="h-3 w-3" />
    )
  }

  if (drafts.length === 0) {
    return (
      <div className="border border-border bg-muted/20 px-6 py-12 text-center">
        <p className="label-mono text-sm text-muted-foreground">No scraped drafts yet.</p>
        <p className="label-mono mt-1 text-xs text-muted-foreground">
          Add sources to <code className="text-foreground">lib/scraper/sources.ts</code> and run the scraper.
        </p>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-border bg-muted/30">
            <th className="label-mono px-4 py-2.5 text-left text-xs font-semibold uppercase text-muted-foreground">
              <button
                type="button"
                onClick={() => toggleSort("title")}
                className="flex items-center gap-1 hover:text-foreground"
              >
                Title <SortIcon field="title" />
              </button>
            </th>
            <th className="label-mono px-4 py-2.5 text-left text-xs font-semibold uppercase text-muted-foreground">
              <button
                type="button"
                onClick={() => toggleSort("source_name")}
                className="flex items-center gap-1 hover:text-foreground"
              >
                Source <SortIcon field="source_name" />
              </button>
            </th>
            <th className="label-mono px-4 py-2.5 text-left text-xs font-semibold uppercase text-muted-foreground">Type</th>
            <th className="label-mono px-4 py-2.5 text-left text-xs font-semibold uppercase text-muted-foreground">
              <button
                type="button"
                onClick={() => toggleSort("imported_at")}
                className="flex items-center gap-1 hover:text-foreground"
              >
                Imported <SortIcon field="imported_at" />
              </button>
            </th>
            <th className="label-mono px-4 py-2.5 text-right text-xs font-semibold uppercase text-muted-foreground">
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((post) => (
            <tr
              key={post.id}
              className="border-b border-border transition-colors hover:bg-muted/20"
            >
              <td className="max-w-xs px-4 py-3">
                <div className="flex items-start gap-2">
                  {post.cover_image_url && (
                    <img
                      src={post.cover_image_url}
                      alt=""
                      className="mt-0.5 h-10 w-10 flex-shrink-0 object-cover"
                      aria-hidden="true"
                    />
                  )}
                  <div>
                    <p className="line-clamp-2 font-medium text-foreground">{post.title}</p>
                    {post.excerpt && (
                      <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">
                        {post.excerpt}
                      </p>
                    )}
                  </div>
                </div>
              </td>
              <td className="px-4 py-3">
                {post.source_name && post.source_url ? (
                  <a
                    href={post.source_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="label-mono inline-flex items-center gap-1 text-xs text-primary hover:underline"
                  >
                    {post.source_name}
                    <ExternalLink className="h-3 w-3" />
                  </a>
                ) : (
                  <span className="label-mono text-xs text-muted-foreground">
                    {post.source_name || "—"}
                  </span>
                )}
              </td>
              <td className="px-4 py-3">
                <span className="label-mono border border-border px-2 py-0.5 text-[10px] uppercase text-muted-foreground">
                  {post.post_type}
                </span>
              </td>
              <td className="whitespace-nowrap px-4 py-3">
                <span className="label-mono text-xs text-muted-foreground">
                  {formatDate(post.imported_at)}
                </span>
              </td>
              <td className="px-4 py-3 text-right">
                <RowActions post={post} onDone={handleDone} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
