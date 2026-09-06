import Link from "next/link"
import Image from "next/image"
import { Bookmark, CalendarDays, ExternalLink, Flag, MapPin, MessageCircle, MoreHorizontal, Pin, ShieldCheck, Sparkles } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import type { MockProfile, ProfileTab } from "@/lib/mock-profile"

type ProfilePageProps = { profile: MockProfile; activeTab?: ProfileTab }

const tabLabels: Array<{ value: ProfileTab; label: string }> = [
  { value: "posts", label: "Posts" },
  { value: "replies", label: "Replies" },
  { value: "saved", label: "Saved" },
  { value: "about", label: "About" },
]

export function ProfilePage({ profile, activeTab = "posts" }: ProfilePageProps) {
  const isEmpty = activeTab === "saved"
  const items = activeTab === "replies" ? profile.replies : profile.posts

  return (
    <div className="min-h-screen bg-background">
      <main className="mx-auto max-w-6xl px-4 py-8 md:px-6 md:py-12">
        <div className="mb-5 flex items-center justify-between gap-4">
          <div>
            <p className="label-mono text-xs text-primary">COMMUNITY PROFILE</p>
            <p className="mt-1 text-sm text-muted-foreground">A quieter place to see what someone is contributing.</p>
          </div>
          <Button asChild variant="outline" size="sm"><Link href="/profile/edit">Edit profile</Link></Button>
        </div>

        <Card className="overflow-hidden border-border bg-card">
          <div className="relative h-44 bg-muted md:h-64">
            <Image src={profile.bannerUrl} alt="Abstract workspace banner" fill className="object-cover" sizes="(max-width: 768px) 100vw, 1152px" unoptimized />
            <div className="absolute inset-0 bg-foreground/10" />
          </div>
          <CardContent className="relative px-5 pb-6 pt-0 md:px-8 md:pb-8">
            <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
              <div className="flex items-end gap-4">
                <div className="relative -mt-14 size-28 shrink-0 overflow-hidden rounded-full border-4 border-card bg-muted shadow-sm md:-mt-16 md:size-36">
                  <Image src={profile.avatarUrl} alt={`${profile.displayName} avatar`} fill className="object-cover" sizes="144px" unoptimized />
                </div>
                <div className="pb-1">
                  <div className="flex flex-wrap items-center gap-2"><h1 className="font-serif text-3xl font-semibold tracking-tight text-foreground md:text-4xl">{profile.displayName}</h1><Badge variant="secondary">{profile.badges[0].label}</Badge></div>
                  <p className="mt-1 text-sm text-muted-foreground">@{profile.username}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button className="rounded-full">Follow</Button>
                <Button variant="outline" size="icon" aria-label="Message user"><MessageCircle /></Button>
                <Button variant="ghost" size="icon" aria-label="More profile actions"><MoreHorizontal /></Button>
              </div>
            </div>

            <div className="mt-6 max-w-2xl">
              <p className="text-base leading-7 text-foreground/90">{profile.bio}</p>
              <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted-foreground">
                {profile.privacy.showLocation && <span className="inline-flex items-center gap-1.5"><MapPin className="size-4" />{profile.location}</span>}
                <span className="inline-flex items-center gap-1.5"><CalendarDays className="size-4" />{profile.joined}</span>
                <a href={`https://${profile.website}`} className="inline-flex items-center gap-1.5 text-primary hover:underline"><ExternalLink className="size-4" />{profile.website}</a>
                {profile.privacy.hiddenDetails.length > 0 && <span className="inline-flex items-center gap-1.5 text-xs"><ShieldCheck className="size-4" />Some details are private</span>}
              </div>
            </div>

            <div className="mt-7 grid grid-cols-2 gap-3 border-t border-border pt-5 sm:grid-cols-5">
              {[[profile.stats.posts, "Posts"], [profile.stats.replies, "Replies"], [profile.stats.helpful, "Helpful"], [profile.stats.topics, "Topics"], [profile.stats.views, "Views"]].map(([value, label]) => <div key={label as string}><p className="font-serif text-2xl font-semibold text-foreground">{value}</p><p className="label-mono mt-1 text-[10px] text-muted-foreground">{label}</p></div>)}
            </div>
          </CardContent>
        </Card>

        <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_280px]">
          <section>
            <nav aria-label="Profile sections" className="flex gap-1 overflow-x-auto border-b border-border">
              {tabLabels.map((tab) => <Link key={tab.value} href={`/profile?tab=${tab.value}`} className={`whitespace-nowrap border-b-2 px-4 py-3 text-sm font-medium transition-colors ${activeTab === tab.value ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"}`}>{tab.label}</Link>)}
            </nav>

            {activeTab === "about" ? <AboutPanel profile={profile} /> : isEmpty ? <EmptyProfileState icon={Bookmark} title="No saved notes yet" body="Saved threads and posts will collect here when you find something worth returning to." /> : <div className="flex flex-col gap-4 pt-5">
              {activeTab === "posts" && <Card className="border-primary/30 bg-primary/5"><CardHeader className="pb-3"><div className="flex items-center gap-2 text-xs text-primary"><Pin className="size-4" /> PINNED POST</div><CardTitle className="font-serif text-xl">{profile.pinnedPost.title}</CardTitle><CardDescription>{profile.pinnedPost.excerpt}</CardDescription></CardHeader><CardContent className="pt-0"><p className="label-mono text-[10px] text-muted-foreground">{profile.pinnedPost.date}</p></CardContent></Card>}
              {items.map((item) => <Card key={item.title} className="bg-card transition-colors hover:border-primary/50"><CardHeader><div className="flex items-center justify-between gap-3"><Badge variant="outline">{item.topic}</Badge><span className="text-xs text-muted-foreground">{item.date}</span></div><CardTitle className="font-serif text-xl leading-tight">{item.title}</CardTitle><CardDescription className="leading-6">{item.excerpt}</CardDescription></CardHeader><CardContent className="flex items-center gap-4 pt-0 text-xs text-muted-foreground">{"replies" in item && <span>{item.replies} replies</span>}<span className="inline-flex items-center gap-1"><Sparkles className="size-3.5" /> Community note</span></CardContent></Card>)}
              {items.length === 0 && <EmptyProfileState icon={MessageCircle} title="Nothing here yet" body="This part of the profile is still taking shape." />}
            </div>}
          </section>

          <aside className="flex flex-col gap-4">
            <Card><CardHeader><CardTitle className="text-base">Community badges</CardTitle><CardDescription>Small signals of how {profile.displayName} shows up here.</CardDescription></CardHeader><CardContent className="flex flex-col gap-3">{profile.badges.map((badge) => <div key={badge.label} className="flex gap-3"><div className="mt-0.5 rounded-full bg-primary/10 p-2 text-primary"><Sparkles className="size-4" /></div><div><p className="text-sm font-medium">{badge.label}</p><p className="text-xs leading-5 text-muted-foreground">{badge.detail}</p></div></div>)}</CardContent></Card>
            <Card><CardHeader><CardTitle className="text-base">Topics they follow</CardTitle></CardHeader><CardContent className="flex flex-wrap gap-2">{profile.topics.map((topic) => <Badge key={topic} variant="secondary">{topic}</Badge>)}</CardContent></Card>
            <div className="flex items-center gap-2 px-1 text-xs text-muted-foreground"><Flag className="size-3.5" /> See something off? <button type="button" className="text-primary hover:underline">Report profile</button></div>
          </aside>
        </div>
      </main>
    </div>
  )
}

