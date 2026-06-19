"use client"

import { useState, useCallback, useEffect } from "react"
import { ArchivePost } from "@/lib/archive"
import { saveArchivePost, publishArchivePost, scheduleArchivePost, checkSlugExists } from "@/app/actions/archive-actions"
import { generateSlug } from "@/lib/slug-utils"

type Tab = "write" | "media" | "sources" | "details" | "seo" | "timeline" | "preview" | "settings"

export interface ArchiveEditorProps {
  initialPost?: ArchivePost
  onSave?: (post: ArchivePost) => void
  onPublish?: (post: ArchivePost) => void
}

export function ArchiveEditor({ initialPost, onSave, onPublish }: ArchiveEditorProps) {
  const [activeTab, setActiveTab] = useState<Tab>("write")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [unsavedChanges, setUnsavedChanges] = useState(false)
  const [localSaveTime, setLocalSaveTime] = useState<Date | null>(null)

  // Form state
  const [formData, setFormData] = useState<Partial<ArchivePost>>(
    initialPost || {
      title: "",
      slug: "",
      subtitle: "",
      excerpt: "",
      body: "",
      category: "",
      tags: [],
      post_type: "Research Thread",
      status: "draft",
      priority: "medium",
      featured: false,
      source_name: "",
      source_url: "",
      source_author: "",
      original_publish_date: "",
      media_type: "none",
      video_url: "",
      embed_url: "",
      iframe_url: "",
      document_url: "",
      related_links: [],
      timeline_date: "",
      show_title: "",
      seo_title: "",
      seo_description: "",
      include_in_rss: true,
      public_archive: true,
    }
  )

  // Restore from localStorage on mount
  useEffect(() => {
    const storageKey = `archive-draft-${initialPost?.id || "new"}`
    const saved = localStorage.getItem(storageKey)
    if (saved && !initialPost) {
      try {
        const restored = JSON.parse(saved)
        setFormData(restored)
        setSuccess("Draft restored from local storage")
      } catch {
        // Ignore parse errors
      }
    }
  }, [])

  // Auto-save to localStorage
  useEffect(() => {
    const interval = setInterval(() => {
      const storageKey = `archive-draft-${initialPost?.id || "new"}`
      localStorage.setItem(storageKey, JSON.stringify(formData))
      setLocalSaveTime(new Date())
      if (!initialPost?.id) {
        setSuccess("Draft auto-saved locally")
      }
    }, 10000) // 10 seconds

    return () => clearInterval(interval)
  }, [formData, initialPost])

  // Handle field changes
  const handleFieldChange = useCallback((field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }))
    setUnsavedChanges(true)

    // Auto-generate slug if title changed
    if (field === "title" && !initialPost?.id) {
      setFormData(prev => ({
        ...prev,
        slug: generateSlug(value),
      }))
    }
  }, [initialPost])

  // Handle array field changes (tags, related_links)
  const handleArrayFieldChange = useCallback((field: string, value: any[], index?: number) => {
    setFormData(prev => ({
      ...prev,
      [field]: index !== undefined ? [...(prev[field as keyof ArchivePost] as any[])].splice(index, 1, value[index]) : value,
    }))
    setUnsavedChanges(true)
  }, [])

  // Save draft
  const handleSaveDraft = async () => {
    try {
      setLoading(true)
      setError(null)
      const saved = await saveArchivePost({
        ...formData,
        status: "draft",
      })
      setUnsavedChanges(false)
      setSuccess("Draft saved successfully")
      onSave?.(saved)
      localStorage.removeItem(`archive-draft-${initialPost?.id || "new"}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save draft")
    } finally {
      setLoading(false)
    }
  }

  // Publish
  const handlePublish = async () => {
    try {
      setLoading(true)
      setError(null)
      const published = await saveArchivePost({
        ...formData,
        status: "published",
        published_at: new Date().toISOString(),
      })
      setUnsavedChanges(false)
      setSuccess("Archive published successfully")
      onPublish?.(published)
      localStorage.removeItem(`archive-draft-${initialPost?.id || "new"}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to publish")
    } finally {
      setLoading(false)
    }
  }

  // Schedule
  const handleSchedule = async (scheduledAt: string) => {
    try {
      setLoading(true)
      setError(null)
      await saveArchivePost({
        ...formData,
        status: "scheduled",
        scheduled_at: scheduledAt,
      })
      setSuccess("Archive scheduled successfully")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to schedule")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Status bar */}
      <div className="flex items-center justify-between border border-border bg-muted/30 p-4">
        <div className="flex items-center gap-4">
          {error && <div className="text-sm text-red-500">{error}</div>}
          {success && <div className="text-sm text-green-500">{success}</div>}
          {unsavedChanges && <div className="text-sm text-yellow-500">Unsaved changes</div>}
          {localSaveTime && <div className="text-xs text-muted-foreground">Draft auto-saved at {localSaveTime.toLocaleTimeString()}</div>}
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleSaveDraft}
            disabled={loading || !unsavedChanges}
            className="px-4 py-2 bg-muted border border-border hover:bg-muted/80 disabled:opacity-50"
          >
            Save Draft
          </button>
          <button
            onClick={handlePublish}
            disabled={loading}
            className="px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/90"
          >
            Publish
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-border">
        <div className="flex gap-2 overflow-x-auto">
          {(["write", "media", "sources", "details", "seo", "timeline", "preview", "settings"] as Tab[]).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 border-b-2 transition-colors capitalize ${
                activeTab === tab
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <div className="space-y-4">
        {activeTab === "write" && (
          <>
            <ArchiveEditorWrite formData={formData} onFieldChange={handleFieldChange} />
          </>
        )}

        {activeTab === "media" && (
          <>
            <ArchiveEditorMedia formData={formData} onFieldChange={handleFieldChange} />
          </>
        )}

        {activeTab === "sources" && (
          <>
            <ArchiveEditorSources formData={formData} onFieldChange={handleFieldChange} onArrayFieldChange={handleArrayFieldChange} />
          </>
        )}

        {activeTab === "details" && (
          <>
            <ArchiveEditorDetails formData={formData} onFieldChange={handleFieldChange} onArrayFieldChange={handleArrayFieldChange} />
          </>
        )}

        {activeTab === "seo" && (
          <>
            <ArchiveEditorSEO formData={formData} onFieldChange={handleFieldChange} />
          </>
        )}

        {activeTab === "timeline" && (
          <>
            <ArchiveEditorTimeline formData={formData} onFieldChange={handleFieldChange} />
          </>
        )}

        {activeTab === "preview" && (
          <>
            <ArchiveEditorPreview formData={formData} />
          </>
        )}

        {activeTab === "settings" && (
          <>
            <ArchiveEditorSettings formData={formData} onFieldChange={handleFieldChange} onSchedule={handleSchedule} />
          </>
        )}
      </div>
    </div>
  )
}

// Tab components
function ArchiveEditorWrite({ formData, onFieldChange }: any) {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-semibold mb-2">Title</label>
        <input
          type="text"
          value={formData.title || ""}
          onChange={e => onFieldChange("title", e.target.value)}
          placeholder="Archive item title"
          className="w-full px-3 py-2 border border-border bg-background"
        />
      </div>

      <div>
        <label className="block text-sm font-semibold mb-2">Slug</label>
        <input
          type="text"
          value={formData.slug || ""}
          onChange={e => onFieldChange("slug", e.target.value)}
          placeholder="url-friendly-slug"
          className="w-full px-3 py-2 border border-border bg-background"
        />
      </div>

      <div>
        <label className="block text-sm font-semibold mb-2">Subtitle</label>
        <input
          type="text"
          value={formData.subtitle || ""}
          onChange={e => onFieldChange("subtitle", e.target.value)}
          placeholder="Optional subtitle"
          className="w-full px-3 py-2 border border-border bg-background"
        />
      </div>

      <div>
        <label className="block text-sm font-semibold mb-2">Excerpt</label>
        <textarea
          value={formData.excerpt || ""}
          onChange={e => onFieldChange("excerpt", e.target.value)}
          placeholder="Brief summary (optional - auto-generated if empty)"
          rows={3}
          className="w-full px-3 py-2 border border-border bg-background"
        />
      </div>

      <div>
        <label className="block text-sm font-semibold mb-2">Body (Markdown)</label>
        <textarea
          value={formData.body || ""}
          onChange={e => onFieldChange("body", e.target.value)}
          placeholder="Main content in Markdown format"
          rows={12}
          className="w-full px-3 py-2 border border-border bg-background font-mono text-sm"
        />
      </div>
    </div>
  )
}

function ArchiveEditorMedia({ formData, onFieldChange }: any) {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-semibold mb-2">Media Type</label>
        <select
          value={formData.media_type || "none"}
          onChange={e => onFieldChange("media_type", e.target.value)}
          className="w-full px-3 py-2 border border-border bg-background"
        >
          <option value="none">None</option>
          <option value="image">Image</option>
          <option value="video">Video</option>
          <option value="iframe">Iframe Embed</option>
          <option value="document">Document</option>
          <option value="audio">Audio</option>
          <option value="external_link">External Link</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-semibold mb-2">Cover Image URL</label>
        <input
          type="url"
          value={formData.cover_image_url || ""}
          onChange={e => onFieldChange("cover_image_url", e.target.value)}
          placeholder="https://..."
          className="w-full px-3 py-2 border border-border bg-background"
        />
      </div>

      {formData.media_type === "video" && (
        <div>
          <label className="block text-sm font-semibold mb-2">Video URL</label>
          <input
            type="url"
            value={formData.video_url || ""}
            onChange={e => onFieldChange("video_url", e.target.value)}
            placeholder="YouTube, Rumble, or Vimeo URL"
            className="w-full px-3 py-2 border border-border bg-background"
          />
        </div>
      )}

      {formData.media_type === "iframe" && (
        <div>
          <label className="block text-sm font-semibold mb-2">Iframe URL or Code</label>
          <textarea
            value={formData.iframe_url || ""}
            onChange={e => onFieldChange("iframe_url", e.target.value)}
            placeholder="Iframe URL or complete iframe code"
            rows={6}
            className="w-full px-3 py-2 border border-border bg-background font-mono text-sm"
          />
        </div>
      )}

      {formData.media_type === "document" && (
        <div>
          <label className="block text-sm font-semibold mb-2">Document URL</label>
          <input
            type="url"
            value={formData.document_url || ""}
            onChange={e => onFieldChange("document_url", e.target.value)}
            placeholder="PDF or document URL (PDFs will be embedded inline)"
            className="w-full px-3 py-2 border border-border bg-background"
          />
          <p className="text-xs text-muted-foreground mt-1">
            PDF files will be displayed as an inline embed on the archive page.
          </p>
        </div>
      )}
    </div>
  )
}

