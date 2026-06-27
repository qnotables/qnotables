"use client"

import { useActionState, useRef, useState } from "react"
import { useFormStatus } from "react-dom"
import Link from "next/link"
import { ImagePlus, Loader2, Save, X } from "lucide-react"
import { TiptapEditor } from "@/components/tiptap-editor"
import { TextStats } from "@/components/text-stats"
import { SeoField } from "@/components/seo-field"
import { createPost, updatePost } from "@/app/blog/actions"
import type { BlogPost } from "@/lib/blog-posts"

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className="label-mono inline-flex items-center gap-2 bg-primary px-5 py-2.5 font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
    >
      {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
      {pending ? "Saving…" : "Save Post"}
    </button>
  )
}

function CoverImageField({ defaultUrl }: { defaultUrl?: string | null }) {
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
      fd.append("folder", "blog")
      const res = await fetch("/api/upload", { method: "POST", body: fd })
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
      <label className="label-mono text-muted-foreground">Cover Image</label>
      <input type="hidden" name="cover_image" value={url} />

      {url ? (
        <div className="relative w-full max-w-md overflow-hidden border border-border">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={url || "/placeholder.svg"} alt="Cover preview" className="h-48 w-full object-cover" />
          <button
            type="button"
            onClick={() => setUrl("")}
            className="absolute right-2 top-2 flex items-center gap-1 border border-border bg-background/90 px-2 py-1 text-xs text-foreground transition-colors hover:border-primary"
          >
            <X className="h-3 w-3" /> Remove
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="label-mono flex h-32 w-full max-w-md flex-col items-center justify-center gap-2 border border-dashed border-border text-muted-foreground transition-colors hover:border-primary hover:text-foreground disabled:opacity-50"
        >
          {uploading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <ImagePlus className="h-5 w-5" />
          )}
          {uploading ? "Uploading…" : "Upload cover image"}
        </button>
      )}

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0]
          if (f) upload(f)
          e.target.value = ""
        }}
      />
      {error ? <p className="label-mono text-destructive">{error}</p> : null}
    </div>
  )
}

interface BlogPostFormProps {
  post?: BlogPost
  defaultAuthor?: string
}

