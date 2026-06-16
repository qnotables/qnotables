"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import { Edit, Trash2, Eye, Copy, Star, Archive as ArchiveIcon, MoreVertical } from "lucide-react"
import { ArchivePost } from "@/lib/archive"

interface ArchivesTableProps {
  initialPosts: ArchivePost[]
}

export function ArchivesTable({ initialPosts }: ArchivesTableProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("")
  const [typeFilter, setTypeFilter] = useState<string>("")
  const [selectedPosts, setSelectedPosts] = useState<string[]>([])
  const [sortField, setSortField] = useState<"title" | "published_at" | "status">("published_at")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc")

  // Filter and search
  const filtered = useMemo(() => {
    return initialPosts
      .filter(post => {
        if (searchQuery && !post.title.toLowerCase().includes(searchQuery.toLowerCase())) return false
        if (statusFilter && post.status !== statusFilter) return false
        if (typeFilter && post.post_type !== typeFilter) return false
        return true
      })
      .sort((a, b) => {
        let aVal: any = a[sortField]
        let bVal: any = b[sortField]
        if (sortField === "published_at") {
          aVal = new Date(aVal || 0).getTime()
          bVal = new Date(bVal || 0).getTime()
        }
        return sortDirection === "asc" ? (aVal > bVal ? 1 : -1) : aVal < bVal ? 1 : -1
      })
  }, [initialPosts, searchQuery, statusFilter, typeFilter, sortField, sortDirection])

  const allTypes = [...new Set(initialPosts.map(p => p.post_type))]
  const selectedCount = selectedPosts.length

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="space-y-4 border border-border bg-muted/30 p-4">
        <div className="grid gap-4 md:grid-cols-4">
          <div>
            <label className="label-mono mb-2 block text-xs font-semibold text-muted-foreground">Search</label>
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search by title..."
              className="w-full px-3 py-2 border border-border bg-background text-sm"
            />
          </div>

          <div>
            <label className="label-mono mb-2 block text-xs font-semibold text-muted-foreground">Status</label>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-border bg-background text-sm"
            >
              <option value="">All Statuses</option>
              <option value="published">Published</option>
              <option value="draft">Draft</option>
              <option value="scheduled">Scheduled</option>
              <option value="hidden">Hidden</option>
              <option value="archived">Archived</option>
            </select>
          </div>

          <div>
            <label className="label-mono mb-2 block text-xs font-semibold text-muted-foreground">Type</label>
            <select
              value={typeFilter}
              onChange={e => setTypeFilter(e.target.value)}
              className="w-full px-3 py-2 border border-border bg-background text-sm"
            >
              <option value="">All Types</option>
              {allTypes.map(type => (
                <option key={type} value={type || "unknown"}>
                  {type || "Untyped"}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="label-mono mb-2 block text-xs font-semibold text-muted-foreground">Sort</label>
            <select
              value={sortField}
              onChange={e => setSortField(e.target.value as any)}
              className="w-full px-3 py-2 border border-border bg-background text-sm"
            >
              <option value="published_at">By Date</option>
              <option value="title">By Title</option>
              <option value="status">By Status</option>
            </select>
          </div>
        </div>

        {selectedCount > 0 && (
          <div className="flex items-center justify-between rounded border border-primary/30 bg-primary/5 p-3">
            <p className="label-mono text-sm font-semibold text-primary">{selectedCount} selected</p>
            <div className="flex gap-2">
              <button className="px-3 py-1 text-sm bg-primary/20 text-primary hover:bg-primary/30">
                Publish Selected
              </button>
              <button className="px-3 py-1 text-sm bg-red-500/20 text-red-500 hover:bg-red-500/30">
                Delete Selected
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="overflow-x-auto border border-border">
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-muted/50">
            <tr>
              <th className="px-4 py-3 text-left">
                <input
                  type="checkbox"
                  checked={selectedCount > 0 && selectedCount === filtered.length}
                  onChange={e =>
                    setSelectedPosts(e.target.checked ? filtered.map(p => p.id) : [])
                  }
                  className="h-4 w-4"
                />
              </th>
              <th className="px-4 py-3 text-left font-semibold text-foreground cursor-pointer hover:text-primary">
                Title
              </th>
              <th className="px-4 py-3 text-left font-semibold text-foreground">Type</th>
              <th className="px-4 py-3 text-left font-semibold text-foreground">Status</th>
              <th className="px-4 py-3 text-left font-semibold text-foreground">Category</th>
              <th className="px-4 py-3 text-left font-semibold text-foreground">Published</th>
              <th className="px-4 py-3 text-left font-semibold text-foreground">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                  No archives found matching your filters.
                </td>
              </tr>
            ) : (
              filtered.map(post => (
                <tr key={post.id} className="border-b border-border hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selectedPosts.includes(post.id)}
                      onChange={e =>
                        setSelectedPosts(e.target.checked ? [...selectedPosts, post.id] : selectedPosts.filter(id => id !== post.id))
                      }
                      className="h-4 w-4"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {post.featured && <Star className="h-4 w-4 text-primary" />}
                      <div>
                        <p className="font-semibold text-foreground">{post.title}</p>
                        <p className="label-mono text-xs text-muted-foreground">/{post.slug}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="label-mono inline-block bg-muted px-2 py-1 text-xs font-semibold text-foreground">
                      {post.post_type || "—"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`label-mono inline-block px-2 py-1 text-xs font-semibold ${
                        post.status === "published"
                          ? "bg-green-500/20 text-green-500"
                          : post.status === "draft"
                          ? "bg-yellow-500/20 text-yellow-500"
                          : post.status === "scheduled"
                          ? "bg-blue-500/20 text-blue-500"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {post.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-muted-foreground">{post.category || "—"}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="label-mono text-xs text-muted-foreground">
                      {post.published_at ? new Date(post.published_at).toLocaleDateString() : "—"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <Link
                        href={`/dashboard/archives/${post.id}/edit`}
                        className="p-1 text-muted-foreground hover:text-foreground transition-colors"
                        title="Edit"
                      >
                        <Edit className="h-4 w-4" />
                      </Link>
                      <button
                        className="p-1 text-muted-foreground hover:text-foreground transition-colors"
                        title="View"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        className="p-1 text-muted-foreground hover:text-foreground transition-colors"
                        title="Duplicate"
                      >
                        <Copy className="h-4 w-4" />
                      </button>
                      <button
                        className="p-1 text-muted-foreground hover:text-red-500 transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Results info */}
      <div className="flex items-center justify-between border border-border bg-muted/30 p-4">
        <p className="label-mono text-sm text-muted-foreground">
          Showing {filtered.length} of {initialPosts.length} archive items
        </p>
      </div>
    </div>
  )
}