function ArchiveEditorSources({ formData, onFieldChange, onArrayFieldChange }: any) {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-semibold mb-2">Source Name</label>
        <input
          type="text"
          value={formData.source_name || ""}
          onChange={e => onFieldChange("source_name", e.target.value)}
          placeholder="e.g., Reuters, Associated Press"
          className="w-full px-3 py-2 border border-border bg-background"
        />
      </div>

      <div>
        <label className="block text-sm font-semibold mb-2">Source URL</label>
        <input
          type="url"
          value={formData.source_url || ""}
          onChange={e => onFieldChange("source_url", e.target.value)}
          placeholder="https://..."
          className="w-full px-3 py-2 border border-border bg-background"
        />
      </div>

      <div>
        <label className="block text-sm font-semibold mb-2">Source Author</label>
        <input
          type="text"
          value={formData.source_author || ""}
          onChange={e => onFieldChange("source_author", e.target.value)}
          placeholder="Author name"
          className="w-full px-3 py-2 border border-border bg-background"
        />
      </div>

      <div>
        <label className="block text-sm font-semibold mb-2">Related Links</label>
        <div className="space-y-2">
          {(formData.related_links || []).map((link: any, idx: number) => (
            <div key={idx} className="flex gap-2">
              <input
                type="text"
                value={link.title || ""}
                onChange={e => {
                  const updated = [...(formData.related_links || [])]
                  updated[idx] = { ...link, title: e.target.value }
                  onFieldChange("related_links", updated)
                }}
                placeholder="Link title"
                className="flex-1 px-3 py-2 border border-border bg-background"
              />
              <input
                type="url"
                value={link.url || ""}
                onChange={e => {
                  const updated = [...(formData.related_links || [])]
                  updated[idx] = { ...link, url: e.target.value }
                  onFieldChange("related_links", updated)
                }}
                placeholder="URL"
                className="flex-1 px-3 py-2 border border-border bg-background"
              />
              <button
                onClick={() => {
                  const updated = (formData.related_links || []).filter((_: any, i: number) => i !== idx)
                  onFieldChange("related_links", updated)
                }}
                className="px-3 py-2 bg-red-500/20 text-red-500 hover:bg-red-500/30"
              >
                Remove
              </button>
            </div>
          ))}
          <button
            onClick={() => {
              const updated = [...(formData.related_links || []), { title: "", url: "" }]
              onFieldChange("related_links", updated)
            }}
            className="px-3 py-2 border border-border bg-muted hover:bg-muted/80"
          >
            Add Link
          </button>
        </div>
      </div>
    </div>
  )
}

