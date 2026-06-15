"use client"

import { useActionState, useRef, useState } from "react"
import { useFormStatus } from "react-dom"
import { useRouter } from "next/navigation"
import { ImagePlus, Loader2, Save, X } from "lucide-react"
import { MarkdownEditor } from "@/components/markdown-editor"
import { TextStats } from "@/components/text-stats"
import { SeoField } from "@/components/seo-field"
import { createPostDashboard, updatePostDashboard } from "@/app/dashboard/blog/blog-form-actions"
import type { BlogPost } from "@/lib/blog-posts"

type Tab = "info" | "content" | "publish" | "seo" | "advanced"

function SubmitButton({ isEdit }: { isEdit: boolean }) {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className="label-mono inline-flex items-center gap-2 bg-primary px-5 py-2.5 font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
    >
      {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
      {pending ? "Saving…" : isEdit ? "Update Post" : "Create Post"}
    </button>
  )
}

function ImageField({
  name,
  label,
  defaultUrl,
  accept = "image/*",
  uploadFolder = "blog",
}: {
  name: string
  label: string
  defaultUrl?: string | null
  accept?: string
  uploadFolder?: string
}) {
  const [url, setUrl] = useState<string>(defaultUrl ?? "")
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  async function upload(file: File) {
    setError(null)
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append("file", file)
      fd.append("folder", uploadFolder)
      const res = await fetch("/api/dashboard/upload", { method: "POST", body: fd })
      const json = await res.json()
      if (!res.ok || json.error) throw new Error(json.error ?? "Upload failed")
      setUrl(json.url)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed")
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <label className="label-mono text-sm font-semibold text-foreground">{label}</label>
      <input type="hidden" name={name} value={url} />
      {url ? (
        <div className="relative w-full max-w-sm overflow-hidden border border-border">
          <img src={url || "/placeholder.svg"} alt="Preview" className="h-40 w-full object-cover" />
          <button
            type="button"
            onClick={() => setUrl("")}
            className="absolute right-2 top-2 inline-flex items-center gap-1 border border-border bg-background/90 px-2 py-1 text-xs text-foreground transition-colors hover:border-primary"
          >
            <X className="h-3 w-3" /> Remove
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="label-mono flex h-24 w-full flex-col items-center justify-center gap-2 border border-dashed border-border text-muted-foreground transition-colors hover:border-primary hover:text-foreground disabled:opacity-50"
          >
            {uploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <ImagePlus className="h-5 w-5" />}
            {uploading ? "Uploading…" : "Upload"}
          </button>
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="…or paste URL"
            className="label-mono w-full border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
          />
        </div>
      )}
      {error && <p className="label-mono text-xs text-destructive">{error}</p>}
    </div>
  )
}

