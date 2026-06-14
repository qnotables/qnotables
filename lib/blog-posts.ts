import fs from "fs"
import path from "path"
import matter from "gray-matter"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"

export interface BlogPost {
  id?: string // present for database-backed posts
  slug: string
  title: string
  subtitle?: string
  excerpt: string
  author: string
  date: string // ISO
  readMinutes: number
  tag: string
  category?: string
  tags?: string[] // many-to-many
  postType?: string // Field Note, News Brief, etc.
  priority?: "low" | "medium" | "high" | "critical"
  featured?: boolean
  content: string // markdown
  coverImage?: string | null
  status?: "draft" | "published" | "scheduled" | "hidden" | "archived"
  sourceUrl?: string
  sourceName?: string
  seoTitle?: string
  seoDescription?: string
  publishedAt?: string
  updatedAt?: string
  published?: boolean // legacy
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

export interface BlogRow {
  id: string
  slug: string
  title: string
  subtitle?: string
  excerpt: string
  cover_image: string | null
  body: string
  author_name: string
  tag: string
  category?: string
  post_type?: string
  read_minutes: number
  published: boolean
  status?: "draft" | "published" | "scheduled" | "hidden" | "archived"
  featured?: boolean
  priority?: "low" | "medium" | "high" | "critical"
  source_url?: string
  source_name?: string
  seo_title?: string
  seo_description?: string
  created_at: string
  published_at?: string
  updated_at?: string
  blog_post_tags?: Array<{ tag: string }>
}

export function rowToPost(row: BlogRow): BlogPost {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    subtitle: row.subtitle,
    excerpt: row.excerpt,
    author: row.author_name,
    date: row.published_at || row.created_at,
    readMinutes: row.read_minutes,
    tag: row.tag,
    category: row.category,
    tags: row.blog_post_tags?.map((t) => t.tag) || [],
    postType: row.post_type,
    priority: row.priority,
    featured: row.featured,
    content: row.body,
    coverImage: row.cover_image,
    published: row.published,
    status: row.status || (row.published ? "published" : "draft"),
    sourceUrl: row.source_url,
    sourceName: row.source_name,
    seoTitle: row.seo_title,
    seoDescription: row.seo_description,
    publishedAt: row.published_at,
    updatedAt: row.updated_at,
    source: "db",
  }
}

async function getDbPosts(): Promise<BlogPost[]> {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from("blog_posts")
      .select(
        "id, slug, title, subtitle, excerpt, cover_image, body, author_name, tag, category, post_type, read_minutes, published, status, featured, source_url, source_name, created_at, published_at, updated_at, blog_post_tags(tag)",
      )
      .eq("status", "published")
      .order("published_at", { ascending: false, nullsFirst: false })

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
      "id, slug, title, subtitle, excerpt, cover_image, body, author_name, tag, category, post_type, read_minutes, published, status, featured, source_url, source_name, created_at, published_at, updated_at, blog_post_tags(tag)",
    )
    .order("published_at", { ascending: false, nullsFirst: false })

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
      "id, slug, title, subtitle, excerpt, cover_image, body, author_name, tag, category, post_type, read_minutes, published, status, featured, source_url, source_name, created_at, published_at, updated_at, blog_post_tags(tag)",
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
