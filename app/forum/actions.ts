"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"

export async function createThread(formData: FormData) {
  const title = String(formData.get("title") ?? "").trim()
  const body = String(formData.get("body") ?? "").trim()

  if (title.length < 4 || body.length < 4) {
    return { error: "Title and body must each be at least 4 characters." }
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: "You must be signed in to post." }

  const { data, error } = await supabase
    .from("forum_threads")
    .insert({ title, body, author_id: user.id })
    .select("id")
    .single()

  if (error) return { error: error.message }

  revalidatePath("/forum")
  redirect(`/forum/${data.id}`)
}

export async function updateThread(formData: FormData) {
  const id = String(formData.get("thread_id") ?? "")
  const title = String(formData.get("title") ?? "").trim()
  const body = String(formData.get("body") ?? "").trim()

  if (!id) return { error: "Missing thread." }
  if (title.length < 4 || body.length < 4) {
    return { error: "Title and body must each be at least 4 characters." }
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: "You must be signed in to edit." }

  const { error } = await supabase
    .from("forum_threads")
    .update({ title, body })
    .eq("id", id)
    .eq("author_id", user.id)

  if (error) return { error: error.message }

  revalidatePath(`/forum/${id}`)
  revalidatePath("/forum")
  return { error: null }
}

export async function deleteThread(formData: FormData) {
  const id = String(formData.get("thread_id") ?? "")
  if (!id) return { error: "Missing thread." }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: "You must be signed in to delete." }

  const { error } = await supabase
    .from("forum_threads")
    .delete()
    .eq("id", id)
    .eq("author_id", user.id)

  if (error) return { error: error.message }

  revalidatePath("/forum")
  redirect("/forum")
}

export async function updateDisplayName(formData: FormData) {
  const displayName = String(formData.get("display_name") ?? "").trim()

  if (displayName.length < 2 || displayName.length > 32) {
    return { error: "Display name must be between 2 and 32 characters." }
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: "You must be signed in." }

  const { error } = await supabase
    .from("profiles")
    .update({ display_name: displayName })
    .eq("id", user.id)

  if (error) return { error: error.message }

  revalidatePath(`/u/${user.id}`)
  revalidatePath("/forum")
  return { error: null }
}

export async function createReply(formData: FormData) {
  const threadId = String(formData.get("thread_id") ?? "")
  const body = String(formData.get("body") ?? "").trim()

  if (!threadId) return { error: "Missing thread." }
  if (body.length < 2) return { error: "Reply is too short." }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: "You must be signed in to reply." }

  const { error } = await supabase
    .from("forum_replies")
    .insert({ thread_id: threadId, body, author_id: user.id })

  if (error) return { error: error.message }

  revalidatePath(`/forum/${threadId}`)
  return { error: null }
}
