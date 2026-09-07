import "server-only"

import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"

export type FriendStatus = "draft" | "pending" | "approved" | "rejected" | "needs_changes" | "archived"

export type Friend = {
  id: string
  owner_id: string
  name: string
  slug: string
  url: string
  normalized_url: string
  domain: string
  short_description: string
  category_id: string | null
  logo_url: string | null
  logo_alt: string | null
  social_links: Record<string, string>
  contact_email: string | null
  permission_confirmed: boolean
  status: FriendStatus
  moderation_notes: string | null
  moderation_reason: string | null
  featured: boolean
  flagged: boolean
  submitted_at: string | null
  approved_at: string | null
  created_at: string
  updated_at: string
  friend_categories?: { name: string; slug: string } | null
}

export type FriendCategory = {
  id: string
  name: string
  slug: string
  description: string | null
  is_active: boolean
  sort_order: number
}

export function normalizeUrl(raw: string) {
  const value = raw.trim()
  const parsed = new URL(/^https?:\/\//i.test(value) ? value : `https://${value}`)
  if (!['http:', 'https:'].includes(parsed.protocol)) throw new Error('Use an http or https URL.')
  parsed.hash = ''
  parsed.hostname = parsed.hostname.toLowerCase()
  return { url: parsed.toString(), normalizedUrl: parsed.toString().replace(/\/$/, ''), domain: parsed.hostname.replace(/^www\./, '') }
}

export function makeSlug(name: string) {
  const slug = name.toLowerCase().normalize('NFKD').replace(/[^\w\s-]/g, '').trim().replace(/[\s_-]+/g, '-').replace(/^-+|-+$/g, '')
  return `${slug || 'friend'}-${crypto.randomUUID().slice(0, 8)}`
}

export function cleanText(value: unknown, max: number) {
  return String(value ?? '').replace(/[<>]/g, '').replace(/\s+/g, ' ').trim().slice(0, max)
}

export async function getCurrentUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return { supabase, user }
}

export async function getPublicFriends(options?: { search?: string; category?: string; sort?: string }) {
  const supabase = await createClient()
  let query = supabase.from('friends').select('*, friend_categories(name, slug)').eq('status', 'approved').eq('flagged', false)
  if (options?.search) query = query.or(`name.ilike.%${options.search}%,short_description.ilike.%${options.search}%,domain.ilike.%${options.search}%`)
  if (options?.category) query = query.eq('friend_categories.slug', options.category)
  if (options?.sort === 'alphabetical') query = query.order('name', { ascending: true })
  else if (options?.sort === 'newest') query = query.order('approved_at', { ascending: false })
  else query = query.order('featured', { ascending: false }).order('approved_at', { ascending: false })
  const { data, error } = await query
  if (error) throw error
  return (data ?? []) as Friend[]
}

export async function getFriendCategories() {
  const supabase = await createClient()
  const { data, error } = await supabase.from('friend_categories').select('*').eq('is_active', true).order('sort_order')
  if (error) throw error
  return (data ?? []) as FriendCategory[]
}

export async function getFriendBySlug(slug: string) {
  const supabase = await createClient()
  const { data, error } = await supabase.from('friends').select('*, friend_categories(name, slug)').eq('slug', slug).eq('status', 'approved').eq('flagged', false).maybeSingle()
  if (error) throw error
  return data as Friend | null
}

export async function getMyFriends() {
  const { supabase, user } = await getCurrentUser()
  if (!user) return []
  const { data, error } = await supabase.from('friends').select('*, friend_categories(name, slug)').eq('owner_id', user.id).order('updated_at', { ascending: false })
  if (error) throw error
  return (data ?? []) as Friend[]
}

export async function getAdminFriends(status?: string) {
  const supabase = createAdminClient()
  let query = supabase.from('friends').select('*, friend_categories(name, slug)').order('updated_at', { ascending: false })
  if (status && status !== 'all') query = query.eq(status === 'flagged' ? 'flagged' : 'status', status === 'flagged' ? true : status)
  const { data, error } = await query
  if (error) throw error
  return (data ?? []) as Friend[]
}
