import { redirect } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Eye } from "lucide-react"
import { createClient } from "@/lib/supabase/server"
import { isAdminEmail } from "@/lib/admin"
import { ForumDeleteButton } from "@/components/forum-delete-button"

export const metadata = {
  title: "Forum Moderation | qnotables.ai",
}

async function getForumData() {
  const supabase = await createClient()

  const { data: threads } = await supabase
    .from("forum_threads")
    .select(
      `
      id,
      title,
      created_at,
      profiles(display_name),
      forum_replies(count)
      `,
    )
    .order("created_at", { ascending: false })
    .limit(50)

  return { threads: (threads ?? []) as unknown as any[] }
}

export default async function ForumModerationPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user || !isAdminEmail(user.email)) {
    redirect("/")
  }

  const { threads } = await getForumData()

  return (
    <div className="min-h-screen tactical-grid bg-background">
      <header className="border-b border-border bg-background/95 backdrop-blur">
        <div className="mx-auto max-w-5xl px-4 py-6 md:px-6">
          <div className="flex items-center gap-4">
            <Link
              href="/admin"
              className="label-mono flex items-center gap-2 text-muted-foreground transition-colors hover:text-primary"
            >
              <ArrowLeft className="h-4 w-4" /> DASHBOARD
            </Link>
            <span className="text-muted-foreground">/</span>
            <h1 className="stencil text-xl text-foreground">Forum Moderation</h1>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8 md:px-6">
        <div className="mb-6">
          <p className="label-mono text-muted-foreground">
            {threads.length} thread{threads.length === 1 ? "" : "s"} in system
          </p>
        </div>

        {threads.length === 0 ? (
          <div className="border border-dashed border-border p-8 text-center text-muted-foreground">
            No forum threads yet.
          </div>
        ) : (
          <div className="space-y-3">
            {threads.map((t: any) => {
              const replyCount = t.forum_replies?.[0]?.count ?? 0
              return (
                <div
                  key={t.id}
                  className="flex items-center justify-between border border-border bg-card p-4 transition-colors hover:border-primary"
                >
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/forum/${t.id}`}
                      className="stencil block text-balance text-foreground transition-colors hover:text-primary"
                    >
                      {t.title}
                    </Link>
                    <div className="label-mono mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                      <span>{t.profiles?.display_name ?? "operator"}</span>
                      <span>
                        {replyCount} {replyCount === 1 ? "reply" : "replies"}
                      </span>
                      <span>
                        {new Date(t.created_at).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                    </div>
                  </div>
                  <div className="ml-4 flex items-center gap-2">
                    <Link
                      href={`/forum/${t.id}`}
                      className="flex items-center justify-center rounded p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-primary"
                      title="View thread"
                    >
                      <Eye className="h-4 w-4" />
                    </Link>
                    <ForumDeleteButton threadId={t.id} />
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}
