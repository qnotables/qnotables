export const dynamic = "force-dynamic"

import Link from "next/link"
import { ArrowDownRight, BookOpen, Plus } from "lucide-react"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { BackToTop } from "@/components/back-to-top"
import { ForumList } from "@/components/forum-list"
import { ForumSidebar } from "@/components/forum-sidebar"
import { createClient } from "@/lib/supabase/server"
import { getForumSidebarData, getForumThreads, parseForumFilters } from "@/lib/forum"
import { JsonLd } from "@/components/json-ld"
import { collectionSchema, pageMetadata } from "@/lib/seo"

const forumDescription = "Open community forum for QNotables readers to start threads, share research, and discuss the record."

export const metadata = pageMetadata({
  title: "The Town Hall",
  description: forumDescription,
  path: "/forum",
})

function firstParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value
}

export default async function ForumPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const rawParams = await searchParams
  const filters = parseForumFilters({
    q: firstParam(rawParams.q),
    category: firstParam(rawParams.category),
    desk: firstParam(rawParams.desk),
    origin: firstParam(rawParams.origin),
    media: firstParam(rawParams.media),
    sort: firstParam(rawParams.sort),
    page: firstParam(rawParams.page),
  })
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const [initialResult, sidebar] = await Promise.all([
    getForumThreads(filters, user?.id),
    getForumSidebarData(),
  ])

  return (
    <div id="top" className="min-h-screen tactical-grid">
      <JsonLd data={collectionSchema("The Town Hall", forumDescription, "/forum")} />
      <SiteHeader />

      <main className="mx-auto max-w-7xl px-4 py-8 md:px-6 md:py-12">
        <section className="border-b border-border pb-8">
          <div className="label-mono flex items-center gap-2 text-xs text-primary">
            <span className="h-2 w-2 bg-primary" aria-hidden="true" />
            QNOTABLES / COMMUNITY RECORD
          </div>
          <div className="mt-4 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <h1 className="stencil text-balance text-4xl text-foreground md:text-6xl">The Town Hall</h1>
              <p className="mt-4 max-w-2xl text-pretty text-base leading-7 text-muted-foreground md:text-lg">
                Bring a source, a question, or a careful observation. Make room for evidence, uncertainty, and good-faith disagreement.
              </p>
            </div>
            <div className="flex shrink-0 flex-wrap gap-2">
              {user ? (
                <Link href="/forum/new" className="label-mono inline-flex items-center gap-2 bg-primary px-4 py-2.5 font-semibold text-primary-foreground transition-opacity hover:opacity-90">
                  <Plus className="h-4 w-4" /> Start a thread
                </Link>
              ) : (
                <Link href="/auth/login?next=/forum/new" className="label-mono inline-flex items-center gap-2 border border-primary px-4 py-2.5 text-primary transition-colors hover:bg-primary hover:text-primary-foreground">
                  Sign in to post
                </Link>
              )}
              <Link href="/forum/guidelines" className="label-mono inline-flex items-center gap-2 border border-border px-4 py-2.5 text-muted-foreground transition-colors hover:border-primary hover:text-primary">
                <BookOpen className="h-4 w-4" /> Guidelines
              </Link>
            </div>
          </div>
        </section>

        <section className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_280px]">
          <div className="min-w-0">
            <div className="mb-4 flex items-end justify-between gap-4">
              <div>
                <div className="label-mono text-xs text-primary">THE PUBLIC RECORD</div>
                <h2 className="stencil mt-1 text-2xl text-foreground md:text-3xl">Browse discussions</h2>
              </div>
              <ArrowDownRight className="hidden h-5 w-5 text-primary sm:block" aria-hidden="true" />
            </div>
            <ForumList initialResult={initialResult} isSignedIn={Boolean(user)} />
          </div>
          <ForumSidebar
            stats={{ threadCount: sidebar.threadCount, replyCount: sidebar.replyCount, memberCount: sidebar.memberCount }}
            pinned={sidebar.pinned}
            categoryCounts={sidebar.categoryCounts}
          />
        </section>
      </main>

      <SiteFooter />
      <BackToTop />
    </div>
  )
}
