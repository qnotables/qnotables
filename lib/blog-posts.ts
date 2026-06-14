import fs from "fs"
import path from "path"
import matter from "gray-matter"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"

export interface BlogPost {
  id?: string // present for database-backed posts
  slug: string
  title: string
  excerpt: string
  author: string
  date: string // ISO
  readMinutes: number
  tag: string
  content: string // markdown
  coverImage?: string | null
  published?: boolean
  source: "db" | "mdx"
}

const contentDir = path.join(process.cwd(), "content", "blog")

// ---------- MDX (static sample) posts ----------

function getMdxPosts(): BlogPost[] {
  if (!fs.existsSync(contentDir)) return []

  const files = fs.readdirSync(contentDir).filter((f) => f.endsWith(".mdx"))

  return files.map((filename) => {
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
      coverImage: data.coverImage ?? null,
      published: true,
      source: "mdx",
    } as BlogPost
  })
}

// ---------- Database posts ----------

interface BlogRow {
  id: string
  slug: string
  title: string
  excerpt: string
  cover_image: string | null
  body: string
  author_name: string
  tag: string
  read_minutes: number
  published: boolean
  created_at: string
}

function rowToPost(row: BlogRow): BlogPost {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    excerpt: row.excerpt,
    author: row.author_name,
    date: row.created_at,
    readMinutes: row.read_minutes,
    tag: row.tag,
    content: row.body,
    coverImage: row.cover_image,
    published: row.published,
    source: "db",
  }
}

async function getDbPosts(): Promise<BlogPost[]> {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from("blog_posts")
      .select(
        "id, slug, title, excerpt, cover_image, body, author_name, tag, read_minutes, published, created_at",
      )
      .eq("published", true)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("[v0] getDbPosts error", error.message)
      return []
    }
    return (data as BlogRow[]).map(rowToPost)
  } catch (err) {
    console.error("[v0] getDbPosts exception", err)
    return []
  }
}

// ---------- Public API ----------

/** Merge published DB posts + MDX posts. DB posts win on slug collisions. */
export async function getAllPosts(): Promise<BlogPost[]> {
  const [dbPosts, mdxPosts] = await Promise.all([getDbPosts(), Promise.resolve(getMdxPosts())])

  const bySlug = new Map<string, BlogPost>()
  for (const p of mdxPosts) bySlug.set(p.slug, p)
  for (const p of dbPosts) bySlug.set(p.slug, p) // DB overrides MDX

  return Array.from(bySlug.values()).sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  )
}

export async function getPost(slug: string): Promise<BlogPost | undefined> {
  const posts = await getAllPosts()
  return posts.find((p) => p.slug === slug)
}

// ---------- Admin API (service role, bypasses RLS) ----------

/** All DB posts including unpublished drafts — admin only. */
export async function getAllPostsAdmin(): Promise<BlogPost[]> {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from("blog_posts")
    .select(
      "id, slug, title, excerpt, cover_image, body, author_name, tag, read_minutes, published, created_at",
    )
    .order("created_at", { ascending: false })

  if (error) {
    console.error("[v0] getAllPostsAdmin error", error.message)
    return []
  }
  return (data as BlogRow[]).map(rowToPost)
}

/** Fetch a single DB post by id (any publish state) — admin only. */
export async function getPostByIdAdmin(id: string): Promise<BlogPost | undefined> {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from("blog_posts")
    .select(
      "id, slug, title, excerpt, cover_image, body, author_name, tag, read_minutes, published, created_at",
    )
    .eq("id", id)
    .maybeSingle()

  if (error) {
    console.error("[v0] getPostByIdAdmin error", error.message)
    return undefined
  }
  return data ? rowToPost(data as BlogRow) : undefined
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  })
}
