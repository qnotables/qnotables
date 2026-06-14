import fs from "fs"
import path from "path"
import matter from "gray-matter"

export interface BlogPost {
  slug: string
  title: string
  excerpt: string
  author: string
  date: string // ISO
  readMinutes: number
  tag: string
  content: string // markdown
}

const contentDir = path.join(process.cwd(), "content", "blog")

export async function getAllPosts(): Promise<BlogPost[]> {
  if (!fs.existsSync(contentDir)) {
    return []
  }

  const files = fs.readdirSync(contentDir).filter((f) => f.endsWith(".mdx"))

  const posts = files
    .map((filename) => {
      const filePath = path.join(contentDir, filename)
      const fileContent = fs.readFileSync(filePath, "utf-8")
      const { data, content } = matter(fileContent)

      const slug = filename.replace(".mdx", "")

      return {
        slug,
        title: data.title || "Untitled",
        excerpt: data.excerpt || "",
        author: data.author || "Anonymous",
        date: data.date || new Date().toISOString().split("T")[0],
        readMinutes: data.readMinutes || 5,
        tag: data.tag || "Uncategorized",
        content,
      } as BlogPost
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  return posts
}

export async function getPost(slug: string): Promise<BlogPost | undefined> {
  const posts = await getAllPosts()
  return posts.find((p) => p.slug === slug)
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  })
}
