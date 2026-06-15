"use server"

import { revalidatePath } from "next/cache"
import { createAdminClient } from "@/lib/supabase/admin"
import { validateDashboardAccess } from "@/lib/dashboard-auth"
import { logActivity } from "@/lib/dashboard-data"

interface ActionState {
  error: string | null
  success?: boolean
}

function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 80)
}

function wordCount(text: string): number {
  return text.split(/\s+/).filter(Boolean).length
}

function parseForm(formData: FormData) {
  const title = String(formData.get("title") ?? "").trim()
  const body = String(formData.get("body") ?? "").trim()
  const status = String(formData.get("status") ?? "draft")
  const customSlug = String(formData.get("slug") ?? "").trim()
  const episodeDate = String(formData.get("episode_date") ?? "").trim() || null
  const showTitle = formData.get("show_title") === "on"

  return {
    title,
    subtitle: String(formData.get("subtitle") ?? "").trim() || null,
    excerpt: String(formData.get("excerpt") ?? "").trim(),
    body,
    tag: String(formData.get("tag") ?? "Field Notes").trim() || "Field Notes",
    category: String(formData.get("category") ?? "").trim() || null,
    post_type: String(formData.get("post_type") ?? "").trim() || null,
    status,
    featured: formData.get("featured") === "on",
    priority: String(formData.get("priority") ?? "medium"),
    cover_image: String(formData.get("cover_image") ?? "").trim() || null,
    author_name: String(formData.get("author_name") ?? "").trim() || "Editorial Desk",
    seo_title: String(formData.get("seo_title") ?? "").trim() || null,
    seo_description: String(formData.get("seo_description") ?? "").trim() || null,
    og_image_url: String(formData.get("og_image_url") ?? "").trim() || null,
    source_name: String(formData.get("source_name") ?? "").trim() || null,
    source_url: String(formData.get("source_url") ?? "").trim() || null,
    show_title: showTitle,
    episode_date: episodeDate,
    customSlug,
  }
}

export async function createPostDashboard(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  if (!(await validateDashboardAccess())) return { error: "Not authorized." }

  const f = parseForm(formData)
  if (f.title.length < 3) return { error: "Title must be at least 3 characters." }
  if (f.body.length < 10) return { error: "Body is too short." }

  const slug = f.customSlug ? slugify(f.customSlug) : slugify(f.title)
  if (!slug) return { error: "Could not derive a valid slug." }

  // Imported/created items should not publish without a published_at date.
  const publishedAt = f.status === "published" ? new Date().toISOString() : null

  const db = createAdminClient()
  const { error } = await db.from("blog_posts").insert({
    slug,
    title: f.title,
    subtitle: f.subtitle,
    excerpt: f.excerpt,
    body: f.body,
    tag: f.tag,
    category: f.category,
    post_type: f.post_type,
    status: f.status,
    featured: f.featured,
    priority: f.priority,
    cover_image: f.cover_image,
    author_name: f.author_name,
    read_minutes: Math.max(1, Math.round(wordCount(f.body) / 180)),
    seo_title: f.seo_title,
    seo_description: f.seo_description,
    og_image_url: f.og_image_url,
    source_name: f.source_name,
    source_url: f.source_url,
    show_title: f.show_title,
    episode_date: f.episode_date,
    published_at: publishedAt,
  })

  if (error) {
    if (error.code === "23505") return { error: "A post with that slug already exists." }
    return { error: error.message }
  }

  await logActivity({ action: "created blog post", targetType: "blog_post", details: f.title })
  revalidatePath("/dashboard/blog")
  revalidatePath("/archives")
  return { error: null, success: true }
}

export async function updatePostDashboard(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  if (!(await validateDashboardAccess())) return { error: "Not authorized." }

  const id = String(formData.get("id") ?? "")
  if (!id) return { error: "Missing post id." }

  const f = parseForm(formData)
  if (f.title.length < 3) return { error: "Title must be at least 3 characters." }
  if (f.body.length < 10) return { error: "Body is too short." }

  const slug = slugify(f.customSlug || f.title)
  if (!slug) return { error: "Could not derive a valid slug." }

  const publishedAt = f.status === "published" ? new Date().toISOString() : null

  const db = createAdminClient()
  const { error } = await db
    .from("blog_posts")
    .update({
      slug,
      title: f.title,
      subtitle: f.subtitle,
      excerpt: f.excerpt,
      body: f.body,
      tag: f.tag,
      category: f.category,
      post_type: f.post_type,
      status: f.status,
      featured: f.featured,
      priority: f.priority,
      cover_image: f.cover_image,
      author_name: f.author_name,
      read_minutes: Math.max(1, Math.round(wordCount(f.body) / 180)),
      seo_title: f.seo_title,
      seo_description: f.seo_description,
      og_image_url: f.og_image_url,
      source_name: f.source_name,
      source_url: f.source_url,
      show_title: f.show_title,
      episode_date: f.episode_date,
      published_at: publishedAt,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)

  if (error) {
    if (error.code === "23505") return { error: "A post with that slug already exists." }
    return { error: error.message }
  }

  await logActivity({ action: "updated blog post", targetType: "blog_post", targetId: id })
  revalidatePath("/dashboard/blog")
  revalidatePath("/archives")
  return { error: null, success: true }
}
