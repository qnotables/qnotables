"use client"

import { useActionState, useCallback, useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { ImagePlus, Loader2, Save, X, AlertCircle, Check } from "lucide-react"
import { TextStats } from "@/components/text-stats"
import { Markdown } from "@/components/markdown"
import { MediaInserter } from "@/components/dashboard/media-inserter"
import { createPostDashboard, updatePostDashboard } from "@/app/dashboard/blog/blog-form-actions"
import type { BlogPost } from "@/lib/blog-posts"

type Tab = "write" | "preview" | "details" | "sources" | "seo" | "settings"

const DRAFT_KEY = "hot-and-fresh-new-post-draft"
const AUTOSAVE_DELAY = 5000 // 5 seconds

const POST_TYPE_OPTIONS = [
  "Field Note",
  "News Brief",
  "Research Thread",
  "Show Notes",
  "Source Archive",
  "Opinion",
  "Explainer",
  "Timeline",
  "Document Drop",
] as const

interface PostFormData {
  title: string
  subtitle: string
  excerpt: string
  slug: string
  body: string
  category: string
  post_type: string
  author_name: string
  tag: string
  featured: boolean
  priority: string
  status: string
  show_title: boolean
  episode_date: string
  source_name: string
  source_url: string
  seo_title: string
  seo_description: string
  cover_image: string
  og_image_url: string
}

function ImageField({
  name,
  label,
  value,
  onChange,
  accept = "image/*",
  uploadFolder = "blog",
}: {
  name: string
  label: string
  value: string
  onChange: (url: string) => void
  accept?: string
  uploadFolder?: string
}) {
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
      onChange(json.url)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed")
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <label className="label-mono text-sm font-semibold text-foreground">{label}</label>
      <input type="hidden" name={name} value={value} />
      {value ? (
        <div className="relative w-full max-w-sm overflow-hidden border border-border">
          <img src={value || "/placeholder.svg"} alt="Preview" className="h-40 w-full object-cover" />
          <button
            type="button"
            onClick={() => onChange("")}
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
            ref={fileRef}
            type="file"
            accept={accept}
            onChange={(e) => {
              const file = e.currentTarget.files?.[0]
              if (file) upload(file)
            }}
            className="hidden"
          />
          <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
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
  const [activeTab, setActiveTab] = useState<Tab>("write")
  const [formData, setFormData] = useState<PostFormData>(() => {
    // Try to load from localStorage first (only on new posts)
    if (typeof window !== "undefined" && !isEdit) {
      const saved = localStorage.getItem(DRAFT_KEY)
      if (saved) {
        try {
          return JSON.parse(saved)
        } catch {
          // Fall through to default
        }
      }
    }
    // Otherwise use post data or defaults
    return {
      title: post?.title ?? "",
      subtitle: post?.subtitle ?? "",
      excerpt: post?.excerpt ?? "",
      slug: post?.slug ?? "",
      body: post?.content ?? "",
      category: post?.category ?? "",
      post_type: post?.postType ?? "",
      author_name: post?.author ?? "Editorial Desk",
      tag: post?.tag ?? "Field Notes",
      featured: post?.featured ?? false,
      priority: post?.priority ?? "medium",
      status: post?.status ?? "draft",
      show_title: true,
      episode_date: "",
      source_name: post?.sourceName ?? "",
      source_url: post?.sourceUrl ?? "",
      seo_title: post?.seoTitle ?? "",
      seo_description: post?.seoDescription ?? "",
      cover_image: post?.coverImage ?? "",
      og_image_url: "",
    }
  })

  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle")
  const [submitMode, setSubmitMode] = useState<"draft" | "publish">("draft")
  const [state, formAction] = useActionState(
    isEdit ? updatePostDashboard : createPostDashboard,
    { error: null },
  )
  const autosaveTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined)
  const formRef = useRef<HTMLFormElement>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Auto-generate slug from title if slug is empty
  useEffect(() => {
    if (!isEdit && formData.slug === "" && formData.title.length > 0) {
      const newSlug = formData.title
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-")
        .slice(0, 80)
      setFormData((prev) => ({ ...prev, slug: newSlug }))
    }
  }, [formData.title, isEdit])

  // Autosave to localStorage
  useEffect(() => {
    if (isEdit) return // Don't autosave when editing existing posts

    if (autosaveTimeoutRef.current) clearTimeout(autosaveTimeoutRef.current)

    setSaveStatus("saving")
    autosaveTimeoutRef.current = setTimeout(() => {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(formData))
      setSaveStatus("saved")
      setTimeout(() => setSaveStatus("idle"), 2000)
    }, AUTOSAVE_DELAY)

    return () => {
      if (autosaveTimeoutRef.current) clearTimeout(autosaveTimeoutRef.current)
    }
  }, [formData, isEdit])

  // On success, redirect to blog dashboard
  useEffect(() => {
    if (state.success) {
      if (!isEdit) localStorage.removeItem(DRAFT_KEY)
      router.push("/dashboard/blog")
    }
  }, [state.success, isEdit, router])

  const handleFieldChange = useCallback((field: keyof PostFormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }, [])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement> | null, mode: "draft" | "publish") => {
    if (e) e.preventDefault()
    setSubmitMode(mode)

    // Validation
    if (!formData.title.trim()) {
      alert("Title is required")
      return
    }
    if (!formData.slug.trim()) {
      alert("Slug is required")
      return
    }
    if (!formData.body.trim()) {
      alert("Body content is required")
      return
    }
    if (mode === "publish") {
      if (!formData.category.trim()) {
        alert("Category is required to publish")
        return
      }
      if (!formData.post_type.trim()) {
        alert("Post type is required to publish")
        return
      }
    }

    setIsSubmitting(true)

    const fd = new FormData()
    if (isEdit && post?.id) fd.append("id", post.id)
    fd.append("title", formData.title)
    fd.append("subtitle", formData.subtitle)
    fd.append("excerpt", formData.excerpt)
    fd.append("slug", formData.slug)
    fd.append("body", formData.body)
    fd.append("category", formData.category)
    fd.append("post_type", formData.post_type)
    fd.append("author_name", formData.author_name)
    fd.append("tag", formData.tag)
    fd.append("featured", formData.featured ? "on" : "")
    fd.append("priority", formData.priority)
    fd.append("status", mode === "publish" ? "published" : "draft")
    fd.append("show_title", formData.show_title ? "on" : "")
    fd.append("episode_date", formData.episode_date)
    fd.append("source_name", formData.source_name)
    fd.append("source_url", formData.source_url)
    fd.append("seo_title", formData.seo_title)
    fd.append("seo_description", formData.seo_description)
    fd.append("cover_image", formData.cover_image)
    fd.append("og_image_url", formData.og_image_url)

    // Call the server action
    await formAction(fd)
    setIsSubmitting(false)
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: "write", label: "Write" },
    { id: "preview", label: "Preview" },
    { id: "details", label: "Details" },
    { id: "sources", label: "Sources" },
    { id: "seo", label: "SEO" },
    { id: "settings", label: "Settings" },
  ]

  return (
    <div className="mx-auto max-w-4xl">
      {/* Sticky header with tabs and submit */}
      <div className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur">
        <div className="flex flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-1">
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
          <div className="flex items-center gap-3">
            {!isEdit && saveStatus !== "idle" && (
              <div
                className={`label-mono text-xs flex items-center gap-1 ${
                  saveStatus === "saved" ? "text-green-600" : "text-muted-foreground"
                }`}
              >
                {saveStatus === "saving" ? (
                  <>
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Saving draft…
                  </>
                ) : (
                  <>
                    <Check className="h-3 w-3" />
                    Draft saved
                  </>
                )}
              </div>
            )}
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => handleSubmit(null, "draft")}
              className="label-mono inline-flex items-center gap-2 border border-border px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-muted disabled:opacity-50"
            >
              <Save className="h-4 w-4" />
              {isSubmitting && submitMode === "draft" ? "Saving…" : "Save Draft"}
            </button>
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => handleSubmit(null, "publish")}
              className="label-mono inline-flex items-center gap-2 bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              <Check className="h-4 w-4" />
              {isSubmitting && submitMode === "publish" ? "Publishing…" : "Publish"}
            </button>
          </div>
        </div>
      </div>

      {state.error && (
        <div className="mb-4 mx-4 mt-4 border border-destructive bg-destructive/5 px-4 py-3 text-sm text-destructive flex items-start gap-2">
          <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
          <div>{state.error}</div>
        </div>
      )}

      <form ref={formRef} className="space-y-8 px-4 py-6">
        {/* WRITE TAB */}
        {activeTab === "write" && (
          <div className="space-y-6">
            <div>
              <label className="label-mono block text-sm font-semibold text-foreground">Title *</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => handleFieldChange("title", e.target.value)}
                required
                placeholder="e.g., Breaking News: Global Market Shifts"
                className="label-mono mt-2 w-full border border-border bg-background px-4 py-2.5 text-foreground outline-none focus:border-primary"
              />
            </div>

            <div>
              <label className="label-mono block text-sm font-semibold text-foreground">Excerpt *</label>
              <textarea
                value={formData.excerpt}
                onChange={(e) => handleFieldChange("excerpt", e.target.value)}
                required
                placeholder="Summary for archives and feeds (60-160 chars recommended)"
                className="label-mono mt-2 w-full border border-border bg-background px-4 py-2.5 text-foreground outline-none focus:border-primary"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="label-mono text-sm font-semibold text-foreground">Body *</label>
                <TextStats text={formData.body} showTime />
              </div>
              <div className="flex items-center gap-2 border border-border bg-background/50 px-2 py-2">
                <span className="label-mono text-xs text-muted-foreground">Insert:</span>
                <MediaInserter
                  onInsertImage={(url, alt) => {
                    const newBody = formData.body + `\n![${alt}](${url})\n`
                    handleFieldChange("body", newBody)
                  }}
                  onInsertVideo={(url) => {
                    const newBody = formData.body + `\n<video controls width="100%"><source src="${url}" type="video/mp4"></video>\n`
                    handleFieldChange("body", newBody)
                  }}
                />
              </div>
              <textarea
                value={formData.body}
                onChange={(e) => handleFieldChange("body", e.target.value)}
                required
                placeholder="Write your post in Markdown. Supports **bold**, *italic*, [links](url), etc. Use the insert buttons above to embed images and videos."
                className="label-mono w-full border border-border bg-background px-4 py-2.5 text-foreground outline-none focus:border-primary font-mono text-sm"
                rows={24}
              />
            </div>
          </div>
        )}

        {/* PREVIEW TAB */}
        {activeTab === "preview" && (
          <div className="prose-invert max-w-none">
            <div className="mb-6">
              <h1 className="stencil text-3xl mb-2">{formData.title || "Untitled"}</h1>
              {formData.subtitle && <p className="text-lg text-muted-foreground">{formData.subtitle}</p>}
            </div>
            {formData.body ? (
              <Markdown content={formData.body} />
            ) : (
              <p className="label-mono text-muted-foreground italic">No content yet. Write something to preview.</p>
            )}
          </div>
        )}

        {/* DETAILS TAB */}
        {activeTab === "details" && (
          <div className="space-y-6">
            <div>
              <label className="label-mono block text-sm font-semibold text-foreground">URL Slug *</label>
              <input
                type="text"
                value={formData.slug}
                onChange={(e) => handleFieldChange("slug", e.target.value)}
                required
                placeholder="auto-generated from title"
                className="label-mono mt-2 w-full border border-border bg-background px-4 py-2.5 text-foreground outline-none focus:border-primary"
              />
              <p className="label-mono mt-1 text-xs text-muted-foreground">Auto-generated from title if left empty</p>
            </div>

            <div>
              <label className="label-mono block text-sm font-semibold text-foreground">Subtitle</label>
              <input
                type="text"
                value={formData.subtitle}
                onChange={(e) => handleFieldChange("subtitle", e.target.value)}
                placeholder="Secondary headline"
                className="label-mono mt-2 w-full border border-border bg-background px-4 py-2.5 text-foreground outline-none focus:border-primary"
              />
            </div>

            <ImageField
              name="cover_image"
              label="Cover Image"
              value={formData.cover_image}
              onChange={(url) => handleFieldChange("cover_image", url)}
              uploadFolder="blog"
            />

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={formData.featured}
                  onChange={(e) => handleFieldChange("featured", e.target.checked)}
                  className="h-4 w-4 border border-border bg-background"
                />
                <span className="label-mono text-sm text-foreground">Featured Post</span>
              </label>

              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={formData.show_title}
                  onChange={(e) => handleFieldChange("show_title", e.target.checked)}
                  className="h-4 w-4 border border-border bg-background"
                />
                <span className="label-mono text-sm text-foreground">Show Title in Display</span>
              </label>
            </div>

            <div>
              <label className="label-mono block text-sm font-semibold text-foreground">Priority</label>
              <select
                value={formData.priority}
                onChange={(e) => handleFieldChange("priority", e.target.value)}
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
                value={formData.episode_date}
                onChange={(e) => handleFieldChange("episode_date", e.target.value)}
                className="label-mono mt-2 w-full border border-border bg-background px-4 py-2.5 text-foreground outline-none focus:border-primary"
              />
              <p className="label-mono mt-1 text-xs text-muted-foreground">For podcast/show episodes</p>
            </div>
          </div>
        )}

        {/* SOURCES TAB */}
        {activeTab === "sources" && (
          <div className="space-y-6">
            <div>
              <label className="label-mono block text-sm font-semibold text-foreground">Author Name</label>
              <input
                type="text"
                value={formData.author_name}
                onChange={(e) => handleFieldChange("author_name", e.target.value)}
                placeholder="Editorial Desk"
                className="label-mono mt-2 w-full border border-border bg-background px-4 py-2.5 text-foreground outline-none focus:border-primary"
              />
            </div>

            <div>
              <label className="label-mono block text-sm font-semibold text-foreground">Source Name</label>
              <input
                type="text"
                value={formData.source_name}
                onChange={(e) => handleFieldChange("source_name", e.target.value)}
                placeholder="Original source/publication"
                className="label-mono mt-2 w-full border border-border bg-background px-4 py-2.5 text-foreground outline-none focus:border-primary"
              />
            </div>

            <div>
              <label className="label-mono block text-sm font-semibold text-foreground">Source URL</label>
              <input
                type="url"
                value={formData.source_url}
                onChange={(e) => handleFieldChange("source_url", e.target.value)}
                placeholder="https://example.com"
                className="label-mono mt-2 w-full border border-border bg-background px-4 py-2.5 text-foreground outline-none focus:border-primary"
              />
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
                value={formData.seo_title}
                onChange={(e) => handleFieldChange("seo_title", e.target.value)}
                placeholder="50-60 chars (leave empty to use main title)"
                maxLength={60}
                className="label-mono mt-2 w-full border border-border bg-background px-4 py-2.5 text-foreground outline-none focus:border-primary"
              />
              <p className="label-mono mt-1 text-xs text-muted-foreground">{formData.seo_title.length}/60 characters</p>
            </div>

            <div>
              <label className="label-mono block text-sm font-semibold text-foreground">SEO Description</label>
              <textarea
                value={formData.seo_description}
                onChange={(e) => handleFieldChange("seo_description", e.target.value)}
                placeholder="155-160 chars (meta description)"
                maxLength={160}
                className="label-mono mt-2 w-full border border-border bg-background px-4 py-2.5 text-foreground outline-none focus:border-primary"
                rows={3}
              />
              <p className="label-mono mt-1 text-xs text-muted-foreground">{formData.seo_description.length}/160 characters</p>
            </div>

            <ImageField
              name="og_image_url"
              label="Open Graph Image"
              value={formData.og_image_url}
              onChange={(url) => handleFieldChange("og_image_url", url)}
              uploadFolder="og"
            />
          </div>
        )}

        {/* SETTINGS TAB */}
        {activeTab === "settings" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="label-mono block text-sm font-semibold text-foreground">Category *</label>
                <input
                  type="text"
                  value={formData.category}
                  onChange={(e) => handleFieldChange("category", e.target.value)}
                  placeholder="e.g., Markets, Politics"
                  className="label-mono mt-2 w-full border border-border bg-background px-4 py-2.5 text-foreground outline-none focus:border-primary"
                />
                <p className="label-mono mt-1 text-xs text-muted-foreground">Required to publish</p>
              </div>

              <div>
                <label className="label-mono block text-sm font-semibold text-foreground">Post Type *</label>
                <select
                  value={formData.post_type}
                  onChange={(e) => handleFieldChange("post_type", e.target.value)}
                  className="label-mono mt-2 w-full border border-border bg-background px-4 py-2.5 text-foreground outline-none focus:border-primary"
                >
                  <option value="">Select type</option>
                  {POST_TYPE_OPTIONS.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
                <p className="label-mono mt-1 text-xs text-muted-foreground">Required to publish</p>
              </div>

              <div>
                <label className="label-mono block text-sm font-semibold text-foreground">Tag</label>
                <input
                  type="text"
                  value={formData.tag}
                  onChange={(e) => handleFieldChange("tag", e.target.value)}
                  placeholder="Field Notes"
                  className="label-mono mt-2 w-full border border-border bg-background px-4 py-2.5 text-foreground outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="label-mono block text-sm font-semibold text-foreground">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => handleFieldChange("status", e.target.value)}
                  className="label-mono mt-2 w-full border border-border bg-background px-4 py-2.5 text-foreground outline-none focus:border-primary"
                >
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                  <option value="archived">Archived</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </form>

      {/* Clear draft button */}
      {!isEdit && (
        <div className="border-t border-border bg-background/50 px-4 py-4">
          <button
            type="button"
            onClick={() => {
              if (confirm("Clear the local draft? This cannot be undone.")) {
                localStorage.removeItem(DRAFT_KEY)
                setFormData({
                  title: "",
                  subtitle: "",
                  excerpt: "",
                  slug: "",
                  body: "",
                  category: "",
                  post_type: "",
                  author_name: "Editorial Desk",
                  tag: "Field Notes",
                  featured: false,
                  priority: "medium",
                  status: "draft",
                  show_title: true,
                  episode_date: "",
                  source_name: "",
                  source_url: "",
                  seo_title: "",
                  seo_description: "",
                  cover_image: "",
                  og_image_url: "",
                })
              }
            }}
            className="label-mono text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            Clear local draft
          </button>
        </div>
      )}
    </div>
  )
}
