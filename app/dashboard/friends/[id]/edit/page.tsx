import { notFound, redirect } from 'next/navigation'
import { getCurrentUser, getFriendCategories } from '@/lib/friends'
import { FriendForm } from '@/components/friends/friend-form'

export default async function EditFriendPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { supabase, user } = await getCurrentUser()
  if (!user) redirect('/dashboard/login')
  const [{ data: friend }, categories] = await Promise.all([supabase.from('friends').select('*, friend_categories(name, slug)').eq('id', id).eq('owner_id', user.id).maybeSingle(), getFriendCategories()])
  if (!friend) notFound()
  return <div className="mx-auto max-w-4xl"><FriendForm categories={categories} friend={friend} /></div>
}
