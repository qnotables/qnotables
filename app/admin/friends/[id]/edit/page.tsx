import { notFound, redirect } from 'next/navigation'
import { getAdminUser } from '@/lib/admin'
import { getAdminFriend, getFriendCategories } from '@/lib/friends'
import { FriendForm } from '@/components/friends/friend-form'

export default async function AdminEditFriendPage({ params }: { params: Promise<{ id: string }> }) {
  const admin = await getAdminUser()
  if (!admin) redirect('/dashboard/login')
  const { id } = await params
  const [friend, categories] = await Promise.all([getAdminFriend(id), getFriendCategories()])
  if (!friend) notFound()
  return <div className="mx-auto max-w-4xl"><FriendForm categories={categories} friend={friend} adminMode /></div>
}
