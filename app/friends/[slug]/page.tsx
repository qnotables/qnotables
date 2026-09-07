import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ExternalLink, ArrowLeft } from 'lucide-react'
import { getFriendBySlug } from '@/lib/friends'
import { ReportFriendForm } from '@/components/friends/report-friend-form'

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> { const friend = await getFriendBySlug((await params).slug); return friend ? { title: `${friend.name} — QNotables Friends`, description: friend.short_description, openGraph: { title: friend.name, description: friend.short_description, images: friend.logo_url ? [friend.logo_url] : undefined } } : { title: 'Friend not found — QNotables' } }

export default async function FriendDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const friend = await getFriendBySlug((await params).slug)
  if (!friend) notFound()
  return <main className="mx-auto max-w-4xl px-4 py-12 md:px-8"><Link href="/friends" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" /> Back to Friends</Link><article className="mt-8 border border-border bg-card"><div className="aspect-[2/1] max-h-[420px] overflow-hidden bg-muted">{friend.logo_url ? <img src={friend.logo_url} alt={friend.logo_alt ?? `${friend.name} logo`} className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center text-sm text-muted-foreground">NO IMAGE</div>}</div><div className="flex flex-col gap-5 p-6 md:p-10"><div><p className="label-mono text-primary">{friend.friend_categories?.name ?? 'Friend'}</p><h1 className="stencil mt-2 text-4xl">{friend.name}</h1></div><p className="max-w-2xl text-lg leading-8 text-muted-foreground">{friend.short_description}</p><p className="text-sm text-muted-foreground">Added {friend.approved_at ? new Date(friend.approved_at).toLocaleDateString() : 'recently'}</p><a href={friend.url} target="_blank" rel="noopener noreferrer" className="inline-flex w-fit items-center gap-2 bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground">Visit {friend.domain}<ExternalLink className="h-4 w-4" /></a><div className="border-t border-border pt-5"><ReportFriendForm friendId={friend.id} /></div></div></article></main>
}
