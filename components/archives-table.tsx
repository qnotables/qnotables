"use client"

import { useState } from "react"
import Link from "next/link"
import { Trash2, Edit2, Eye } from "lucide-react"
import { deletePost } from "@/app/actions/import-posts"

interface PostRow {
  id: string
  slug: string
  title: string
  published_at?: string
  status?: string
  published?: boolean
  tag?: string
  category?: string
  author_name?: string
}

export function ArchivesTable({ initialPosts }: { initialPosts: PostRow[] }) {
  const [posts, setPosts] = useState(initialPosts)
  const [loading, setLoading] = useState<string | null>(null)

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this post? This cannot be undone.")) return

    setLoading(id)
    try {
      const res = await deletePost(id)
      if (res.success) {
        setPosts(posts.filter((p) => p.id !== id))
      } else {
        alert(`Error: ${res.error}`)
      }
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-border bg-card">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-muted/50">
            <th className="px-4 py-3 text-left font-medium">Title</th>
            <th className="px-4 py-3 text-left font-medium">Slug</th>
            <th className="px-4 py-3 text-left font-medium">Category</th>
            <th className="px-4 py-3 text-left font-medium">Published</th>
            <th className="px-4 py-3 text-left font-medium">Actions</th>
          </tr>
        </thead>
        <tbody>
          {posts.map((post) => (
            <tr key={post.id} className="border-b border-border hover:bg-muted/30 transition-colors">
              <td className="px-4 py-3">
                <p className="font-medium line-clamp-1">{post.title}</p>
                <p className="text-xs text-muted-foreground">{post.author_name}</p>
              </td>
              <td className="px-4 py-3">
                <code className="text-xs bg-muted px-2 py-1 rounded">{post.slug}</code>
              </td>
              <td className="px-4 py-3">
                <span className="label-mono text-xs">{post.tag || "—"}</span>
              </td>
              <td className="px-4 py-3">
                {post.published_at ? (
                  <span className="text-xs">
                    {new Date(post.published_at).toLocaleDateString()}
                  </span>
                ) : (
                  <span className="text-xs text-muted-foreground">—</span>
                )}
              </td>
              <td className="px-4 py-3">
                <div className="flex gap-1">
                  <Link
                    href={`/archives/${post.slug}`}
                    target="_blank"
                    className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded border border-border hover:bg-muted transition-colors"
                    title="View post"
                  >
                    <Eye className="h-3 w-3" />
                  </Link>
                  <Link
                    href={`/blog/admin/${post.id}`}
                    className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded border border-border hover:bg-muted transition-colors"
                    title="Edit post"
                  >
                    <Edit2 className="h-3 w-3" />
                  </Link>
                  <button
                    onClick={() => handleDelete(post.id)}
                    disabled={loading === post.id}
                    className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded border border-destructive/30 hover:bg-destructive/10 transition-colors disabled:opacity-50"
                    title="Delete post"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {posts.length === 0 && (
        <div className="px-4 py-8 text-center text-muted-foreground">
          No posts found. <Link href="/dashboard/import" className="text-primary hover:underline">Import some posts</Link>
        </div>
      )}
    </div>
  )
}
