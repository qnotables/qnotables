import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft, Clock } from "lucide-react"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { Markdown } from "@/components/markdown"
import { getAllPosts, getPost, formatDate } from "@/lib/blog-posts"

export async function generateStaticParams() {
  const posts = await getAllPosts()
  return posts.map((p) => ({ slug: p.slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const post = await getPost(slug)
  if (!post) return { title: "Not found — Hot and Fresh" }
  return { title: `${post.title} — Hot and Fresh`, description: post.excerpt }
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const post = await getPost(slug)
  if (!post) notFound()

  return (
    <div id="top" className="min-h-screen tactical-grid">
      <SiteHeader />

      <main className="mx-auto max-w-3xl px-4 py-10 md:px-6">
        <Link
          href="/blog"
          className="label-mono mb-8 inline-flex items-center gap-2 text-muted-foreground transition-colors hover:text-primary"
        >
          <ArrowLeft className="h-4 w-4" /> Field Notes
        </Link>

        <div className="label-mono mb-4 flex items-center gap-3 text-primary">
          <span>{post.tag}</span>
          <span className="text-muted-foreground">{formatDate(post.date)}</span>
        </div>

        <h1 className="stencil text-balance text-3xl leading-tight text-foreground md:text-5xl">
          {post.title}
        </h1>

        <div className="label-mono mt-5 flex items-center gap-4 border-b border-border pb-6 text-muted-foreground">
          <span>{post.author}</span>
          <span className="flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" /> {post.readMinutes} MIN READ
          </span>
        </div>

        <article className="mt-8">
          <Markdown content={post.content} />
        </article>
      </main>

      <SiteFooter />
    </div>
  )
}
