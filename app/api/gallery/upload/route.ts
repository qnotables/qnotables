import { NextRequest, NextResponse } from 'next/server'
import { put } from '@vercel/blob'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!
  return createAdminClient(url, key)
}

export async function POST(request: NextRequest) {
  try {
    // Get user auth
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Parse form data
    const formData = await request.formData()
    const file = formData.get('file') as File
    const title = (formData.get('title') as string) || 'Untitled'
    const description = (formData.get('description') as string) || ''
    const altText = (formData.get('altText') as string) || 'Gallery media'

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    const isImage = file.type.startsWith('image/')
    const isVideo = file.type.startsWith('video/')

    // Validate file type — images and videos only
    if (!isImage && !isVideo) {
      return NextResponse.json(
        { error: 'File must be an image or video' },
        { status: 400 }
      )
    }

    // Images: max 10MB, videos: max 200MB
    const maxSize = isVideo ? 200 * 1024 * 1024 : 10 * 1024 * 1024
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: isVideo ? 'Video too large (max 200MB)' : 'Image too large (max 10MB)' },
        { status: 400 }
      )
    }

    // Upload to Vercel Blob under the shared "media" folder
    const filename = `media/${Date.now()}-${file.name.replace(/\s+/g, '-')}`
    const blob = await put(filename, file, {
      access: 'public',
      addRandomSuffix: true,
    })

    const admin = getAdminClient()

    // Write to gallery_images (user-facing, starts unapproved)
    const { data: galleryRow, error: galleryError } = await supabase
      .from('gallery_images')
      .insert([
        {
          user_id: user.id,
          image_url: blob.url,
          title: title || 'Untitled',
          description: description || null,
          alt_text: altText || 'Gallery media',
          approved: false,
          featured: false,
        },
      ])
      .select('id')
      .single()

    if (galleryError) {
      console.error('[gallery] Error saving gallery metadata:', galleryError)
      return NextResponse.json(
        { error: 'Failed to save image metadata' },
        { status: 500 }
      )
    }

    // Also write to media_assets so it appears in the dashboard Media Library
    const { error: mediaError } = await admin.from('media_assets').insert({
      file_name: title || file.name,
      file_url: blob.url,
      file_type: file.type,
      file_size: file.size,
      alt_text: altText || null,
    })

    if (mediaError) {
      // Non-fatal — gallery image is saved; just log the media library write failure
      console.error('[gallery] Failed to mirror to media_assets:', mediaError)
    }

    return NextResponse.json({
      success: true,
      id: galleryRow?.id,
      url: blob.url,
      title,
    })
  } catch (error) {
    console.error('[gallery] Upload error:', error)
    return NextResponse.json(
      { error: 'Failed to upload image' },
      { status: 500 }
    )
  }
}
