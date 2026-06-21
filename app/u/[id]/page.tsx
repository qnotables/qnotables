import Link from "next/link"
import Image from "next/image"
import { notFound } from "next/navigation"
import { ArrowLeft, Clock, MessageSquare, CornerDownRight, UserRound } from "lucide-react"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { DisplayNameEditor } from "@/components/display-name-editor"
import { AvatarEditor } from "@/components/avatar-editor"
import { createClient } from "@/lib/supabase/server"
import { timeAgo } from "@/lib/time"

interface ThreadRow {
  id: string
  title: string
  created_at: string
}

interface ReplyRow {
  id: string
  body: string
  created_at: string
  thread_id: string
  forum_threads: { title: string } | null
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data } = await supabase.from("profiles").select("display_name").eq("id", id).maybeSingle()
  const name = data?.display_name ?? "Operator"
  return {
    title: `${name} — Hot and Fresh`,
    description: `Profile and activity for ${name}.`,
  }
}

export default async function ProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, display_name, avatar_url, created_at")
    .eq("id", id)
    .maybeSingle()

  if (!profile) notFound()
  const isOwner = user?.id === profile.id

  const { data: threadData } = await supabase
    .from("forum_threads")
    .select("id, title, created_at")
    .eq("author_id", id)
    .order("created_at", { ascending: false })

  const { data: replyData } = await supabase
    .from("forum_replies")
    .select("id, body, created_at, thread_id, forum_threads(title)")
    .eq("author_id", id)
    .order("created_at", { ascending: false })

  const threads = (threadData ?? []) as unknown as ThreadRow[]
  const replies = (replyData ?? []) as unknown as ReplyRow[]

  return (
    <div id="top" className="min-h-screen tactical-grid">
      <SiteHeader />

      <main className="mx-auto max-w-3xl px-4 py-10 md:px-6">
        <Link
          href="/forum"
          className="label-mono mb-8 inline-flex items-center gap-2 text-muted-foreground transition-colors hover:text-primary"
        >
          <ArrowLeft className="h-4 w-4" /> The Town Hall
        </Link>

        {/* profile header */}
        <div className="corner-frame border border-border bg-card p-6 md:p-8">
          <div className="flex items-center gap-4">
            {isOwner ? (
              <AvatarEditor
                initialUrl={profile.avatar_url ?? null}
                displayName={profile.display_name}
              />
            ) : (
              <div className="relative flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden border border-border bg-secondary text-secondary-foreground">
                {profile.avatar_url ? (
                  <Image
                    src={profile.avatar_url}
                    alt={`${profile.display_name} avatar`}
                    fill
                    className="object-cover"
                    sizes="56px"
                    unoptimized
                  />
                ) : (
                  <UserRound className="h-7 w-7" />
                )}
              </div>
            )}
            <div className="min-w-0">
              {isOwner ? (
                <DisplayNameEditor initialName={profile.display_name} />
              ) : (
                <h1 className="stencil text-3xl text-foreground md:text-4xl">
                  {profile.display_name}
                </h1>
              )}
              <p className="label-mono mt-1 text-muted-foreground">
                ENLISTED {timeAgo(profile.created_at)}
                {isOwner ? " // THIS IS YOU" : ""}
              </p>
            </div>
          </div>
          <div className="label-mono mt-6 flex gap-6 border-t border-border pt-4 text-muted-foreground">
            <span>
              <span className="stencil text-lg text-primary">{threads.length}</span> THREADS
            </span>
            <span>
              <span className="stencil text-lg text-primary">{replies.length}</span> REPLIES
            </span>
          </div>
        </div>

        {/* threads */}
        <div className="mb-4 mt-10 flex items-center gap-3">
          <MessageSquare className="h-4 w-4 text-primary" />
          <h2 className="stencil text-lg text-foreground">Threads</h2>
          <span className="ml-auto h-px flex-1 bg-border" />
        </div>
        {threads.length === 0 ? (
          <p className="text-sm text-muted-foreground">No threads opened yet.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {threads.map((t) => (
              <Link
                key={t.id}
                href={`/forum/${t.id}`}
                className="group flex items-center justify-between gap-4 border border-border bg-card p-4 transition-colors hover:border-primary"
              >
                <span className="stencil text-foreground transition-colors group-hover:text-primary">
                  {t.title}
                </span>
                <span className="label-mono flex shrink-0 items-center gap-1 text-muted-foreground">
                  <Clock className="h-3.5 w-3.5" /> {timeAgo(t.created_at)}
                </span>
              </Link>
            ))}
          </div>
        )}

        {/* replies */}
        <div className="mb-4 mt-10 flex items-center gap-3">
          <CornerDownRight className="h-4 w-4 text-primary" />
          <h2 className="stencil text-lg text-foreground">Replies</h2>
          <span className="ml-auto h-px flex-1 bg-border" />
        </div>
        {replies.length === 0 ? (
          <p className="text-sm text-muted-foreground">No replies filed yet.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {replies.map((r) => (
              <Link
                key={r.id}
                href={`/forum/${r.thread_id}`}
                className="group border border-border bg-card p-4 transition-colors hover:border-primary"
              >
                <p className="label-mono mb-1 text-muted-foreground">
                  on{" "}
                  <span className="text-foreground group-hover:text-primary">
                    {r.forum_threads?.title ?? "a thread"}
                  </span>{" "}
                  // {timeAgo(r.created_at)}
                </p>
                <p className="line-clamp-2 text-sm leading-relaxed text-foreground/90">{r.body}</p>
              </Link>
            ))}
          </div>
        )}
      </main>

      <SiteFooter />
    </div>
  )
}
