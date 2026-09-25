import Link from "next/link"
import Image from "next/image"
import { CalendarDays, ExternalLink, Flag, ImageIcon, MapPin, MessageCircle, Pin, ShieldCheck, Sparkles } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { buttonVariants } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import type { MockProfile, ProfileTab } from "@/lib/mock-profile"

type ProfilePageProps = { profile: MockProfile; activeTab?: ProfileTab; isOwner?: boolean }

const tabLabels: Array<{ value: ProfileTab; label: string }> = [
  { value: "overview", label: "Overview" },
  { value: "threads", label: "Threads" },
  { value: "replies", label: "Replies" },
  { value: "media", label: "Media" },
  { value: "about", label: "About" },
]

export function ProfilePage({ profile, activeTab = "overview", isOwner = false }: ProfilePageProps) {
  const featured = profile.featured ?? []
  const media = profile.media ?? []
  const activity = activeTab === "replies" ? profile.replies : profile.posts
  const showActivity = profile.privacy.showActivity

  return (
    <div className="min-h-screen bg-background">
      <main className="mx-auto max-w-6xl px-4 py-8 md:px-6 md:py-12">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
          <div><p className="label-mono text-xs text-primary">COMMUNITY PROFILE</p><p className="mt-1 text-sm text-muted-foreground">A member identity and contribution record.</p></div>
          {isOwner && <Link href="/profile/edit" className={buttonVariants({ variant: "outline" })}>Edit profile</Link>}
        </div>

        <Card className="overflow-hidden border-border bg-card">
          <div className="relative h-36 bg-muted md:h-56"><Image src={profile.bannerUrl} alt="Profile banner" fill className="object-cover" sizes="(max-width: 768px) 100vw, 1152px" unoptimized /><div className="absolute inset-0 bg-foreground/15" /></div>
          <CardContent className="relative px-5 pb-6 pt-0 md:px-8 md:pb-8">
            <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
              <div className="flex items-end gap-4"><div className="relative -mt-14 size-28 shrink-0 overflow-hidden rounded-full border-4 border-card bg-muted shadow-sm md:-mt-16 md:size-36"><Image src={profile.avatarUrl} alt={`${profile.displayName} avatar`} fill className="object-cover" sizes="144px" unoptimized /></div><div className="pb-1"><div className="flex flex-wrap items-center gap-2"><h1 className="font-serif text-3xl font-semibold tracking-tight md:text-4xl">{profile.displayName}</h1>{profile.badges[0] && <Badge variant="secondary">{profile.badges[0].label}</Badge>}</div><p className="mt-1 text-sm text-muted-foreground">@{profile.username}</p></div></div>
              <div className="inline-flex items-center gap-2 text-xs text-muted-foreground"><ShieldCheck className="size-4 text-primary" /> Self-described community member</div>
            </div>
            <div className="mt-6 max-w-3xl"><p className="text-lg leading-8 text-foreground/90">{profile.bio}</p><div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted-foreground">{profile.privacy.showLocation && profile.location && <span className="inline-flex items-center gap-1.5"><MapPin className="size-4" />{profile.location}</span>}<span className="inline-flex items-center gap-1.5"><CalendarDays className="size-4" />{profile.joined}</span>{profile.website && <a href={profile.website.startsWith("http") ? profile.website : `https://${profile.website}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-primary hover:underline"><ExternalLink className="size-4" />{profile.website}</a>}</div></div>
            <div className="mt-7 grid grid-cols-2 gap-4 border-t border-border pt-5 sm:grid-cols-5">{([[profile.stats.posts, "Threads"], [profile.stats.replies, "Replies"], [profile.stats.helpful, "Helpful"], [profile.stats.topics, "Topics"], [profile.stats.views, "Views"]] as Array<[number, string]>).map(([value, label]) => <div key={label}><p className="font-serif text-2xl font-semibold">{value}</p><p className="label-mono mt-1 text-[10px] text-muted-foreground">{label}</p></div>)}</div>
          </CardContent>
        </Card>

        <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_280px]">
          <section>
            <nav aria-label="Profile sections" className="flex gap-1 overflow-x-auto border-b border-border">{tabLabels.map((tab) => <Link key={tab.value} href={`/profile?tab=${tab.value}`} className={`whitespace-nowrap border-b-2 px-4 py-3 text-sm font-medium transition-colors ${activeTab === tab.value ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"}`}>{tab.label}</Link>)}</nav>
            {activeTab === "about" ? <AboutPanel profile={profile} /> : activeTab === "media" ? <MediaPanel media={media} /> : activeTab === "overview" ? <OverviewPanel profile={profile} featured={featured} showActivity={showActivity} /> : !showActivity ? <EmptyProfileState title="Activity is private" body="This member has chosen not to show activity on their public profile." /> : <ActivityPanel profile={profile} activeTab={activeTab} activity={activity} />}
          </section>
          <aside className="flex flex-col gap-4"><Card><CardHeader><CardTitle className="text-base">Areas of contribution</CardTitle><CardDescription>Self-selected interests, not verified credentials.</CardDescription></CardHeader><CardContent className="flex flex-wrap gap-2">{profile.topics.map((topic) => <Link key={topic} href={`/search?q=${encodeURIComponent(topic)}`}><Badge variant="secondary" className="cursor-pointer hover:bg-primary/15">{topic}</Badge></Link>)}</CardContent></Card><Card><CardHeader><CardTitle className="text-base">Community signals</CardTitle></CardHeader><CardContent className="flex flex-col gap-3">{profile.badges.map((badge) => <div key={badge.label} className="flex gap-3"><Sparkles className="mt-0.5 size-4 text-primary" /><div><p className="text-sm font-medium">{badge.label}</p><p className="text-xs leading-5 text-muted-foreground">{badge.detail}</p></div></div>)}</CardContent></Card><div className="flex items-center gap-2 px-1 text-xs text-muted-foreground"><Flag className="size-3.5" /> See something off? <button type="button" className="text-primary hover:underline">Report profile</button></div></aside>
        </div>
      </main>
    </div>
  )
}

