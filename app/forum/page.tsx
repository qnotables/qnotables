import Link from "next/link"
import { Plus } from "lucide-react"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { ForumList, type ThreadListItem } from "@/components/forum-list"
import { createClient } from "@/lib/supabase/server"

export const metadata = {
  title: "The Town Hall — Hot and Fresh",
  description: "Open forum for operators. Start a thread, file a reply, argue the claim.",
}

export default async function ForumPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Fetch threads with author profiles and reply counts
  const { data: threads } = await supabase
    .from("forum_threads")
    .select(
      "id, title, body, category, tags, created_at, author_id, is_pinned, is_locked, is_featured, is_soft_deleted, profiles(display_name), forum_replies(count)",
    )
    .eq("is_soft_deleted", false)
    .order("is_pinned", { ascending: false })
    .order("created_at", { ascending: false })

  const rows: ThreadListItem[] = (threads ?? []).map((t: any) => ({
    id: t.id,
    title: t.title,
    body: t.body ?? "",
    category: t.category ?? null,
    tags: t.tags ?? null,
    created_at: t.created_at,
    author_id: t.author_id,
    authorName: t.profiles?.display_name ?? "operator",
    replyCount: t.forum_replies?.[0]?.count ?? 0,
    is_pinned: Boolean(t.is_pinned),
    is_locked: Boolean(t.is_locked),
    is_featured: Boolean(t.is_featured),
    is_soft_deleted: Boolean(t.is_soft_deleted),
  }))

  return (
    <div id="top" className="min-h-screen tactical-grid">
      <SiteHeader />

      <main className="mx-auto max-w-4xl px-4 py-10 md:px-6">
        <div className="mb-8 flex flex-wrap items-center gap-3">
          <span className="h-2 w-2 bg-primary" />
          <h1 className="stencil text-3xl text-foreground md:text-4xl">The Town Hall</h1>
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

        <ForumList threads={rows} isSignedIn={Boolean(user)} />
      </main>

      <SiteFooter />
    </div>
  )
}
