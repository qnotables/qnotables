import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft, Clock, CornerDownRight } from "lucide-react"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { ReplyForm } from "@/components/reply-form"
import { ThreadArticle } from "@/components/thread-article"
import { Markdown } from "@/components/markdown"
import { createClient } from "@/lib/supabase/server"
import { timeAgo } from "@/lib/time"

interface Thread {
  id: string
  title: string
  body: string
  created_at: string
  author_id: string
  profiles: { display_name: string } | null
}

interface Reply {
  id: string
  body: string
  created_at: string
  author_id: string
  profiles: { display_name: string } | null
}

export default async function ThreadPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: thread } = await supabase
    .from("forum_threads")
    .select("id, title, body, created_at, author_id, profiles(display_name)")
    .eq("id", slug)
    .maybeSingle()

  if (!thread) notFound()
  const t = thread as unknown as Thread

  const { data: replyData } = await supabase
    .from("forum_replies")
    .select("id, body, created_at, author_id, profiles(display_name)")
    .eq("thread_id", slug)
    .order("created_at", { ascending: true })

  const replies = (replyData ?? []) as unknown as Reply[]

  return (
    <div id="top" className="min-h-screen tactical-grid">
      <SiteHeader />

      <main className="mx-auto max-w-3xl px-4 py-10 md:px-6">
        <Link
          href="/forum"
          className="label-mono mb-8 inline-flex items-center gap-2 text-muted-foreground transition-colors hover:text-primary"
        >
          <ArrowLeft className="h-4 w-4" /> The Mess Hall
        </Link>

        {/* original post */}
        <ThreadArticle
          id={t.id}
          title={t.title}
          body={t.body}
          createdAt={t.created_at}
          authorId={t.author_id}
          authorName={t.profiles?.display_name ?? "operator"}
          isOwner={user?.id === t.author_id}
        />

        {/* replies */}
        <div className="mb-4 mt-10 flex items-center gap-3">
          <CornerDownRight className="h-4 w-4 text-primary" />
          <h2 className="stencil text-lg text-foreground">
            {replies.length} {replies.length === 1 ? "Reply" : "Replies"}
          </h2>
          <span className="ml-auto h-px flex-1 bg-border" />
        </div>

        <div className="flex flex-col gap-3">
          {replies.map((r) => (
            <div key={r.id} className="border border-border bg-card p-5">
              <div className="label-mono mb-2 flex items-center gap-3 text-muted-foreground">
                <Link
                  href={`/u/${r.author_id}`}
                  className="text-primary underline-offset-4 hover:underline"
                >
                  {r.profiles?.display_name ?? "operator"}
                </Link>
                <span className="flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" /> {timeAgo(r.created_at)}
                </span>
              </div>
              <div className="mt-2">
                <Markdown content={r.body} />
              </div>
            </div>
          ))}
        </div>

        {/* reply box */}
        <div className="mt-8 border-t border-border pt-8">
          {user ? (
            <ReplyForm threadId={t.id} />
          ) : (
            <div className="border border-border bg-card p-6 text-center">
              <p className="text-muted-foreground">
                {"You must be signed in to reply. "}
                <Link
                  href={`/auth/login?next=/forum/${t.id}`}
                  className="text-primary underline-offset-4 hover:underline"
                >
                  Sign in
                </Link>
              </p>
            </div>
          )}
        </div>
      </main>

      <SiteFooter />
    </div>
  )
}
