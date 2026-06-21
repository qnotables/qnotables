'use server'

import { createClient } from '@/lib/supabase/server'
import type { SupabaseClient } from '@supabase/supabase-js'

export interface GalleryImage {
  id: string
  user_id: string
  title: string
  description?: string
  alt_text: string
  image_url: string
  approved: boolean
  featured: boolean
  created_at: string
  updated_at: string
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
