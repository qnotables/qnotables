export const dynamic = "force-dynamic"

import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft, ArrowRight, Clock, CornerDownRight, Lock } from "lucide-react"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { ReplyForm } from "@/components/reply-form"
import { ThreadArticle } from "@/components/thread-article"
import { ForumReplyThread } from "@/components/forum-reply-thread"
import { ReportButton } from "@/components/report-button"
import { ThreadViewCounter } from "@/components/thread-view-counter"
import { createClient } from "@/lib/supabase/server"
import { timeAgo } from "@/lib/time"
import { normalizeCategoryName, getDeskLabel } from "@/lib/forum-utils"
import { checkAdminAccess } from "@/lib/admin"
import { firstImageFromBody, getSiteUrl } from "@/lib/rss-utils"
import { JsonLd } from "@/components/json-ld"
import { articleSchema, breadcrumbSchema, pageMetadata, socialImageUrl } from "@/lib/seo"

// A UUID looks like xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx. Anything else is a slug.
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

interface Thread {
  id: string
  slug: string | null
  title: string
  body: string
  content_version: number
  excerpt: string | null
  created_at: string
  updated_at: string | null
  author_id: string
  is_locked: boolean
  is_pinned: boolean
  is_featured: boolean
  is_soft_deleted: boolean
  status: string | null
  category: string | null
  desk: string | null
  tags: string | null
  view_count: number | null
  reply_count: number | null
  profiles: { display_name: string } | null
}

interface Reply {
  id: string
  body: string
  created_at: string
  updated_at: string | null
  author_id: string
  parent_reply_id: string | null
  is_hidden: boolean
  content_format: string | null
  content_version: number
  profiles: { display_name: string } | null
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params
    const supabase = await createClient()
    const column = UUID_RE.test(slug) ? "id" : "slug"
    const { data } = await supabase
      .from("forum_threads")
      .select("slug, title, body, excerpt, category, status, is_soft_deleted")
      .eq(column, slug)
      .maybeSingle()

    if (!data) return pageMetadata({ title: "Thread not found", path: `/forum/${slug}`, noIndex: true })

    const path = `/forum/${data.slug ?? slug}`
    const description = (data.excerpt ?? data.body ?? "QNotables community discussion.").slice(0, 160).replace(/\s+/g, " ")
    const shouldIndex = data.status === "published" && !data.is_soft_deleted

    return pageMetadata({
      title: data.title,
      description,
      path,
      image: socialImageUrl(firstImageFromBody(data.body)),
      type: "article",
      noIndex: !shouldIndex,
    })
  } catch {
    return pageMetadata({ title: "Thread", path: "/forum", noIndex: true })
  }
}

