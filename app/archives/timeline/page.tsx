import { getAllPosts } from "@/lib/blog-posts"
import TimelinePageClient from "./timeline-client"

export const metadata = {
  title: "Timeline — HOT AND FRESH",
  description: "Archives organized chronologically by timeline date",
}

export default async function TimelinePage() {
  const posts = await getAllPosts()
  return <TimelinePageClient posts={posts} />
}
