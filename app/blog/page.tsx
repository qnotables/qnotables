import Link from "next/link"
import { ArrowUpRight, Clock } from "lucide-react"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { blogPosts, formatDate } from "@/lib/blog-posts"

export const metadata = {
  title: "Field Notes — Hot and Fresh",
  description: "Essays and dispatches on methodology, media literacy, and the newsroom.",
}

export default function BlogPage() {
  const [lead, ...rest] = blogPosts

  return (
    <div id="top" className="min-h-screen tactical-grid">
      <SiteHeader />

      <main className="mx-auto max-w-5xl px-4 py-10 md:px-6">
        <div className="mb-8 flex items-center gap-3">
          <span className="h-2 w-2 bg-primary" />
          <h1 className="stencil text-3xl text-foreground md:text-4xl">Field Notes</h1>
          <span className="label-mono hidden text-muted-foreground sm:inline">
            // EDITORIAL & METHODOLOGY
          </span>
          <span className="ml-auto h-px flex-1 bg-border" />
        </div>

        {/* lead post */}
        <Link
          href={`/blog/${lead.slug}`}
          className="group corner-frame block border border-border bg-card p-6 transition-colors hover:border-primary md:p-8"
        >
          <div className="label-mono mb-3 flex items-center gap-3 text-primary">
            <span>{lead.tag}</span>
            <span className="text-muted-foreground">{formatDate(lead.date)}</span>
          </div>
          <h2 className="stencil text-balance text-2xl leading-tight text-foreground transition-colors group-hover:text-primary md:text-3xl">
            {lead.title}
          </h2>
          <p className="mt-3 max-w-2xl text-pretty leading-relaxed text-muted-foreground">
            {lead.excerpt}
          </p>
          <div className="label-mono mt-5 flex items-center gap-4 text-muted-foreground">
            <span>{lead.author}</span>
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" /> {lead.readMinutes} MIN
            </span>
            <span className="ml-auto flex items-center gap-1 text-foreground group-hover:text-primary">
              READ <ArrowUpRight className="h-4 w-4" />
            </span>
          </div>
        </Link>

        {/* the rest */}
        <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2">
          {rest.map((post) => (
            <Link
              key={post.slug}
              href={`/blog/${post.slug}`}
              className="group flex flex-col border border-border bg-card p-6 transition-colors hover:border-primary"
            >
              <div className="label-mono mb-3 flex items-center gap-3 text-primary">
                <span>{post.tag}</span>
                <span className="text-muted-foreground">{formatDate(post.date)}</span>
              </div>
              <h3 className="stencil text-balance text-xl leading-tight text-foreground transition-colors group-hover:text-primary">
                {post.title}
              </h3>
              <p className="mt-2 flex-1 text-pretty text-sm leading-relaxed text-muted-foreground">
                {post.excerpt}
              </p>
              <div className="label-mono mt-4 flex items-center gap-3 text-muted-foreground">
                <span>{post.author}</span>
                <span className="flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" /> {post.readMinutes} MIN
                </span>
              </div>
            </Link>
          ))}
        </div>
      </main>

      <SiteFooter />
    </div>
  )
}