function ArchiveEditorDetails({ formData, onFieldChange, onArrayFieldChange }: any) {
  return (
    <div className="space-y-4 grid grid-cols-2 gap-4">
      <div>
        <label className="block text-sm font-semibold mb-2">Category</label>
        <input
          type="text"
          value={formData.category || ""}
          onChange={e => onFieldChange("category", e.target.value)}
          placeholder="e.g., Politics, Science"
          className="w-full px-3 py-2 border border-border bg-background"
        />
      </div>

      <div>
        <label className="block text-sm font-semibold mb-2">Post Type</label>
        <select
          value={formData.post_type || "Research Thread"}
          onChange={e => onFieldChange("post_type", e.target.value)}
          className="w-full px-3 py-2 border border-border bg-background"
        >
          <option value="Research Thread">Research Thread</option>
          <option value="Source Archive">Source Archive</option>
          <option value="Document Drop">Document Drop</option>
          <option value="Video Archive">Video Archive</option>
          <option value="Show Notes">Show Notes</option>
          <option value="Timeline Entry">Timeline Entry</option>
          <option value="Field Note">Field Note</option>
          <option value="News Brief">News Brief</option>
          <option value="Explainer">Explainer</option>
          <option value="Media Clip">Media Clip</option>
          <option value="External Link">External Link</option>
          <option value="Public Record">Public Record</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-semibold mb-2">Priority</label>
        <select
          value={formData.priority || "medium"}
          onChange={e => onFieldChange("priority", e.target.value)}
          className="w-full px-3 py-2 border border-border bg-background"
        >
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
          <option value="critical">Critical</option>
        </select>
      </div>

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="featured"
          checked={formData.featured || false}
          onChange={e => onFieldChange("featured", e.target.checked)}
          className="h-4 w-4"
        />
        <label htmlFor="featured" className="text-sm font-semibold cursor-pointer">
          Featured
        </label>
      </div>

      <div>
        <label className="block text-sm font-semibold mb-2">Original Publish Date</label>
        <input
          type="datetime-local"
          value={formData.original_publish_date || ""}
          onChange={e => onFieldChange("original_publish_date", e.target.value)}
          className="w-full px-3 py-2 border border-border bg-background"
        />
      </div>

      <div>
        <label className="block text-sm font-semibold mb-2">Tags (comma-separated)</label>
        <input
          type="text"
          value={(formData.tags || []).join(", ")}
          onChange={e => onFieldChange("tags", e.target.value.split(",").map(t => t.trim()).filter(Boolean))}
          placeholder="tag1, tag2, tag3"
          className="w-full px-3 py-2 border border-border bg-background"
        />
      </div>
    </div>
  )
}