export function BlogPostForm({ post, defaultAuthor }: BlogPostFormProps) {
  const isEdit = Boolean(post?.id)
  const action = isEdit ? updatePost : createPost
  const [state, formAction] = useActionState(action, { error: null })
  const [excerptValue, setExcerptValue] = useState(post?.excerpt ?? "")
  const [seoTitleValue, setSeoTitleValue] = useState(post?.seoTitle ?? "")
  const [seoDescriptionValue, setSeoDescriptionValue] = useState(post?.seoDescription ?? "")
  const [seoImageUrl, setSeoImageUrl] = useState<string>(post?.seoImageUrl ?? "")

  const inputClass =
    "border border-border bg-background px-3 py-2 text-foreground outline-none focus:border-primary"

  return (
    <form action={formAction} className="flex flex-col gap-6">
      {isEdit ? <input type="hidden" name="id" value={post!.id} /> : null}

      <div className="flex flex-col gap-2">
        <label htmlFor="title" className="label-mono text-muted-foreground">
          Title
        </label>
        <input
          id="title"
          name="title"
          required
          minLength={3}
          defaultValue={post?.title}
          placeholder="A decisive headline"
          className={`${inputClass} stencil text-lg`}
        />
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="subtitle" className="label-mono text-muted-foreground">
          Subtitle <span className="text-muted-foreground/60">(optional)</span>
        </label>
        <input
          id="subtitle"
          name="subtitle"
          defaultValue={post?.subtitle ?? ""}
          placeholder="A supporting headline or summary"
          className={inputClass}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="flex flex-col gap-2">
          <label htmlFor="tag" className="label-mono text-muted-foreground">
            Desk / Tag
          </label>
          <input
            id="tag"
            name="tag"
            defaultValue={post?.tag ?? "Field Notes"}
            className={inputClass}
          />
        </div>
        <div className="flex flex-col gap-2">
          <label htmlFor="category" className="label-mono text-muted-foreground">
            Category <span className="text-muted-foreground/60">(optional)</span>
          </label>
          <input
            id="category"
            name="category"
            defaultValue={post?.category ?? ""}
            placeholder="e.g., Analysis, News, Research"
            className={inputClass}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="flex flex-col gap-2">
          <label htmlFor="author_name" className="label-mono text-muted-foreground">
            Author
          </label>
          <input
            id="author_name"
            name="author_name"
            defaultValue={post?.author ?? defaultAuthor}
            placeholder="Editorial Desk"
            className={inputClass}
          />
        </div>
        <div className="flex flex-col gap-2">
          <label htmlFor="post_type" className="label-mono text-muted-foreground">
            Post Type <span className="text-muted-foreground/60">(optional)</span>
          </label>
          <select id="post_type" name="post_type" defaultValue={post?.postType ?? ""} className={inputClass}>
            <option value="">— Select Type —</option>
            <option value="Field Note">Field Note</option>
            <option value="News Brief">News Brief</option>
            <option value="Research Thread">Research Thread</option>
            <option value="Show Notes">Show Notes</option>
            <option value="Source Archive">Source Archive</option>
            <option value="Opinion">Opinion</option>
            <option value="Explainer">Explainer</option>
            <option value="Timeline">Timeline</option>
            <option value="Document Drop">Document Drop</option>
          </select>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="slug" className="label-mono text-muted-foreground">
          Slug <span className="text-muted-foreground/60">(optional — derived from title)</span>
        </label>
        <input
          id="slug"
          name="slug"
          defaultValue={post?.slug}
          placeholder="auto-generated-from-title"
          className={`${inputClass} font-mono text-sm`}
        />
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <label htmlFor="excerpt" className="label-mono text-muted-foreground">
            Excerpt
          </label>
          <TextStats text={excerptValue} />
        </div>
        <textarea
          id="excerpt"
          name="excerpt"
          rows={2}
          value={excerptValue}
          onChange={(e) => setExcerptValue(e.target.value)}
          placeholder="A one or two sentence summary shown in listings."
          className={`${inputClass} resize-y leading-relaxed`}
        />
      </div>

      <CoverImageField defaultUrl={post?.coverImage} />

      <div className="flex flex-col gap-2">
        <label className="label-mono text-muted-foreground">SEO/OG Image <span className="text-muted-foreground/60">(optional — for social sharing)</span></label>
        <input type="hidden" name="seo_image_url" value={seoImageUrl} />

        {seoImageUrl ? (
          <div className="relative w-full max-w-md overflow-hidden border border-border">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={seoImageUrl || "/placeholder.svg"} alt="SEO preview" className="h-48 w-full object-cover" />
            <button
              type="button"
              onClick={() => setSeoImageUrl("")}
              className="absolute right-2 top-2 flex items-center gap-1 border border-border bg-background/90 px-2 py-1 text-xs text-foreground transition-colors hover:border-primary"
            >
              <X className="h-3 w-3" /> Remove
            </button>
          </div>
        ) : (
          <input
            type="url"
            placeholder="https://example.com/image.jpg"
            value={seoImageUrl}
            onChange={(e) => setSeoImageUrl(e.target.value)}
            className={`${inputClass} font-mono text-sm`}
          />
        )}
      </div>

      <div className="flex flex-col gap-2">
        <label className="label-mono text-muted-foreground">Body</label>
        <TiptapEditor
          name="body"
          defaultValue={post?.content}
          required
          uploadFolder="blog"
          placeholder="Write your post… Paste a YouTube, Rumble, Odysee, or Vimeo URL to embed it."
          isSignedIn
        />
      </div>

      <div className="border-t border-border pt-6">
        <h3 className="label-mono mb-4 text-sm font-semibold text-foreground">Publishing & Metadata</h3>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="flex flex-col gap-2">
            <label htmlFor="status" className="label-mono text-muted-foreground">
              Status
            </label>
            <select id="status" name="status" defaultValue={post?.status ?? "draft"} className={inputClass}>
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="scheduled">Scheduled</option>
              <option value="hidden">Hidden</option>
              <option value="archived">Archived</option>
            </select>
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="priority" className="label-mono text-muted-foreground">
              Priority
            </label>
            <select id="priority" name="priority" defaultValue={post?.priority ?? "medium"} className={inputClass}>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
          </div>
        </div>

        <label className="mt-4 flex items-center gap-3">
          <input
            type="checkbox"
            name="featured"
            defaultChecked={post?.featured ?? false}
            className="h-4 w-4 accent-primary"
          />
          <span className="label-mono text-foreground">Featured Post</span>
          <span className="label-mono text-muted-foreground">(Show in featured section)</span>
        </label>
      </div>

      <div className="border-t border-border pt-6">
        <h3 className="label-mono mb-4 text-sm font-semibold text-foreground">SEO & Sharing</h3>

        <div className="gap-4">
          <SeoField
            label="SEO Title (optional)"
            value={seoTitleValue}
            onChange={setSeoTitleValue}
            name="seo_title"
            maxLength={60}
            recommendedLength={{ min: 30, max: 60 }}
            placeholder="For search engines (leave blank to use main title)"
          />
        </div>

        <div className="mt-4 gap-4">
          <SeoField
            label="SEO Description (optional)"
            value={seoDescriptionValue}
            onChange={setSeoDescriptionValue}
            name="seo_description"
            maxLength={160}
            recommendedLength={{ min: 120, max: 160 }}
            placeholder="For search engines (leave blank to use excerpt)"
            rows={2}
            isTextarea
          />
        </div>
      </div>

      <div className="border-t border-border pt-6">
        <h3 className="label-mono mb-4 text-sm font-semibold text-foreground">Source & Links</h3>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="flex flex-col gap-2">
            <label htmlFor="source_name" className="label-mono text-muted-foreground">
              Source Name <span className="text-muted-foreground/60">(optional)</span>
            </label>
            <input
              id="source_name"
              name="source_name"
              defaultValue={post?.sourceName ?? ""}
              placeholder="e.g., Reuters, AP News"
              className={inputClass}
            />
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="source_url" className="label-mono text-muted-foreground">
              Source URL <span className="text-muted-foreground/60">(optional)</span>
            </label>
            <input
              id="source_url"
              name="source_url"
              type="url"
              defaultValue={post?.sourceUrl ?? ""}
              placeholder="https://example.com"
              className={inputClass}
            />
          </div>
        </div>
      </div>

      {state?.error ? (
        <p className="label-mono border border-destructive/40 bg-destructive/10 px-3 py-2 text-destructive">
          {state.error}
        </p>
      ) : null}

      <div className="flex items-center gap-3">
        <SubmitButton />
        <Link
          href="/blog/admin"
          className="label-mono px-4 py-2.5 text-muted-foreground transition-colors hover:text-foreground"
        >
          Cancel
        </Link>
      </div>
    </form>
  )
}
