import { NextRequest, NextResponse } from 'next/server'
import { put } from '@vercel/blob'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'

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
    const altText = (formData.get('altText') as string) || 'Gallery image'

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { error: 'File must be an image' },
        { status: 400 }
      )
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'File too large (max 10MB)' },
        { status: 400 }
      )
    }

    // Upload to Vercel Blob
    const filename = `gallery/${user.id}/${Date.now()}-${file.name.replace(/\s+/g, '-')}`
    const blob = await put(filename, file, {
      access: 'public',
      addRandomSuffix: false,
    })

    // Store metadata in Supabase
    const { data, error } = await supabase
      .from('gallery_images')
      .insert([
        {
          user_id: user.id,
          image_url: blob.url,
          title: title || 'Untitled',
          description: description || null,
          alt_text: altText || 'Gallery image',
          approved: false,
          featured: false,
        },
      ])
      .select('id')
      .single()

    if (error) {
      console.error('[gallery] Error saving image metadata:', error)
      return NextResponse.json(
        { error: 'Failed to save image metadata' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      id: data?.id,
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
