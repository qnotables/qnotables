import { redirect } from 'next/navigation'
import { getCurrentUser, getFriendCategories } from '@/lib/friends'
import { FriendForm } from '@/components/friends/friend-form'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'

export const metadata = {
  title: 'Submit a Friend — QNotables',
  description: 'Submit a trusted community, creator, organization, or website to the QNotables Friends directory.',
}

export default async function SubmitFriendPage() {
  const { user } = await getCurrentUser()
  if (!user) redirect('/auth/login?next=/friends/submit')

  return (
    <div id="top" className="flex min-h-screen flex-col tactical-grid">
      <SiteHeader />
      <main className="flex-1">
        <div className="mx-auto max-w-4xl px-4 py-12 md:px-8">
          <div className="mb-8">
            <p className="label-mono text-primary">COMMUNITY DIRECTORY</p>
            <h1 className="stencil mt-2 text-4xl">Submit a Friend</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
              Share a trusted community, creator, organization, or place worth visiting. Every submission is reviewed before it appears publicly.
            </p>
          </div>
          <FriendForm categories={await getFriendCategories()} returnHref="/friends" />
        </div>
      </main>
      <SiteFooter />
    </div>
  )
}
