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
  const excerpt = String(formData.get("excerpt") ?? "").trim()
  const body = String(formData.get("body") ?? "").trim()
  const tag = String(formData.get("tag") ?? "Field Notes").trim() || "Field Notes"
  const coverImage = String(formData.get("cover_image") ?? "").trim() || null
  const authorName =
    String(formData.get("author_name") ?? "").trim() ||
    admin.email?.split("@")[0] ||
    "Editorial Desk"
  const published = formData.get("published") === "on"
  const customSlug = String(formData.get("slug") ?? "").trim()

  if (title.length < 3) return { error: "Title must be at least 3 characters." }
  if (body.length < 10) return { error: "Body is too short." }

  const slug = customSlug ? slugify(customSlug) : slugify(title)
  if (!slug) return { error: "Could not derive a valid slug from the title." }

  const readMinutes = Math.max(1, Math.round(wordCount(body) / 180))

  const db = createAdminClient()
  const { error } = await db.from("blog_posts").insert({
    slug,
    title,
    excerpt,
    body,
    tag,
    cover_image: coverImage,
    author_name: authorName,
    author_id: admin.id,
    read_minutes: readMinutes,
    published,
  })

  if (error) {
    if (error.code === "23505") return { error: "A post with that slug already exists." }
    return { error: error.message }
  }

  revalidatePath("/blog")
  revalidatePath(`/blog/${slug}`)
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
  const excerpt = String(formData.get("excerpt") ?? "").trim()
  const body = String(formData.get("body") ?? "").trim()
  const tag = String(formData.get("tag") ?? "Field Notes").trim() || "Field Notes"
  const coverImage = String(formData.get("cover_image") ?? "").trim() || null
  const authorName = String(formData.get("author_name") ?? "").trim() || "Editorial Desk"
  const published = formData.get("published") === "on"
  const slug = slugify(String(formData.get("slug") ?? "").trim() || title)

  if (title.length < 3) return { error: "Title must be at least 3 characters." }
  if (body.length < 10) return { error: "Body is too short." }
  if (!slug) return { error: "Could not derive a valid slug." }

  const readMinutes = Math.max(1, Math.round(wordCount(body) / 180))

  const db = createAdminClient()
  const { error } = await db
    .from("blog_posts")
    .update({
      slug,
      title,
      excerpt,
      body,
      tag,
      cover_image: coverImage,
      author_name: authorName,
      read_minutes: readMinutes,
      published,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)

  if (error) {
    if (error.code === "23505") return { error: "A post with that slug already exists." }
    return { error: error.message }
  }

  revalidatePath("/blog")
  revalidatePath(`/blog/${slug}`)
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
