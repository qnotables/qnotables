import Link from "next/link"
import { ArrowRight, BookOpen, CheckCircle2, UserRound } from "lucide-react"

export function ArticleSupport({
  excerpt,
  author,
  source,
  relatedPosts,
}: {
  excerpt: string
  author?: string | null
  source?: string | null
  relatedPosts: Array<{ slug: string; title: string; category?: string | null }>
}) {
  return (
    <>
      <section className="mt-14 grid gap-6 border-y border-border py-8 md:grid-cols-[1.1fr_.9fr]">
        <div>
          <p className="label-mono text-xs font-semibold text-primary">IN BRIEF</p>
          <h2 className="stencil mt-2 text-2xl text-foreground">What to take away</h2>
          <p className="mt-3 leading-relaxed text-muted-foreground">{excerpt}</p>
          <div className="mt-5 flex flex-col gap-2 text-sm text-muted-foreground">
            <p className="flex items-center gap-2"><CheckCircle2 className="size-4 text-primary" /> Follow the sources, not just the headline.</p>
            <p className="flex items-center gap-2"><CheckCircle2 className="size-4 text-primary" /> Keep the timeline and context in view.</p>
          </div>
        </div>
        <div className="border-l border-border pl-6 md:pl-8">
          <p className="label-mono text-xs font-semibold text-primary">ABOUT THIS RECORD</p>
          <div className="mt-4 flex items-start gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary"><UserRound className="size-5" /></div>
            <div>
              <p className="font-semibold text-foreground">{author || "QNotables newsroom"}</p>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">Research, source tracking, and public-record context for readers who want the full picture.</p>
              {source && <p className="label-mono mt-3 text-[10px] text-primary">SOURCE: {source}</p>}
            </div>
          </div>
        </div>
      </section>

      {relatedPosts.length > 0 && (
        <section className="mt-14">
          <div className="mb-5 flex items-end justify-between gap-4">
            <div>
              <p className="label-mono text-xs font-semibold text-primary">KEEP READING</p>
              <h2 className="stencil mt-1 text-2xl text-foreground">More from the record</h2>
            </div>
            <BookOpen className="size-5 text-muted-foreground" />
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {relatedPosts.map((relatedPost) => (
              <Link key={relatedPost.slug} href={`/archives/${relatedPost.slug}`} className="group flex items-center justify-between gap-4 border border-border bg-card p-4 transition-colors hover:border-primary">
                <div>
                  <p className="label-mono text-[10px] text-muted-foreground">{relatedPost.category || "ARCHIVE RECORD"}</p>
                  <h3 className="mt-1 font-semibold leading-snug text-foreground group-hover:text-primary">{relatedPost.title}</h3>
                </div>
                <ArrowRight className="size-4 shrink-0 text-muted-foreground group-hover:text-primary" />
              </Link>
            ))}
          </div>
        </section>
      )}
    </>
  )
}
