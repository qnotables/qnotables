import { getAllPosts } from "@/lib/blog-posts"
import { pageMetadata } from "@/lib/seo"
import TimelinePageClient from "./timeline-client"

export const metadata = pageMetadata({
  title: "Timeline",
  description: "Browse QNotables archive records organized chronologically by timeline date.",
  path: "/archives/timeline",
})

export default async function TimelinePage() {
  const posts = await getAllPosts()
  return <TimelinePageClient posts={posts} />
}
