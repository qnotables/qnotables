import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft, Clock, CornerDownRight, Pin, Lock, Star } from "lucide-react"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { ReplyForm } from "@/components/reply-form"
import { ThreadArticle } from "@/components/thread-article"
import { Markdown } from "@/components/markdown"
import { ReplyVotes } from "@/components/reply-votes"
import { ThreadVotes } from "@/components/thread-votes"
import { ReplyModControls } from "@/components/reply-mod-controls"
import { createClient } from "@/lib/supabase/server"
import { timeAgo } from "@/lib/time"
import { normalizeCategoryName, preprocessBody } from "@/lib/forum-utils"
import { checkAdminAccess } from "@/lib/admin"
import { getSiteUrl, firstImageFromBody } from "@/lib/rss-utils"

interface Thread {
  id: string
  title: string
  body: string
  created_at: string
  author_id: string
  is_locked: boolean
  is_pinned: boolean
  is_featured: boolean
  is_soft_deleted: boolean
  category: string | null
  tags: string | null
  profiles: { display_name: string } | null
}

interface Reply {
  id: string
  body: string
  created_at: string
  author_id: string
  parent_reply_id: string | null
  is_hidden: boolean
  profiles: { display_name: string } | null
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const supabase = await createClient()
  const { data } = await supabase
    .from("forum_threads")
    .select("title, body, category")
    .eq("id", slug)
    .maybeSingle()

  if (!data) return { title: "Thread — HOT AND FRESH" }

  const site = getSiteUrl()
  const canonical = `${site}/forum/${slug}`
  const description = data.body?.slice(0, 160).replace(/\s+/g, " ") ?? ""

  // Use first image found in the post body, fall back to site default OG image
  const bodyImage = firstImageFromBody(data.body)
  const ogImage = bodyImage ?? `${site}/images/og-default.png`

  return {
    title: `${data.title} — HOT AND FRESH`,
    description,
    alternates: { canonical },
    openGraph: {
      title: data.title,
      description,
      url: canonical,
      siteName: "HOT AND FRESH",
      type: "article",
      images: [{ url: ogImage }],
    },
    twitter: {
      card: "summary_large_image",
      title: data.title,
      description,
      images: [ogImage],
    },
  }
}

