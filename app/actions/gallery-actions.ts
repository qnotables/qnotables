'use server'

import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'

export interface GalleryImage {
  id: string
  user_id: string
  title: string
  description?: string
  alt_text: string
  image_url: string
  file_type?: string
  approved: boolean
  featured: boolean
  created_at: string
  updated_at: string
  uploaderUsername?: string
}

export async function fetchApprovedGalleryImages(
  limit: number = 20,
  offset: number = 0
): Promise<GalleryImage[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('gallery_images')
    .select('*')
    .eq('approved', true)
    .order('featured', { ascending: false })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (error) {
    console.error('[gallery] Error fetching images:', error)
    return []
  }

  return (data || []) as GalleryImage[]
}

export async function uploadGalleryImage(
  imageUrl: string,
  title: string,
  description: string,
  altText: string
): Promise<{ success: boolean; id?: string; error?: string }> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: 'Not authenticated' }
  }

  const { data, error } = await supabase.from('gallery_images').insert([
    {
      user_id: user.id,
      image_url: imageUrl,
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
    console.error('[gallery] Error uploading image:', error)
    return { success: false, error: error.message }
  }

  return { success: true, id: data?.id }
}

/**
 * Fetch images from media_assets (the shared media library).
 * Maps media_assets columns → GalleryImage shape so the carousel can render them.
 */
export async function fetchMediaLibraryImages(
  limit: number = 40,
  offset: number = 0
): Promise<GalleryImage[]> {
  const admin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data, error } = await admin
    .from('media_assets')
    .select('id, file_name, file_url, alt_text, file_type, uploaded_by, created_at')
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (error) {
    console.error('[gallery] Error fetching media library:', error)
    return []
  }

  const rows = data ?? []
  const legacyUrls = rows
    .filter((row: any) => !row.uploaded_by)
    .map((row: any) => row.file_url)
  const { data: legacyGalleryRows } = legacyUrls.length
    ? await admin.from('gallery_images').select('image_url, user_id').in('image_url', legacyUrls)
    : { data: [] }
  const legacyUploaderByUrl = new Map(
    (legacyGalleryRows ?? []).map((row: any) => [row.image_url, row.user_id]),
  )
  const uploaderIds = Array.from(
    new Set(
      rows
        .map((row: any) => row.uploaded_by || legacyUploaderByUrl.get(row.file_url))
        .filter(Boolean),
    ),
  )
  const { data: profiles } = uploaderIds.length
    ? await admin.from('profiles').select('id, username, display_name').in('id', uploaderIds)
    : { data: [] }
  const uploaderNames = new Map<string, string>()

  for (const profile of profiles ?? []) {
    const username = profile.username || profile.display_name
    if (username) uploaderNames.set(profile.id, username)
  }

  // Map media_assets row → GalleryImage
  return rows.map((row: any) => {
    const uploaderId = row.uploaded_by || legacyUploaderByUrl.get(row.file_url)
    return {
      id: row.id,
      user_id: uploaderId ?? '',
      title: row.file_name ?? 'Untitled',
      description: undefined,
      alt_text: row.alt_text ?? row.file_name ?? 'Media item',
      image_url: row.file_url,
      file_type: row.file_type ?? 'image/jpeg',
      approved: true,
      featured: false,
      created_at: row.created_at,
      updated_at: row.created_at,
      uploaderUsername: uploaderId ? uploaderNames.get(uploaderId) : undefined,
    }
  })
}

export async function deleteGalleryImage(
  imageId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: 'Not authenticated' }
  }

  // Only allow deletion of own images
  const { data: image, error: fetchError } = await supabase
    .from('gallery_images')
    .select('user_id')
    .eq('id', imageId)
    .single()

  if (fetchError || image?.user_id !== user.id) {
    return { success: false, error: 'Not authorized' }
  }

  const { error: deleteError } = await supabase
    .from('gallery_images')
    .delete()
    .eq('id', imageId)

  if (deleteError) {
    console.error('[gallery] Error deleting image:', deleteError)
    return { success: false, error: deleteError.message }
  }

  return { success: true }
}
