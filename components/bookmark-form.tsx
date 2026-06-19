"use client"

import { useState } from "react"
import { submitBookmark } from "@/app/actions/bookmark-actions"
import { AlertCircle, CheckCircle, Loader2 } from "lucide-react"

interface BookmarkFormProps {
  onSuccess?: () => void
}

const CATEGORIES = [
  "Business",
  "Resource",
  "Tool",
  "Service",
  "Community",
  "Education",
  "News",
  "Other",
]

export function BookmarkForm({ onSuccess }: BookmarkFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [formData, setFormData] = useState({
    title: "",
    url: "",
    description: "",
    category: "Resource",
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    setSuccess(false)
    setIsLoading(true)

    const result = await submitBookmark(
      formData.title,
      formData.url,
      formData.description || null,
      formData.category || null,
    )

    if (result.success) {
      setSuccess(true)
      setFormData({ title: "", url: "", description: "", category: "Resource" })
      onSuccess?.()
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(false), 3000)
    } else {
      setError(result.error || "Failed to submit bookmark")
    }

    setIsLoading(false)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-4 md:p-6 border border-border bg-background/50">
      <div>
        <h3 className="stencil text-sm font-bold text-foreground mb-4">SUBMIT A BOOKMARK</h3>
        <p className="label-mono text-xs text-muted-foreground mb-4">
          Share a helpful link or business with the community. Admin approval required before it appears publicly.
        </p>
      </div>

      {/* Title */}
      <div>
        <label htmlFor="title" className="label-mono block text-xs font-semibold text-foreground mb-2">
          Title *
        </label>
        <input
          id="title"
          type="text"
          name="title"
          value={formData.title}
          onChange={handleChange}
          placeholder="e.g., Best SEO Tools"
          maxLength={200}
          required
          className="w-full px-3 py-2 border border-border bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary transition-colors"
        />
        <p className="label-mono text-xs text-muted-foreground mt-1">
          {formData.title.length}/200 characters
        </p>
      </div>

      {/* URL */}
      <div>
        <label htmlFor="url" className="label-mono block text-xs font-semibold text-foreground mb-2">
          URL *
        </label>
        <input
          id="url"
          type="url"
          name="url"
          value={formData.url}
          onChange={handleChange}
          placeholder="https://example.com"
          required
          className="w-full px-3 py-2 border border-border bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary transition-colors"
        />
      </div>

      {/* Category */}
      <div>
        <label htmlFor="category" className="label-mono block text-xs font-semibold text-foreground mb-2">
          Category
        </label>
        <select
          id="category"
          name="category"
          value={formData.category}
          onChange={handleChange}
          className="w-full px-3 py-2 border border-border bg-background text-foreground focus:outline-none focus:border-primary transition-colors"
        >
          {CATEGORIES.map((cat) => (
            <option key={cat} value={cat} className="bg-background text-foreground">
              {cat}
            </option>
          ))}
        </select>
      </div>

      {/* Description */}
      <div>
        <label htmlFor="description" className="label-mono block text-xs font-semibold text-foreground mb-2">
          Description
        </label>
        <textarea
          id="description"
          name="description"
          value={formData.description}
          onChange={handleChange}
          placeholder="Brief description of what this resource offers..."
          maxLength={500}
          rows={3}
          className="w-full px-3 py-2 border border-border bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary transition-colors resize-none"
        />
        <p className="label-mono text-xs text-muted-foreground mt-1">
          {formData.description.length}/500 characters
        </p>
      </div>

      {/* Messages */}
      {error && (
        <div className="flex items-start gap-2 p-3 bg-destructive/10 border border-destructive/50 text-destructive text-sm">
          <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
          <p>{error}</p>
        </div>
      )}

      {success && (
        <div className="flex items-start gap-2 p-3 bg-green-500/10 border border-green-500/50 text-green-400 text-sm">
          <CheckCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
          <p>Bookmark submitted! Awaiting admin approval.</p>
        </div>
      )}

      {/* Submit button */}
      <button
        type="submit"
        disabled={isLoading}
        className="w-full px-4 py-2 bg-primary text-primary-foreground font-semibold hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
      >
        {isLoading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Submitting...
          </>
        ) : (
          "Submit Bookmark"
        )}
      </button>
    </form>
  )
}
