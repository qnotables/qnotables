"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { getAdminUser } from "@/lib/admin"
import { cleanText, makeSlug, normalizeUrl, type FriendStatus } from "@/lib/friends"

export type FriendFormState = { error?: string; success?: string; friendId?: string }

function formValue(formData: FormData, key: string) {
  return String(formData.get(key) ?? '')
}

async function currentUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return { supabase, user }
}

export async function saveFriend(previous: FriendFormState, formData: FormData): Promise<FriendFormState> {
  const { supabase, user } = await currentUser()
  if (!user) return { error: 'Please sign in before saving a Friend.' }
  const name = cleanText(formValue(formData, 'name'), 120)
  const description = cleanText(formValue(formData, 'short_description'), 280)
  const contactEmail = cleanText(formValue(formData, 'contact_email'), 160)
  const logoUrl = cleanText(formValue(formData, 'logo_url'), 500)
  const logoAlt = cleanText(formValue(formData, 'logo_alt') || `${name} logo`, 160)
  const categoryId = cleanText(formValue(formData, 'category_id'), 80) || null
  const friendId = cleanText(formValue(formData, 'friend_id'), 80) || null
  const draft = formValue(formData, 'intent') !== 'submit'
  const permission = formData.get('permission_confirmed') === 'on'
  if (name.length < 2) return { error: 'Enter a name between 2 and 120 characters.' }
  if (description.length < 10) return { error: 'Add a short description of at least 10 characters.' }
  let normalized
  try { normalized = normalizeUrl(formValue(formData, 'url')) } catch { return { error: 'Enter a valid http or https URL.' } }
  if (!draft && !permission) return { error: 'Confirm that you have permission to submit this link and image.' }
  const socialLinks = ['instagram', 'youtube', 'x', 'discord'].reduce<Record<string, string>>((result, key) => {
    const value = cleanText(formValue(formData, `social_${key}`), 240)
    if (!value) return result
    try {
      const parsed = new URL(value)
      if (['http:', 'https:'].includes(parsed.protocol)) result[key] = parsed.toString()
    } catch {
      // Ignore malformed optional social links rather than persisting unsafe input.
    }
    return result
  }, {})
  const payload = { name, url: normalized.url, normalized_url: normalized.normalizedUrl, domain: normalized.domain, short_description: description, category_id: categoryId, logo_url: logoUrl || null, logo_alt: logoAlt || null, social_links: socialLinks, contact_email: contactEmail || null, permission_confirmed: permission, status: draft ? 'draft' : 'pending', submitted_at: draft ? null : new Date().toISOString(), updated_at: new Date().toISOString() }
  let result
  if (friendId) {
    const existing = await supabase.from('friends').select('status, owner_id').eq('id', friendId).eq('owner_id', user.id).maybeSingle()
    if (existing.error || !existing.data) return { error: 'Friend listing not found.' }
    if (!['draft', 'rejected', 'needs_changes'].includes(existing.data.status)) return { error: 'Only drafts or returned listings can be edited.' }
    result = await supabase.from('friends').update(payload).eq('id', friendId).eq('owner_id', user.id).select('id').single()
  } else {
    result = await supabase.from('friends').insert({ ...payload, owner_id: user.id, slug: makeSlug(name) }).select('id').single()
  }
  if (result.error) return { error: result.error.message.includes('unique') ? 'A Friend with this URL is already listed.' : 'Unable to save this Friend right now.' }
  revalidatePath('/dashboard/friends')
  revalidatePath('/friends')
  return { success: draft ? 'Draft saved.' : 'Submitted for review.', friendId: result.data.id }
}

export async function archiveFriend(friendId: string) {
  const { supabase, user } = await currentUser()
  if (!user) return { error: 'Please sign in.' }
  const { error } = await supabase.from('friends').update({ status: 'archived', updated_at: new Date().toISOString() }).eq('id', friendId).eq('owner_id', user.id).eq('status', 'approved')
  if (error) return { error: 'Unable to archive this Friend.' }
  revalidatePath('/dashboard/friends'); revalidatePath('/friends'); return { success: 'Friend archived.' }
}

export async function deleteDraft(friendId: string) {
  const { supabase, user } = await currentUser()
  if (!user) return { error: 'Please sign in.' }
  const { error } = await supabase.from('friends').delete().eq('id', friendId).eq('owner_id', user.id).eq('status', 'draft')
  if (error) return { error: 'Unable to delete this draft.' }
  revalidatePath('/dashboard/friends'); return { success: 'Draft deleted.' }
}

export async function moderateFriend(friendId: string, status: Exclude<FriendStatus, 'draft' | 'pending'>, reason: string) {
  const admin = await getAdminUser()
  if (!admin) return { error: 'Admin access required.' }
  if (['rejected', 'needs_changes'].includes(status) && cleanText(reason, 500).length < 5) return { error: 'A written reason is required.' }
  const client = createAdminClient()
  const { data: friend } = await client.from('friends').select('owner_id, status, name').eq('id', friendId).single()
  if (!friend) return { error: 'Friend not found.' }
  const update: Record<string, unknown> = { status, moderation_reason: cleanText(reason, 500) || null, moderated_by: admin.id, moderated_at: new Date().toISOString(), updated_at: new Date().toISOString(), approved_at: status === 'approved' ? new Date().toISOString() : null }
  const { error } = await client.from('friends').update(update).eq('id', friendId)
  if (error) return { error: 'Unable to update moderation status.' }
  await client.from('friend_audit_logs').insert({ friend_id: friendId, actor_id: admin.id, action: status, from_status: friend.status, to_status: status, reason: cleanText(reason, 500) || null })
  await client.from('friend_notifications').insert({ user_id: friend.owner_id, friend_id: friendId, type: status, title: `Friend listing ${status.replace('_', ' ')}`, message: status === 'approved' ? `${friend.name} is now live in the Friends directory.` : `Your Friend listing was ${status.replace('_', ' ')}.${reason ? ` Note: ${cleanText(reason, 300)}` : ''}` })
  revalidatePath('/admin/friends'); revalidatePath('/friends'); revalidatePath('/dashboard/friends')
  return { success: `Friend ${status.replace('_', ' ')}.` }
}

export async function setFriendFlag(friendId: string, flagged: boolean) {
  const admin = await getAdminUser()
  if (!admin) return { error: 'Admin access required.' }
  const client = createAdminClient()
  const { error } = await client.from('friends').update({ flagged, updated_at: new Date().toISOString() }).eq('id', friendId)
  if (error) return { error: 'Unable to update flag.' }
  await client.from('friend_audit_logs').insert({ friend_id: friendId, actor_id: admin.id, action: flagged ? 'flagged' : 'unflagged' })
  revalidatePath('/admin/friends'); revalidatePath('/friends'); return { success: flagged ? 'Listing flagged.' : 'Flag removed.' }
}

export async function reportFriend(friendId: string, reason: string, details: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const allowed = ['broken_link', 'impersonation', 'spam', 'inappropriate', 'other']
  if (!allowed.includes(reason)) return { error: 'Choose a valid report reason.' }
  const { error } = await supabase.from('friend_reports').insert({ friend_id: friendId, reporter_id: user?.id ?? null, reason, details: cleanText(details, 500) || null })
  if (error) return { error: 'Unable to submit report.' }
  return { success: 'Thanks. Your report was sent to the moderation team.' }
}