export function DashboardBlogForm({ post }: { post?: BlogPost }) {
  const isEdit = !!post?.id
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<Tab>("info")
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [bodyLength, setBodyLength] = useState(post?.content?.length ?? 0)
  const [state, formAction] = useActionState(
    isEdit ? updatePostDashboard : createPostDashboard,
    { error: null },
  )

  // On success, redirect to blog dashboard
  if (state.success) {
    router.push("/dashboard/blog")
  }

  const tabs: { id: Tab; label: string; icon?: string }[] = [
    { id: "info", label: "Basic Info" },
    { id: "content", label: "Content" },
    { id: "publish", label: "Publish" },
    { id: "seo", label: "SEO" },
    { id: "advanced", label: "Advanced" },
  ]

  return (
    <form action={formAction} className="mx-auto max-w-4xl">
      {isEdit && <input type="hidden" name="id" value={post!.id} />}

      {/* Sticky header with tabs and submit */}
      <div className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur">
        <div className="flex flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`label-mono px-3 py-1.5 text-sm transition-colors ${
                  activeTab === tab.id
                    ? "border-b-2 border-primary text-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <SubmitButton isEdit={isEdit} />
        </div>
      </div>

      {state.error && (
        <div className="mb-4 border border-destructive bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {state.error}
        </div>
      )}

      <div className="space-y-8 px-4 py-6">
        {/* BASIC INFO TAB */}
        {activeTab === "info" && (
          <div className="space-y-6">
            <div>
              <label className="label-mono block text-sm font-semibold text-foreground">Title *</label>
              <input
                type="text"
                name="title"
                defaultValue={post?.title ?? ""}
                required
                placeholder="e.g., Breaking News: Global Market Shifts"
                className="label-mono mt-2 w-full border border-border bg-background px-4 py-2.5 text-foreground outline-none focus:border-primary"
              />
            </div>

            <div>
              <label className="label-mono block text-sm font-semibold text-foreground">Subtitle</label>
              <input
                type="text"
                name="subtitle"
                defaultValue={post?.subtitle ?? ""}
                placeholder="Secondary headline (optional)"
                className="label-mono mt-2 w-full border border-border bg-background px-4 py-2.5 text-foreground outline-none focus:border-primary"
              />
            </div>

            <div>
              <label className="label-mono block text-sm font-semibold text-foreground">Excerpt *</label>
              <textarea
                name="excerpt"
                defaultValue={post?.excerpt ?? ""}
                required
                placeholder="Summary for archives and feeds (60-160 chars recommended)"
                className="label-mono mt-2 w-full border border-border bg-background px-4 py-2.5 text-foreground outline-none focus:border-primary"
                rows={3}
              />
            </div>

            <div>
              <label className="label-mono block text-sm font-semibold text-foreground">URL Slug</label>
              <input
                type="text"
                name="slug"
                defaultValue={post?.slug ?? ""}
                placeholder="Leave empty to auto-generate from title"
                className="label-mono mt-2 w-full border border-border bg-background px-4 py-2.5 text-foreground outline-none focus:border-primary"
              />
              <p className="label-mono mt-1 text-xs text-muted-foreground">
                Auto-generated from title if blank. Lowercase, hyphens only.
              </p>
            </div>

            <ImageField name="cover_image" label="Cover Image" defaultUrl={post?.coverImage} uploadFolder="blog" />
          </div>
        )}

        {/* CONTENT TAB */}
        {activeTab === "content" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="label-mono font-semibold text-foreground">Body *</h3>
              <TextStats text={post?.content ?? ""} showTime />
            </div>
            <MarkdownEditor
              name="body"
              defaultValue={post?.content ?? ""}
              rows={24}
              required
              uploadFolder="blog"
              placeholder="Write your post in Markdown. Supports **bold**, *italic*, [links](url), etc."
            />
          </div>
        )}

        {/* PUBLISH TAB */}
        {activeTab === "publish" && (
          <div className="space-y-6">
            <div>
              <label className="label-mono block text-sm font-semibold text-foreground">Status</label>
              <select
                name="status"
                defaultValue={post?.status ?? "draft"}
                className="label-mono mt-2 w-full border border-border bg-background px-4 py-2.5 text-foreground outline-none focus:border-primary"
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="archived">Archived</option>
              </select>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  name="featured"
                  defaultChecked={post?.featured ?? false}
                  className="h-4 w-4 border border-border bg-background"
                />
                <span className="label-mono text-sm text-foreground">Featured Post</span>
              </label>

              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  name="show_title"
                  defaultChecked={post?.showTitle === true}
                  className="h-4 w-4 border border-border bg-background"
                />
                <span className="label-mono text-sm text-foreground">Show Title in Display</span>
              </label>
            </div>

            <div>
              <label className="label-mono block text-sm font-semibold text-foreground">Priority</label>
              <select
                name="priority"
                defaultValue={post?.priority ?? "medium"}
                className="label-mono mt-2 w-full border border-border bg-background px-4 py-2.5 text-foreground outline-none focus:border-primary"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>

            <div>
              <label className="label-mono block text-sm font-semibold text-foreground">Episode Date</label>
              <input
                type="date"
                name="episode_date"
                defaultValue={post?.episodeDate ? new Date(post.episodeDate).toISOString().split("T")[0] : ""}
                className="label-mono mt-2 w-full border border-border bg-background px-4 py-2.5 text-foreground outline-none focus:border-primary"
              />
              <p className="label-mono mt-1 text-xs text-muted-foreground">For podcast/show episodes</p>
            </div>
          </div>
        )}

        {/* SEO TAB */}
        {activeTab === "seo" && (
          <div className="space-y-6">
            <div>
              <label className="label-mono block text-sm font-semibold text-foreground">SEO Title</label>
              <input
                type="text"
                name="seo_title"
                defaultValue={post?.seoTitle ?? ""}
                placeholder="50-60 chars (leave empty to use main title)"
                maxLength={60}
                className="label-mono mt-2 w-full border border-border bg-background px-4 py-2.5 text-foreground outline-none focus:border-primary"
              />
            </div>

            <div>
              <label className="label-mono block text-sm font-semibold text-foreground">SEO Description</label>
              <textarea
                name="seo_description"
                defaultValue={post?.seoDescription ?? ""}
                placeholder="155-160 chars (meta description)"
                maxLength={160}
                className="label-mono mt-2 w-full border border-border bg-background px-4 py-2.5 text-foreground outline-none focus:border-primary"
                rows={3}
              />
            </div>

            <ImageField
              name="og_image_url"
              label="Open Graph Image"
              defaultUrl={post?.ogImageUrl}
              accept="image/*"
              uploadFolder="og"
            />
          </div>
        )}

        {/* ADVANCED TAB */}
        {activeTab === "advanced" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="label-mono block text-sm font-semibold text-foreground">Tag</label>
                <input
                  type="text"
                  name="tag"
                  defaultValue={post?.tag ?? "Field Notes"}
                  placeholder="e.g., Breaking News"
                  className="label-mono mt-2 w-full border border-border bg-background px-4 py-2.5 text-foreground outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="label-mono block text-sm font-semibold text-foreground">Category</label>
                <input
                  type="text"
                  name="category"
                  defaultValue={post?.category ?? ""}
                  placeholder="e.g., Markets, Politics"
                  className="label-mono mt-2 w-full border border-border bg-background px-4 py-2.5 text-foreground outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="label-mono block text-sm font-semibold text-foreground">Post Type</label>
                <select
                  name="post_type"
                  defaultValue={post?.postType ?? ""}
                  className="label-mono mt-2 w-full border border-border bg-background px-4 py-2.5 text-foreground outline-none focus:border-primary"
                >
                  <option value="">Select type</option>
                  <option value="article">Article</option>
                  <option value="dispatch">Dispatch</option>
                  <option value="episode">Episode</option>
                  <option value="analysis">Analysis</option>
                </select>
              </div>

              <div>
                <label className="label-mono block text-sm font-semibold text-foreground">Author Name</label>
                <input
                  type="text"
                  name="author_name"
                  defaultValue={post?.authorName ?? "Editorial Desk"}
                  placeholder="Author name"
                  className="label-mono mt-2 w-full border border-border bg-background px-4 py-2.5 text-foreground outline-none focus:border-primary"
                />
              </div>
            </div>

            <div className="border-t border-border pt-4">
              <h4 className="label-mono mb-4 font-semibold text-foreground">Source Information</h4>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="label-mono block text-sm font-semibold text-foreground">Source Name</label>
                  <input
                    type="text"
                    name="source_name"
                    defaultValue={post?.sourceName ?? ""}
                    placeholder="Original source"
                    className="label-mono mt-2 w-full border border-border bg-background px-4 py-2.5 text-foreground outline-none focus:border-primary"
                  />
                </div>

                <div>
                  <label className="label-mono block text-sm font-semibold text-foreground">Source URL</label>
                  <input
                    type="url"
                    name="source_url"
                    defaultValue={post?.sourceUrl ?? ""}
                    placeholder="https://example.com"
                    className="label-mono mt-2 w-full border border-border bg-background px-4 py-2.5 text-foreground outline-none focus:border-primary"
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer with submit button */}
      <div className="border-t border-border bg-background/50 px-4 py-6 text-right">
        <SubmitButton isEdit={isEdit} />
      </div>
    </form>
  )
}