function ArchiveEditorSEO({ formData, onFieldChange }: any) {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-semibold mb-2">SEO Title</label>
        <div>
          <input
            type="text"
            value={formData.seo_title || ""}
            onChange={e => onFieldChange("seo_title", e.target.value)}
            placeholder="SEO optimized title (60 chars)"
            maxLength={60}
            className="w-full px-3 py-2 border border-border bg-background"
          />
          <p className="text-xs text-muted-foreground mt-1">{(formData.seo_title || "").length}/60</p>
        </div>
      </div>

      <div>
        <label className="block text-sm font-semibold mb-2">SEO Description</label>
        <div>
          <textarea
            value={formData.seo_description || ""}
            onChange={e => onFieldChange("seo_description", e.target.value)}
            placeholder="SEO description (160 chars)"
            maxLength={160}
            rows={4}
            className="w-full px-3 py-2 border border-border bg-background"
          />
          <p className="text-xs text-muted-foreground mt-1">{(formData.seo_description || "").length}/160</p>
        </div>
      </div>

      <div>
        <label className="block text-sm font-semibold mb-2">Open Graph Image URL</label>
        <input
          type="url"
          value={formData.og_image_url || ""}
          onChange={e => onFieldChange("og_image_url", e.target.value)}
          placeholder="https://..."
          className="w-full px-3 py-2 border border-border bg-background"
        />
      </div>
    </div>
  )
}

