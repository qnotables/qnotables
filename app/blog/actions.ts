"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { getAdminUser } from "@/lib/admin"
import { createAdminClient } from "@/lib/supabase/admin"

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

interface ActionState {
  error: string | null
}

export async function createPost(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const admin = await getAdminUser()
  if (!admin) return { error: "Not authorized." }

  const title = String(formData.get("title") ?? "").trim()
  const subtitle = String(formData.get("subtitle") ?? "").trim() || null
  const excerpt = String(formData.get("excerpt") ?? "").trim()
  const body = String(formData.get("body") ?? "").trim()
  const tag = String(formData.get("tag") ?? "Field Notes").trim() || "Field Notes"
  const category = String(formData.get("category") ?? "").trim() || null
  const postType = String(formData.get("post_type") ?? "").trim() || null
  const status = (String(formData.get("status") ?? "draft") as any) || "draft"
  const featured = formData.get("featured") === "on"
  const priority = (String(formData.get("priority") ?? "medium") as any) || "medium"
  const coverImage = String(formData.get("cover_image") ?? "").trim() || null
  const authorName =
    String(formData.get("author_name") ?? "").trim() ||
    admin.email?.split("@")[0] ||
    "Editorial Desk"
  const seoTitle = String(formData.get("seo_title") ?? "").trim() || null
  const seoDescription = String(formData.get("seo_description") ?? "").trim() || null
  const seoImageUrl = String(formData.get("seo_image_url") ?? "").trim() || null
  const sourceName = String(formData.get("source_name") ?? "").trim() || null
  const sourceUrl = String(formData.get("source_url") ?? "").trim() || null
  const customSlug = String(formData.get("slug") ?? "").trim()

  if (title.length < 3) return { error: "Title must be at least 3 characters." }
  if (body.length < 10) return { error: "Body is too short." }

  const slug = customSlug ? slugify(customSlug) : slugify(title)
  if (!slug) return { error: "Could not derive a valid slug from the title." }

  const readMinutes = Math.max(1, Math.round(wordCount(body) / 180))
  const publishedAt = status === "published" ? new Date().toISOString() : null

  const db = createAdminClient()
  const { error } = await db.from("blog_posts").insert({
    slug,
    title,
    subtitle,
    excerpt,
    body,
    tag,
    category,
    post_type: postType,
    status,
    featured,
    priority,
    cover_image: coverImage,
    seo_image_url: seoImageUrl,
    author_name: authorName,
    author_id: admin.id,
    read_minutes: readMinutes,
    seo_title: seoTitle,
    seo_description: seoDescription,
    source_name: sourceName,
    source_url: sourceUrl,
    published_at: publishedAt,
  })

  if (error) {
    if (error.code === "23505") return { error: "A post with that slug already exists." }
    return { error: error.message }
  }

  revalidatePath("/archives")
  revalidatePath(`/archives/${slug}`)
  revalidatePath("/blog/admin")
  redirect("/blog/admin")
}

export async function updatePost(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const admin = await getAdminUser()
  if (!admin) return { error: "Not authorized." }

  const id = String(formData.get("id") ?? "")
  if (!id) return { error: "Missing post id." }

  const title = String(formData.get("title") ?? "").trim()
  const subtitle = String(formData.get("subtitle") ?? "").trim() || null
  const excerpt = String(formData.get("excerpt") ?? "").trim()
  const body = String(formData.get("body") ?? "").trim()
  const tag = String(formData.get("tag") ?? "Field Notes").trim() || "Field Notes"
  const category = String(formData.get("category") ?? "").trim() || null
  const postType = String(formData.get("post_type") ?? "").trim() || null
  const status = (String(formData.get("status") ?? "draft") as any) || "draft"
  const featured = formData.get("featured") === "on"
  const priority = (String(formData.get("priority") ?? "medium") as any) || "medium"
  const coverImage = String(formData.get("cover_image") ?? "").trim() || null
  const seoImageUrl = String(formData.get("seo_image_url") ?? "").trim() || null
  const authorName = String(formData.get("author_name") ?? "").trim() || "Editorial Desk"
  const seoTitle = String(formData.get("seo_title") ?? "").trim() || null
  const seoDescription = String(formData.get("seo_description") ?? "").trim() || null
  const sourceName = String(formData.get("source_name") ?? "").trim() || null
  const sourceUrl = String(formData.get("source_url") ?? "").trim() || null
  const slug = slugify(String(formData.get("slug") ?? "").trim() || title)

  if (title.length < 3) return { error: "Title must be at least 3 characters." }
  if (body.length < 10) return { error: "Body is too short." }
  if (!slug) return { error: "Could not derive a valid slug." }

  const readMinutes = Math.max(1, Math.round(wordCount(body) / 180))
  const publishedAt = status === "published" ? new Date().toISOString() : null

  const db = createAdminClient()
  const { error } = await db
    .from("blog_posts")
    .update({
      slug,
      title,
      subtitle,
      excerpt,
      body,
      tag,
      category,
      post_type: postType,
      status,
      featured,
      priority,
      cover_image: coverImage,
      seo_image_url: seoImageUrl,
      author_name: authorName,
      read_minutes: readMinutes,
      seo_title: seoTitle,
      seo_description: seoDescription,
      source_name: sourceName,
      source_url: sourceUrl,
      published_at: publishedAt,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)

  if (error) {
    if (error.code === "23505") return { error: "A post with that slug already exists." }
    return { error: error.message }
  }

  revalidatePath("/archives")
  revalidatePath(`/archives/${slug}`)
  revalidatePath("/blog/admin")
  redirect("/blog/admin")
}

export async function deletePost(formData: FormData): Promise<void> {
  const admin = await getAdminUser()
  if (!admin) return

  const id = String(formData.get("id") ?? "")
  if (!id) return

  const db = createAdminClient()
  await db.from("blog_posts").delete().eq("id", id)

  revalidatePath("/blog")
  revalidatePath("/blog/admin")
}
