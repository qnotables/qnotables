'use client'

import { useState, useRef } from 'react'
import { Upload, X, Loader2 } from 'lucide-react'

interface GalleryUploadModalProps {
  isOpen: boolean
  onClose: () => void
  onUploadSuccess: () => void
}

export function GalleryUploadModal({
  isOpen,
  onClose,
  onUploadSuccess,
}: GalleryUploadModalProps) {
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string>('')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [altText, setAltText] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (selectedFile: File) => {
    const isImage = selectedFile.type.startsWith('image/')
    const isVideo = selectedFile.type.startsWith('video/')

    if (!isImage && !isVideo) {
      setError('Please select an image or video file')
      return
    }

    const maxSize = isVideo ? 200 * 1024 * 1024 : 10 * 1024 * 1024
    if (selectedFile.size > maxSize) {
      setError(isVideo ? 'Video must be smaller than 200MB' : 'Image must be smaller than 10MB')
      return
    }

    setFile(selectedFile)
    setError('')

    // Create preview URL
    const objectUrl = URL.createObjectURL(selectedFile)
    setPreview(objectUrl)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!file) {
      setError('Please select an image or video')
      return
    }

    if (!altText.trim()) {
      setError('Description is required for accessibility')
      return
    }

    setIsLoading(true)
    setError('')

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('title', title)
      formData.append('description', description)
      formData.append('altText', altText)

      const response = await fetch('/api/gallery/upload', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Upload failed')
      }

      // Reset form
      setFile(null)
      setPreview('')
      setTitle('')
      setDescription('')
      setAltText('')
      onUploadSuccess()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setIsLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-lg border border-border bg-background">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <h2 className="text-lg font-semibold">Upload Media</h2>
          <button
            onClick={onClose}
            className="rounded p-1 hover:bg-muted"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="space-y-4 p-6">
          {/* File upload area */}
          <div>
            <label className="block text-sm font-medium mb-2">Image or Video</label>
            <div
              className="relative flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border bg-muted p-8 cursor-pointer hover:bg-muted/80"
              onClick={() => fileInputRef.current?.click()}
              onDrop={(e) => {
                e.preventDefault()
                const droppedFile = e.dataTransfer.files[0]
                if (droppedFile) handleFileSelect(droppedFile)
              }}
              onDragOver={(e) => e.preventDefault()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,video/*"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0]
                  if (f) handleFileSelect(f)
                }}
              />
              {preview && file ? (
                <>
                  {file.type.startsWith('video/') ? (
                    <video
                      src={preview}
                      className="h-32 max-w-full rounded object-cover"
                      muted
                      playsInline
                      preload="metadata"
                    />
                  ) : (
                    <img
                      src={preview}
                      alt="Preview"
                      className="h-32 w-32 object-cover rounded"
                    />
                  )}
                  <p className="text-xs text-muted-foreground">Click to change</p>
                </>
              ) : (
                <>
                  <Upload className="h-8 w-8 text-muted-foreground" />
                  <p className="text-sm font-medium">Drop image or video here, or click to upload</p>
                  <p className="text-xs text-muted-foreground">Images up to 10MB · Videos up to 200MB</p>
                </>
              )}
            </div>
          </div>

          {/* Title */}
          <div>
            <label htmlFor="title" className="block text-sm font-medium mb-1">
              Title (optional)
            </label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Image title"
              className="w-full rounded border border-border bg-muted px-3 py-2 text-sm"
            />
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium mb-1">
              Description (optional)
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description"
              rows={2}
              className="w-full rounded border border-border bg-muted px-3 py-2 text-sm"
            />
          </div>

          {/* Alt text */}
          <div>
            <label htmlFor="altText" className="block text-sm font-medium mb-1">
              Alt Text <span className="text-red-500">*</span>
            </label>
            <input
              id="altText"
              type="text"
              value={altText}
              onChange={(e) => setAltText(e.target.value)}
              placeholder="Describe the image for accessibility"
              className="w-full rounded border border-border bg-muted px-3 py-2 text-sm"
              required
            />
            <p className="mt-1 text-xs text-muted-foreground">
              Required for accessibility. Describe what the image shows.
            </p>
          </div>

          {/* Error message */}
          {error && (
            <div className="rounded bg-red-500/10 px-3 py-2 text-sm text-red-600">
              {error}
            </div>
          )}

          {/* Buttons */}
          <div className="flex gap-2 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="flex-1 rounded border border-border bg-muted px-4 py-2 text-sm font-medium hover:bg-muted/80 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || !file}
              className="flex-1 rounded bg-foreground px-4 py-2 text-sm font-medium text-background hover:bg-foreground/90 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
              {isLoading ? 'Uploading...' : 'Upload'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