function AboutPanel({ profile }: { profile: MockProfile }) {
  return <div className="flex flex-col gap-4 pt-5"><Card><CardHeader><CardTitle className="font-serif text-xl">About {profile.displayName}</CardTitle><CardDescription>A little more context, shared on their terms.</CardDescription></CardHeader><CardContent className="grid gap-5 sm:grid-cols-2"><div><p className="label-mono text-[10px] text-muted-foreground">PRONOUNS</p><p className="mt-1 text-sm">{profile.pronouns}</p></div><div><p className="label-mono text-[10px] text-muted-foreground">MEMBER SINCE</p><p className="mt-1 text-sm">{profile.joined.replace("Joined ", "")}</p></div><div className="sm:col-span-2"><Separator className="mb-5" /><p className="label-mono text-[10px] text-muted-foreground">ELSEWHERE</p><div className="mt-2 flex flex-wrap gap-3">{profile.socialLinks.map((link) => <a key={link} href={`https://${link}`} className="text-sm text-primary hover:underline">{link}</a>)}</div></div></CardContent></Card></div>
}

function EmptyProfileState({ icon: Icon, title, body }: { icon: typeof Bookmark; title: string; body: string }) {
  return <Card className="mt-5 border-dashed"><CardContent className="flex flex-col items-center justify-center px-6 py-16 text-center"><Icon className="size-8 text-muted-foreground" /><h2 className="mt-4 font-serif text-xl font-semibold">{title}</h2><p className="mt-2 max-w-sm text-sm leading-6 text-muted-foreground">{body}</p></CardContent></Card>
}
