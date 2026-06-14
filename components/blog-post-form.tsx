"use client"

import { useActionState, useRef, useState } from "react"
import { useFormStatus } from "react-dom"
import Link from "next/link"
import { ImagePlus, Loader2, Save, X } from "lucide-react"
import { MarkdownEditor } from "@/components/markdown-editor"
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
        <label htmlFor="excerpt" className="label-mono text-muted-foreground">
          Excerpt
        </label>
        <textarea
          id="excerpt"
          name="excerpt"
          rows={2}
          defaultValue={post?.excerpt}
          placeholder="A one or two sentence summary shown in listings."
          className={`${inputClass} resize-y leading-relaxed`}
        />
      </div>

      <CoverImageField defaultUrl={post?.coverImage} />

      <div className="flex flex-col gap-2">
        <label className="label-mono text-muted-foreground">Body</label>
        <MarkdownEditor
          name="body"
          defaultValue={post?.content}
          rows={18}
          required
          uploadFolder="blog"
          placeholder="Write your post in Markdown. Use the image button to upload artwork…"
        />
      </div>

      <label className="flex items-center gap-3">
        <input
          type="checkbox"
          name="published"
          defaultChecked={post?.published ?? true}
          className="h-4 w-4 accent-primary"
        />
        <span className="label-mono text-foreground">Published</span>
        <span className="label-mono text-muted-foreground">
          (uncheck to save as a private draft)
        </span>
      </label>

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
