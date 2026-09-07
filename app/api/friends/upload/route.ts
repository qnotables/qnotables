import { put } from '@vercel/blob'
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const allowed = new Set(['image/png', 'image/jpeg', 'image/webp'])

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Sign in required.' }, { status: 401 })
  const data = await request.formData()
  const file = data.get('file')
  if (!(file instanceof File)) return NextResponse.json({ error: 'Choose an image.' }, { status: 400 })
  if (!allowed.has(file.type) || file.size > 2 * 1024 * 1024) return NextResponse.json({ error: 'Use a PNG, JPEG, or WebP image up to 2 MB.' }, { status: 400 })
  const extension = file.type.split('/')[1].replace('jpeg', 'jpg')
  const blob = await put(`friends/${user.id}/${crypto.randomUUID()}.${extension}`, file, { access: 'public' })
  return NextResponse.json({ url: blob.url })
}
