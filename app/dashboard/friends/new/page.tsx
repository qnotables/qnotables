import { redirect } from 'next/navigation'
import { getCurrentUser, getFriendCategories } from '@/lib/friends'
import { FriendForm } from '@/components/friends/friend-form'

export default async function NewFriendPage() {
  const { user } = await getCurrentUser()
  if (!user) redirect('/dashboard/login')
  return <div className="mx-auto max-w-4xl"><FriendForm categories={await getFriendCategories()} /></div>
}