export default async function ThreadPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const isAdmin = user ? await checkAdminAccess() : false

  // --- Thread fetch (fatal: 404 if missing, throws to error boundary on DB error) ---
  let thread: Thread | null = null
  try {
    const column = UUID_RE.test(slug) ? "id" : "slug"
    const { data, error } = await supabase
      .from("forum_threads")
      .select(
        "id, slug, title, body, content_version, excerpt, created_at, updated_at, author_id, is_locked, is_pinned, is_featured, is_soft_deleted, status, category, desk, tags, view_count, reply_count, profiles(display_name)",
      )
      .eq(column, slug)
      .maybeSingle()

    if (error) throw new Error(`Thread fetch failed: ${error.message}`)
    thread = data as unknown as Thread | null
  } catch (err) {
    console.error("[forum/[slug]] thread fetch error:", err)
    throw err // re-throw so error.tsx catches it
  }

  if (!thread || thread.is_soft_deleted) notFound()
  const t = thread
  const threadPath = `/forum/${t.slug || t.id}`
  const threadDescription = (t.excerpt || t.body || "QNotables community discussion.").slice(0, 160).replace(/\s+/g, " ")
  const schemas = [
    articleSchema({
      title: t.title,
      description: threadDescription,
      path: threadPath,
      image: firstImageFromBody(t.body),
      published: t.created_at,
      modified: t.updated_at,
      author: t.profiles?.display_name,
      type: "DiscussionForumPosting",
    }),
    breadcrumbSchema([
      { name: "Home", path: "/" },
      { name: "The Town Hall", path: "/forum" },
      { name: t.title, path: threadPath },
    ]),
  ]

  // Drafts are only viewable by their author (or an admin). Everyone else 404s.
  const isDraft = t.status === "draft"
  const isOwner = user?.id === t.author_id
  if (isDraft && !isOwner && !isAdmin) notFound()

  // --- Replies (non-fatal: degrade to empty list) ---
  let replies: Reply[] = []
  try {
    const repliesQuery = supabase
      .from("forum_replies")
      .select("id, body, created_at, updated_at, author_id, parent_reply_id, is_hidden, content_format, content_version, profiles(display_name)")
      .eq("thread_id", t.id)
      .eq("is_pending", false)
      .order("created_at", { ascending: true })

    if (!isAdmin) repliesQuery.eq("is_hidden", false)

    const { data, error } = await repliesQuery
    if (error) throw new Error(error.message)
    replies = (data ?? []) as unknown as Reply[]
  } catch (err) {
    console.error("[forum/[slug]] replies fetch error:", err)
    // non-fatal — thread still renders, replies section shows empty
  }

  // --- Votes (non-fatal: degrade to no votes shown) ---
  let threadUpVotes = 0
  let threadDownVotes = 0
  let threadUserVote: 1 | -1 | null = null
  const voteMap = new Map<string, string[]>()
  const userVoteMap = new Map<string, string>()
  try {
    const [{ data: threadVotes }, { data: currentThreadVote }] = await Promise.all([
      supabase.from("thread_votes").select("vote").eq("thread_id", t.id),
      user
        ? supabase.from("thread_votes").select("vote").eq("thread_id", t.id).eq("user_id", user.id).maybeSingle()
        : Promise.resolve({ data: null as { vote: number } | null }),
    ])
    threadUpVotes = threadVotes?.filter((vote) => vote.vote === 1).length ?? 0
    threadDownVotes = threadVotes?.filter((vote) => vote.vote === -1).length ?? 0
    threadUserVote = currentThreadVote?.vote === 1 || currentThreadVote?.vote === -1 ? currentThreadVote.vote : null

    const replyIds = replies.map((r) => r.id)
    if (replyIds.length > 0) {
      const [{ data: allVotes }, { data: userVotes }] = await Promise.all([
        supabase.from("reply_votes").select("reply_id, vote_type").in("reply_id", replyIds),
        user
          ? supabase
              .from("reply_votes")
              .select("reply_id, vote_type")
              .eq("user_id", user.id)
              .in("reply_id", replyIds)
          : Promise.resolve({ data: [] as { reply_id: string; vote_type: string }[] }),
      ])
      for (const vote of allVotes ?? []) {
        const existing = voteMap.get(vote.reply_id) ?? []
        existing.push(vote.vote_type)
        voteMap.set(vote.reply_id, existing)
      }
      for (const vote of userVotes ?? []) {
        userVoteMap.set(vote.reply_id, vote.vote_type)
      }
    }
  } catch (err) {
    console.error("[forum/[slug]] votes fetch error:", err)
  }

  const replyVotes = Object.fromEntries(
    replies.map((reply) => [
      reply.id,
      {
        up: voteMap.get(reply.id)?.filter((vote) => vote === "up").length ?? 0,
        down: voteMap.get(reply.id)?.filter((vote) => vote === "down").length ?? 0,
        userVote: userVoteMap.get(reply.id) as "up" | "down" | undefined,
      },
    ]),
  )

  const categoryName = normalizeCategoryName(t.category)

  // --- Prev/next threads (non-fatal: nav simply won't render) ---
  let newerThread: { id: string; slug: string | null; title: string } | null = null
  let olderThread: { id: string; slug: string | null; title: string } | null = null
  if (!isDraft) {
    try {
      const [newerResult, olderResult] = await Promise.all([
        supabase
          .from("forum_threads")
          .select("id, slug, title")
          .eq("is_soft_deleted", false)
          .eq("is_pending", false)
          .eq("status", "published")
          .gt("created_at", t.created_at)
          .order("created_at", { ascending: true })
          .limit(1)
          .maybeSingle(),
        supabase
          .from("forum_threads")
          .select("id, slug, title")
          .eq("is_soft_deleted", false)
          .eq("is_pending", false)
          .eq("status", "published")
          .lt("created_at", t.created_at)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle(),
      ])
      newerThread = newerResult.data
      olderThread = olderResult.data
    } catch (err) {
      console.error("[forum/[slug]] prev/next fetch error:", err)
    }
  }

  return (
    <div id="top" className="min-h-screen tactical-grid">
      <JsonLd data={schemas} />
      <SiteHeader />

      {/* Increment view count on published threads (client fires once on mount) */}
      {!isDraft && <ThreadViewCounter threadId={t.id} />}

      {/* Article structured data — only for public, published threads */}
      {!isDraft && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "DiscussionForumPosting",
              headline: t.title,
              url: `${getSiteUrl()}/forum/${t.slug || t.id}`,
              datePublished: t.created_at,
              dateModified: t.updated_at ?? t.created_at,
              author: { "@type": "Person", name: t.profiles?.display_name ?? "operator" },
              articleSection: getDeskLabel(t.desk),
              commentCount: t.reply_count ?? replies.length,
              interactionStatistic: {
                "@type": "InteractionCounter",
                interactionType: "https://schema.org/ViewAction",
                userInteractionCount: t.view_count ?? 0,
              },
            }),
          }}
        />
      )}

      <main className="mx-auto max-w-3xl px-4 py-10 md:px-6">
        {/* Breadcrumb */}
        <nav className="mb-6 flex flex-wrap items-center gap-2" aria-label="Breadcrumb">
          <Link
            href="/forum"
            className="label-mono inline-flex items-center gap-2 text-muted-foreground transition-colors hover:text-primary"
          >
            <ArrowLeft className="h-4 w-4" /> The Town Hall
          </Link>
          {t.desk &&
            t.desk !== "other" &&
            getDeskLabel(t.desk).toLowerCase() !== (categoryName ?? "").toLowerCase() && (
              <>
                <span className="text-muted-foreground">/</span>
                <Link
                  href={`/forum?desk=${t.desk}`}
                  className="label-mono border border-border px-2 py-0.5 text-[10px] text-muted-foreground transition-colors hover:border-primary hover:text-primary"
                >
                  {getDeskLabel(t.desk).toUpperCase()}
                </Link>
              </>
            )}
          {categoryName && (
            <>
              <span className="text-muted-foreground">/</span>
              <span className="label-mono border border-primary/40 bg-primary/10 px-2 py-0.5 text-[10px] text-primary">
                {categoryName.toUpperCase()}
              </span>
            </>
          )}
        </nav>

        {/* Draft banner — visible only to author/admin viewing an unpublished thread */}
        {isDraft && (
          <div className="mb-6 border border-primary/40 bg-primary/10 px-4 py-3">
            <p className="label-mono text-sm text-primary">
              DRAFT — this thread is not published. Only you can see it. Edit it and choose “Post
              Thread” to publish.
            </p>
          </div>
        )}

        {/* Original post */}
        <ThreadArticle
          id={t.id}
          title={t.title}
  body={t.body}
  contentVersion={t.content_version}
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
          shareUrl={`${getSiteUrl()}/forum/${t.slug || t.id}`}
          viewCount={t.view_count ?? 0}
          initialUpVotes={threadUpVotes}
          initialDownVotes={threadDownVotes}
          userVote={threadUserVote}
        />

        {/* OP report */}
        {user && user.id !== t.author_id && (
          <div className="mt-2 flex justify-end">
            <ReportButton contentType="forum_thread" contentId={t.id} isSignedIn={Boolean(user)} />
          </div>
        )}

        {/* Replies header */}
        <div className="mb-4 mt-10 flex items-center gap-3">
          <CornerDownRight className="h-4 w-4 text-primary" />
          <h2 className="stencil text-lg text-foreground">
            {replies.length} {replies.length === 1 ? "Reply" : "Replies"}
          </h2>
          <span className="ml-auto h-px flex-1 bg-border" />
        </div>

        {/* Reply list */}
        <ForumReplyThread
          replies={replies}
          threadId={t.id}
          isLocked={Boolean(t.is_locked)}
          currentUserId={user?.id}
          isAdmin={isAdmin}
          votes={replyVotes}
        />

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

        {/* Prev / next thread navigation */}
        {(newerThread || olderThread) && (
          <nav
            className="mt-10 grid grid-cols-1 gap-2 border-t border-border pt-6 sm:grid-cols-2"
            aria-label="Thread navigation"
          >
            {newerThread ? (
              <Link
                href={`/forum/${newerThread.slug || newerThread.id}`}
                className="group flex items-center gap-3 border border-border bg-card p-4 transition-colors hover:border-primary"
              >
                <ArrowLeft className="h-4 w-4 flex-shrink-0 text-muted-foreground transition-colors group-hover:text-primary" />
                <span className="min-w-0">
                  <span className="label-mono block text-[10px] text-muted-foreground">NEWER THREAD</span>
                  <span className="line-clamp-1 text-sm text-foreground transition-colors group-hover:text-primary">
                    {newerThread.title}
                  </span>
                </span>
              </Link>
            ) : (
              <span className="hidden sm:block" />
            )}
            {olderThread && (
              <Link
                href={`/forum/${olderThread.slug || olderThread.id}`}
                className="group flex items-center justify-end gap-3 border border-border bg-card p-4 text-right transition-colors hover:border-primary"
              >
                <span className="min-w-0">
                  <span className="label-mono block text-[10px] text-muted-foreground">OLDER THREAD</span>
                  <span className="line-clamp-1 text-sm text-foreground transition-colors group-hover:text-primary">
                    {olderThread.title}
                  </span>
                </span>
                <ArrowRight className="h-4 w-4 flex-shrink-0 text-muted-foreground transition-colors group-hover:text-primary" />
              </Link>
            )}
          </nav>
        )}
      </main>

      <SiteFooter />
    </div>
  )
}
