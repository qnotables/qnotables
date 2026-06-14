import Link from "next/link"
import { MessageSquare, Plus, Clock } from "lucide-react"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { createClient } from "@/lib/supabase/server"
import { timeAgo } from "@/lib/time"

export const metadata = {
  title: "The Mess Hall — Hot and Fresh",
  description: "Open forum for operators. Start a thread, file a reply, argue the claim.",
}

interface ThreadRow {
  id: string
  title: string
  body: string
  created_at: string
  profiles: { display_name: string } | null
  forum_replies: { count: number }[]
}

export default async function ForumPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: threads } = await supabase
    .from("forum_threads")
    .select("id, title, body, created_at, profiles(display_name), forum_replies(count)")
    .order("created_at", { ascending: false })

  const rows = (threads ?? []) as unknown as ThreadRow[]

  return (
    <div id="top" className="min-h-screen tactical-grid">
      <SiteHeader />

      <main className="mx-auto max-w-4xl px-4 py-10 md:px-6">
        <div className="mb-8 flex flex-wrap items-center gap-3">
          <span className="h-2 w-2 bg-primary" />
          <h1 className="stencil text-3xl text-foreground md:text-4xl">The Mess Hall</h1>
          <span className="label-mono hidden text-muted-foreground sm:inline">
            // OPEN FORUM
          </span>
          <span className="ml-auto h-px flex-1 bg-border" />
          {user ? (
            <Link
              href="/forum/new"
              className="label-mono flex items-center gap-2 bg-primary px-4 py-2 font-semibold text-primary-foreground transition-opacity hover:opacity-90"
            >
              <Plus className="h-4 w-4" /> New Thread
            </Link>
          ) : (
            <Link
              href="/auth/login?next=/forum/new"
              className="label-mono flex items-center gap-2 border border-border px-4 py-2 text-foreground transition-colors hover:border-primary hover:text-primary"
            >
              Sign in to post
            </Link>
          )}
        </div>

        {rows.length === 0 ? (
          <div className="corner-frame border border-border bg-card p-10 text-center">
            <MessageSquare className="mx-auto h-8 w-8 text-muted-foreground" />
            <p className="stencil mt-4 text-xl text-foreground">No threads yet</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Be the first operator to open the channel.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {rows.map((t) => {
              const replyCount = t.forum_replies?.[0]?.count ?? 0
              return (
                <Link
                  key={t.id}
                  href={`/forum/${t.id}`}
                  className="group flex items-start gap-4 border border-border bg-card p-5 transition-colors hover:border-primary"
                >
                  <div className="mt-0.5 flex flex-col items-center gap-1 border border-border px-3 py-2 text-center">
                    <span className="stencil text-lg text-primary">{replyCount}</span>
                    <span className="label-mono text-[10px] text-muted-foreground">
                      {replyCount === 1 ? "REPLY" : "REPLIES"}
                    </span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <h2 className="stencil text-balance text-lg text-foreground transition-colors group-hover:text-primary">
                      {t.title}
                    </h2>
                    <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
                      {t.body}
                    </p>
                    <div className="label-mono mt-3 flex items-center gap-3 text-muted-foreground">
                      <span className="text-foreground">
                        {t.profiles?.display_name ?? "operator"}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" /> {timeAgo(t.created_at)}
                      </span>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </main>

      <SiteFooter />
    </div>
  )
}