function OverviewPanel({ profile, featured, showActivity }: { profile: MockProfile; featured: NonNullable<MockProfile["featured"]>; showActivity: boolean }) {
  return <div className="flex flex-col gap-6 pt-5"><Card><CardHeader><CardTitle className="font-serif text-xl">About {profile.displayName}</CardTitle><CardDescription>A short introduction shared on their terms.</CardDescription></CardHeader><CardContent><p className="leading-7 text-foreground/85">{profile.bio}</p></CardContent></Card><FeaturedPanel items={featured} />{showActivity && <Card><CardHeader><CardTitle className="font-serif text-xl">Recent activity</CardTitle></CardHeader><CardContent className="grid gap-3 sm:grid-cols-2">{profile.posts.slice(0, 4).map((item) => <Link key={item.title} href="/profile?tab=threads" className="border border-border p-4 transition-colors hover:border-primary"><Badge variant="outline">{item.topic}</Badge><p className="mt-3 font-medium">{item.title}</p><p className="mt-1 text-sm leading-6 text-muted-foreground">{item.excerpt}</p></Link>)}</CardContent></Card>}</div>
}

function FeaturedPanel({ items }: { items: NonNullable<MockProfile["featured"]> }) {
  return <section><div className="mb-3 flex items-center gap-2"><Pin className="size-4 text-primary" /><h2 className="font-serif text-xl font-semibold">Featured contributions</h2></div>{items.length === 0 ? <Card className="border-dashed"><CardContent className="py-10 text-center text-sm text-muted-foreground">No featured contributions yet.</CardContent></Card> : <div className="grid gap-4 md:grid-cols-3">{items.map((item) => <Link key={item.id} href={item.href} className="group border border-border bg-card p-4 transition-colors hover:border-primary"><Badge variant="outline">{item.type}</Badge><h3 className="mt-3 font-serif text-lg leading-tight group-hover:text-primary">{item.title}</h3><p className="mt-2 line-clamp-3 text-sm leading-6 text-muted-foreground">{item.excerpt}</p><p className="label-mono mt-4 text-[10px] text-muted-foreground">{new Date(item.date).toLocaleDateString()}</p></Link>)}</div>}
</section>
}

