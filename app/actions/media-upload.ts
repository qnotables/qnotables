'use server'

import { v4 as uuidv4 } from 'uuid'
import { put, del } from '@vercel/blob'
import { createClient } from '@supabase/supabase-js'

function getSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('Supabase not configured')
  return createClient(url, key)
}

export interface UploadedFile {
  id: string
  filename: string
  original_name: string
  media_type: 'image' | 'document' | 'video' | 'audio'
  file_size: number
  mime_type: string
  storage_path: string
  alt_text?: string
}

// Allowed media types and extensions
const ALLOWED_TYPES = {
  image: ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml'],
  document: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'],
  video: ['video/mp4', 'video/webm', 'video/quicktime'],
  audio: ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/webm'],
}

const MAX_FILE_SIZES = {
  image: 10 * 1024 * 1024, // 10MB
  document: 50 * 1024 * 1024, // 50MB
  video: 500 * 1024 * 1024, // 500MB
  audio: 100 * 1024 * 1024, // 100MB
}

function getMediaType(mimeType: string): 'image' | 'document' | 'video' | 'audio' | null {
  for (const [type, mimes] of Object.entries(ALLOWED_TYPES)) {
    if (mimes.includes(mimeType)) {
      return type as 'image' | 'document' | 'video' | 'audio'
    }
  }
  return null
}

export async function uploadMediaToBlob(
  file: File,
  altText?: string
): Promise<UploadedFile> {
  try {
    // Validate file type
    const mediaType = getMediaType(file.type)
    if (!mediaType) {
      throw new Error(`Unsupported file type: ${file.type}`)
    }

    // Validate file size
    const maxSize = MAX_FILE_SIZES[mediaType]
    if (file.size > maxSize) {
      throw new Error(`File too large. Maximum size for ${mediaType}: ${maxSize / 1024 / 1024}MB`)
    }

    // Generate unique filename
    const id = uuidv4()
    const ext = file.name.split('.').pop() || 'file'
    const filename = `${id}.${ext}`
    const storagePath = `archive-media/${mediaType}/${filename}`

    // Upload to Vercel Blob
    const blob = await put(storagePath, file, {
      access: 'public',
      addRandomSuffix: false,
    })

    // Save metadata to Supabase
    const supabase = getSupabaseClient()
    const { data, error } = await supabase
      .from('archive_media')
      .insert([
        {
          id,
          filename,
          original_name: file.name,
          media_type: mediaType,
          file_size: file.size,
          mime_type: file.type,
          storage_path: blob.pathname,
          alt_text: altText || undefined,
        },
      ])
      .select()
      .single()

    if (error) throw error

    return {
      id: data.id,
      filename: data.filename,
      original_name: data.original_name,
      media_type: data.media_type,
      file_size: data.file_size,
      mime_type: data.mime_type,
      storage_path: blob.pathname,
      alt_text: data.alt_text,
    }
  } catch (error) {
    console.error('Media upload error:', error)
    throw error
  }
}

export async function deleteMediaFile(storagePath: string): Promise<void> {
  try {
    // Delete from Blob
    await del(storagePath)

    // Delete from Supabase
    const supabase = getSupabaseClient()
    await supabase.from('archive_media').delete().eq('storage_path', storagePath)
  } catch (error) {
    console.error('Media deletion error:', error)
    throw error
  }
}

export async function getMediaLibrary(): Promise<UploadedFile[]> {
  try {
    const supabase = getSupabaseClient()
    const { data, error } = await supabase
      .from('archive_media')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error

    return (data || []).map((item: any) => ({
      id: item.id,
      filename: item.filename,
      original_name: item.original_name,
      media_type: item.media_type,
      file_size: item.file_size,
      mime_type: item.mime_type,
      storage_path: item.storage_path,
      alt_text: item.alt_text,
    }))
  } catch (error) {
    console.error('Error fetching media library:', error)
    throw error
  }
}

export async function updateMediaAltText(id: string, altText: string): Promise<void> {
  try {
    const supabase = getSupabaseClient()
    const { error } = await supabase
      .from('archive_media')
      .update({ alt_text: altText })
      .eq('id', id)

    if (error) throw error
  } catch (error) {
    console.error('Error updating alt text:', error)
    throw error
  }
}