export default async function ThreadPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const isAdmin = user ? await checkAdminAccess() : false

  const { data: thread } = await supabase
    .from("forum_threads")
    .select(
      "id, title, body, created_at, author_id, is_locked, is_pinned, is_featured, is_soft_deleted, category, tags, profiles(display_name)",
    )
    .eq("id", slug)
    .maybeSingle()

  if (!thread || thread.is_soft_deleted) notFound()
  const t = thread as unknown as Thread

  const repliesQuery = supabase
    .from("forum_replies")
    .select("id, body, created_at, author_id, parent_reply_id, is_hidden, profiles(display_name)")
    .eq("thread_id", slug)
    .eq("is_pending", false)
    .order("created_at", { ascending: true })

  // Non-admins only see visible replies
  if (!isAdmin) {
    repliesQuery.eq("is_hidden", false)
  }

  const { data: replyData } = await repliesQuery

  const replies = (replyData ?? []) as unknown as Reply[]

  // Thread-level votes
  const { data: threadVotesData } = await supabase
    .from("thread_votes")
    .select("vote, user_id")
    .eq("thread_id", slug)

  const threadScore = (threadVotesData ?? []).reduce((sum, v) => sum + v.vote, 0)
  const userThreadVote = user
    ? ((threadVotesData ?? []).find((v) => v.user_id === user.id)?.vote ?? null) as 1 | -1 | null
    : null

  // Reply-level votes
  const { data: allVotes } = await supabase
    .from("reply_votes")
    .select("reply_id, vote_type")
    .in(
      "reply_id",
      replies.map((r) => r.id),
    )

  const { data: userVotes } = user
    ? await supabase
        .from("reply_votes")
        .select("reply_id, vote_type")
        .eq("user_id", user.id)
        .in(
          "reply_id",
          replies.map((r) => r.id),
        )
    : { data: [] }

  const voteMap = new Map<string, string[]>()
  const userVoteMap = new Map<string, string>()

  for (const vote of allVotes ?? []) {
    const votes = voteMap.get(vote.reply_id) ?? []
    votes.push(vote.vote_type)
    voteMap.set(vote.reply_id, votes)
  }
  for (const vote of userVotes ?? []) {
    userVoteMap.set(vote.reply_id, vote.vote_type)
  }

  const topLevelReplies = replies.filter((r) => !r.parent_reply_id)
  const nestedReplies = (parent: Reply) =>
    replies.filter((r) => r.parent_reply_id === parent.id)

  const categoryName = normalizeCategoryName(t.category)

  return (
    <div id="top" className="min-h-screen tactical-grid">
      <SiteHeader />

      <main className="mx-auto max-w-3xl px-4 py-10 md:px-6">
        {/* Back link */}
        <div className="mb-6 flex items-center gap-3">
          <Link
            href="/forum"
            className="label-mono inline-flex items-center gap-2 text-muted-foreground transition-colors hover:text-primary"
          >
            <ArrowLeft className="h-4 w-4" /> The Town Hall
          </Link>
          {categoryName && (
            <>
              <span className="text-muted-foreground">/</span>
              <span className="label-mono border border-primary/40 bg-primary/10 px-2 py-0.5 text-[10px] text-primary">
                {categoryName.toUpperCase()}
              </span>
            </>
          )}
        </div>

        {/* Original post */}
        <ThreadArticle
          id={t.id}
          title={t.title}
          body={t.body}
          createdAt={t.created_at}
          authorId={t.author_id}
          authorName={t.profiles?.display_name ?? "operator"}
          isOwner={user?.id === t.author_id}
          isAdmin={isAdmin}
          category={t.category}
          tags={t.tags}
          is_pinned={Boolean(t.is_pinned)}
          is_locked={Boolean(t.is_locked)}
          is_featured={Boolean(t.is_featured)}
          is_soft_deleted={Boolean(t.is_soft_deleted)}
          shareUrl={`${getSiteUrl()}/forum/${t.id}`}
        />

        {/* Thread vote bar */}
        <div className="mt-4 flex items-center gap-3 border-t border-border pt-3">
          <ThreadVotes
            threadId={t.id}
            initialScore={threadScore}
            userVote={userThreadVote}
            isSignedIn={!!user}
          />
          <span className="label-mono text-xs text-muted-foreground">
            {!user && "Sign in to vote on this thread"}
          </span>
        </div>

        {/* Replies header */}
        <div className="mb-4 mt-10 flex items-center gap-3">
          <CornerDownRight className="h-4 w-4 text-primary" />
          <h2 className="stencil text-lg text-foreground">
            {replies.length} {replies.length === 1 ? "Reply" : "Replies"}
          </h2>
          <span className="ml-auto h-px flex-1 bg-border" />
        </div>

        {/* Reply list */}
        <div className="flex flex-col gap-3">
          {topLevelReplies.map((r) => (
            <div key={r.id}>
              <div className={`border p-5 ${r.is_hidden ? "border-amber-500/30 bg-amber-500/5" : "border-border bg-card"}`}>
                <div className="label-mono mb-2 flex items-center justify-between gap-3 text-muted-foreground">
                  <div className="flex items-center gap-3">
                    <Link
                      href={`/u/${r.author_id}`}
                      className="text-primary underline-offset-4 hover:underline"
                    >
                      {r.profiles?.display_name ?? "operator"}
                    </Link>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" /> {timeAgo(r.created_at)}
                    </span>
                    {r.is_hidden && (
                      <span className="label-mono flex items-center gap-1 border border-amber-500/40 bg-amber-500/10 px-1.5 py-0.5 text-[10px] text-amber-400">
                        HIDDEN
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {isAdmin && <ReplyModControls replyId={r.id} isHidden={r.is_hidden} />}
                    <ReplyVotes
                      replyId={r.id}
                      initialUpVotes={voteMap.get(r.id)?.filter((v) => v === "up").length ?? 0}
                      initialDownVotes={voteMap.get(r.id)?.filter((v) => v === "down").length ?? 0}
                      userVote={userVoteMap.get(r.id) as "up" | "down" | undefined}
                    />
                  </div>
                </div>
                <div className="mt-2">
                  <Markdown content={preprocessBody(r.body)} />
                </div>
              </div>

              {/* Nested replies */}
              {nestedReplies(r).length > 0 && (
                <div className="ml-4 flex flex-col gap-3 border-l-2 border-border py-3">
                  {nestedReplies(r).map((nested) => (
                    <div key={nested.id} className={`border p-4 ${nested.is_hidden ? "border-amber-500/30 bg-amber-500/5" : "border-border bg-muted/20"}`}>
                      <div className="label-mono mb-2 flex items-center justify-between gap-3 text-muted-foreground text-sm">
                        <div className="flex items-center gap-3">
                          <Link
                            href={`/u/${nested.author_id}`}
                            className="text-primary underline-offset-4 hover:underline"
                          >
                            {nested.profiles?.display_name ?? "operator"}
                          </Link>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" /> {timeAgo(nested.created_at)}
                          </span>
                          {nested.is_hidden && (
                            <span className="label-mono flex items-center gap-1 border border-amber-500/40 bg-amber-500/10 px-1.5 py-0.5 text-[10px] text-amber-400">
                              HIDDEN
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          {isAdmin && <ReplyModControls replyId={nested.id} isHidden={nested.is_hidden} />}
                          <ReplyVotes
                            replyId={nested.id}
                            initialUpVotes={
                              voteMap.get(nested.id)?.filter((v) => v === "up").length ?? 0
                            }
                            initialDownVotes={
                              voteMap.get(nested.id)?.filter((v) => v === "down").length ?? 0
                            }
                            userVote={userVoteMap.get(nested.id) as "up" | "down" | undefined}
                          />
                        </div>
                      </div>
                      <div className="mt-2 text-sm">
                        <Markdown content={preprocessBody(nested.body)} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Reply box */}
        <div className="mt-8 border-t border-border pt-8">
          {t.is_locked ? (
            <div className="border border-border bg-muted/20 p-6 text-center">
              <Lock className="mx-auto mb-2 h-5 w-5 text-muted-foreground" />
              <p className="label-mono text-muted-foreground">
                This thread is locked. No new replies can be posted.
              </p>
            </div>
          ) : user ? (
            <ReplyForm threadId={t.id} isSignedIn />
          ) : (
            <div className="border border-border bg-card p-6 text-center">
              <p className="text-muted-foreground">
                Sign in to reply.{" "}
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
