'use client'

import { useState, useEffect } from 'react'
import { Plus, LogIn } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { fetchMediaLibraryImages } from '@/app/actions/gallery-actions'
import { GalleryCarousel } from './gallery-carousel'
import { GalleryUploadModal } from './gallery-upload-modal'
import type { GalleryImage } from '@/app/actions/gallery-actions'

export function GallerySection() {
  const [images, setImages] = useState<GalleryImage[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [isCheckingAuth, setIsCheckingAuth] = useState(true)
  const [mounted, setMounted] = useState(false)

  // Guard against SSR/client mismatch — render nothing until after mount
  useEffect(() => {
    setMounted(true)
  }, [])

  // Check authentication
  useEffect(() => {
    const checkAuth = async () => {
      const supabase = createClient()
      const {
        data: { user: currentUser },
      } = await supabase.auth.getUser()
      setUser(currentUser)
      setIsCheckingAuth(false)
    }

    checkAuth()
  }, [])

  // Fetch gallery images
  useEffect(() => {
    const loadImages = async () => {
      setIsLoading(true)
      const data = await fetchMediaLibraryImages(40, 0)
      setImages(data)
      setIsLoading(false)
    }

    loadImages()
  }, [])

  const handleUploadSuccess = async () => {
    // Refresh media library images after successful upload
    const data = await fetchMediaLibraryImages(40, 0)
    setImages(data)
  }

  // Return a static skeleton that matches SSR output until client has mounted
  if (!mounted || isCheckingAuth || isLoading) {
    return (
      <section className="space-y-3 py-6">
        <div className="space-y-1">
          <h2 className="text-lg font-bold tracking-tight">Media Library</h2>
          <p className="text-sm text-muted-foreground">Loading media library...</p>
        </div>
        <div className="h-[160px] animate-pulse border border-border bg-muted" />
      </section>
    )
  }

  return (
    <section className="space-y-3 py-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <h2 className="text-lg font-bold tracking-tight">Media Library</h2>
          <p className="text-xs text-muted-foreground">
            {images.length > 0
              ? `${images.length} image${images.length === 1 ? '' : 's'} from the community`
              : 'No images yet. Be the first to contribute!'}
          </p>
        </div>
        {user ? (
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-1.5 border border-primary bg-primary px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-primary-foreground transition-colors hover:bg-primary/90"
          >
            <Plus className="h-3.5 w-3.5" />
            Add Image
          </button>
        ) : (
          <a
            href="/auth/login"
            className="flex items-center gap-1.5 border border-border px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-muted-foreground transition-colors hover:border-primary hover:text-primary"
          >
            <LogIn className="h-3.5 w-3.5" />
            Sign In to Upload
          </a>
        )}
      </div>

      {/* Carousel or empty state */}
      {images.length > 0 ? (
        <GalleryCarousel images={images} />
      ) : (
        <div className="flex h-[160px] flex-col items-center justify-center gap-3 border-2 border-dashed border-border bg-muted">
          <div className="text-center">
            <p className="text-sm font-medium">No images yet</p>
            <p className="text-xs text-muted-foreground mt-1">
              {user ? 'Click "Add Image" above to contribute.' : 'Sign in to upload the first image.'}
            </p>
          </div>
        </div>
      )}

      {/* Upload modal */}
      {user && (
        <GalleryUploadModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onUploadSuccess={handleUploadSuccess}
        />
      )}
    </section>
  )
}