function ActivityPanel({ profile, activeTab, activity }: { profile: MockProfile; activeTab: ProfileTab; activity: MockProfile["posts"] | MockProfile["replies"] }) {
  return <div className="flex flex-col gap-4 pt-5">{activity.length === 0 ? <EmptyProfileState title={`No ${activeTab} yet`} body="Public contributions will appear here when this member adds them." /> : activity.map((item) => <Card key={`${item.title}-${item.date}`} className="transition-colors hover:border-primary/50"><CardHeader><div className="flex items-center justify-between gap-3"><Badge variant="outline">{item.topic}</Badge><span className="text-xs text-muted-foreground">{item.date}</span></div><CardTitle className="font-serif text-xl leading-tight">{item.title}</CardTitle><CardDescription className="leading-6">{item.excerpt}</CardDescription></CardHeader><CardContent className="pt-0 text-xs text-muted-foreground">{"replies" in item ? `${item.replies} replies` : <span className="inline-flex items-center gap-1"><MessageCircle className="size-3.5" /> Reply in a discussion</span>}</CardContent></Card>)}</div>
}

function MediaPanel({ media }: { media: NonNullable<MockProfile["media"]> }) {
  return <div className="grid grid-cols-2 gap-3 pt-5 sm:grid-cols-3">{media.length === 0 ? <div className="col-span-full"><EmptyProfileState title="No public media yet" body="Approved uploads will appear here." /></div> : media.map((item) => <a key={item.id} href={item.href ?? item.imageUrl} target={item.href ? undefined : "_blank"} rel={item.href ? undefined : "noopener noreferrer"} className="group overflow-hidden border border-border bg-card"><div className="relative aspect-[4/3] bg-muted"><Image src={item.imageUrl} alt={item.altText} fill className="object-cover transition-transform group-hover:scale-105" sizes="(max-width: 640px) 50vw, 33vw" unoptimized /></div><div className="p-3"><p className="truncate text-sm font-medium">{item.title}</p><p className="label-mono mt-1 text-[10px] text-muted-foreground">{new Date(item.date).toLocaleDateString()}</p></div></a>)}</div>
}

function AboutPanel({ profile }: { profile: MockProfile }) {
  return <Card className="mt-5"><CardHeader><CardTitle className="font-serif text-xl">About {profile.displayName}</CardTitle><CardDescription>Details shared publicly by this member.</CardDescription></CardHeader><CardContent className="grid gap-5 sm:grid-cols-2"><div><p className="label-mono text-[10px] text-muted-foreground">PRONOUNS</p><p className="mt-1 text-sm">{profile.pronouns || "Not provided"}</p></div><div><p className="label-mono text-[10px] text-muted-foreground">MEMBER SINCE</p><p className="mt-1 text-sm">{profile.joined.replace("Joined ", "")}</p></div><div className="sm:col-span-2"><p className="label-mono text-[10px] text-muted-foreground">ELSEWHERE</p>{profile.socialLinks.length > 0 ? <div className="mt-2 flex flex-wrap gap-3">{profile.socialLinks.map((link) => <a key={link} href={link.startsWith("http") ? link : `https://${link}`} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline">{link}</a>)}</div> : <p className="mt-2 text-sm text-muted-foreground">No public links yet.</p>}</div></CardContent></Card>
}

function EmptyProfileState({ title, body }: { title: string; body: string }) {
  return <Card className="mt-5 border-dashed"><CardContent className="flex flex-col items-center justify-center px-6 py-16 text-center"><ImageIcon className="size-8 text-muted-foreground" /><h2 className="mt-4 font-serif text-xl font-semibold">{title}</h2><p className="mt-2 max-w-sm text-sm leading-6 text-muted-foreground">{body}</p></CardContent></Card>
}