function ArchiveEditorTimeline({ formData, onFieldChange }: any) {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-semibold mb-2">Timeline Date</label>
        <input
          type="date"
          value={formData.timeline_date || ""}
          onChange={e => onFieldChange("timeline_date", e.target.value)}
          className="w-full px-3 py-2 border border-border bg-background"
        />
      </div>

      <div>
        <label className="block text-sm font-semibold mb-2">Show Title (if Show Notes)</label>
        <input
          type="text"
          value={formData.show_title || ""}
          onChange={e => onFieldChange("show_title", e.target.value)}
          placeholder="e.g., The Daily Show"
          className="w-full px-3 py-2 border border-border bg-background"
        />
      </div>

      <div>
        <label className="block text-sm font-semibold mb-2">Episode Date</label>
        <input
          type="datetime-local"
          value={formData.episode_date || ""}
          onChange={e => onFieldChange("episode_date", e.target.value)}
          className="w-full px-3 py-2 border border-border bg-background"
        />
      </div>
    </div>
  )
}

function ArchiveEditorPreview({ formData }: any) {
  return (
    <div className="border border-border p-6 bg-muted/30">
      <div className="space-y-4">
        <div>
          <h3 className="text-2xl font-bold">{formData.title || "Untitled"}</h3>
          {formData.subtitle && <p className="text-muted-foreground">{formData.subtitle}</p>}
        </div>
        {formData.excerpt && <p className="italic text-muted-foreground">{formData.excerpt}</p>}
        <div className="prose max-w-none">
          <p className="text-sm text-muted-foreground whitespace-pre-wrap">{formData.body || "No content yet"}</p>
        </div>
      </div>
    </div>
  )
}

function ArchiveEditorSettings({ formData, onFieldChange, onSchedule }: any) {
  const [scheduledDate, setScheduledDate] = useState("")

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-semibold mb-2">Status</label>
        <select
          value={formData.status || "draft"}
          onChange={e => onFieldChange("status", e.target.value)}
          className="w-full px-3 py-2 border border-border bg-background"
        >
          <option value="draft">Draft</option>
          <option value="published">Published</option>
          <option value="scheduled">Scheduled</option>
          <option value="hidden">Hidden</option>
          <option value="archived">Archived</option>
        </select>
      </div>

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="include_rss"
          checked={formData.include_in_rss !== false}
          onChange={e => onFieldChange("include_in_rss", e.target.checked)}
          className="h-4 w-4"
        />
        <label htmlFor="include_rss" className="text-sm font-semibold cursor-pointer">
          Include in RSS Feed
        </label>
      </div>

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="public_archive"
          checked={formData.public_archive !== false}
          onChange={e => onFieldChange("public_archive", e.target.checked)}
          className="h-4 w-4"
        />
        <label htmlFor="public_archive" className="text-sm font-semibold cursor-pointer">
          Include in Public Archive
        </label>
      </div>

      {formData.status === "scheduled" && (
        <div>
          <label className="block text-sm font-semibold mb-2">Schedule For</label>
          <div className="flex gap-2">
            <input
              type="datetime-local"
              value={scheduledDate}
              onChange={e => setScheduledDate(e.target.value)}
              className="flex-1 px-3 py-2 border border-border bg-background"
            />
            <button
              onClick={() => {
                if (scheduledDate) {
                  onSchedule(new Date(scheduledDate).toISOString())
                }
              }}
              className="px-4 py-2 bg-primary text-primary-foreground"
            >
              Schedule
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
