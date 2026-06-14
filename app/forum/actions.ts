"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { isAdminEmail } from "@/lib/admin"

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
  const parentReplyId = String(formData.get("parent_reply_id") ?? "") || null

  if (!threadId) return { error: "Missing thread." }
  if (body.length < 2) return { error: "Reply is too short." }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: "You must be signed in to reply." }

  const { error } = await supabase
    .from("forum_replies")
    .insert({
      thread_id: threadId,
      body,
      author_id: user.id,
      parent_reply_id: parentReplyId,
    })

  if (error) return { error: error.message }

  revalidatePath(`/forum/${threadId}`)
  return { error: null }
}

export async function deleteThreadAsAdmin(threadId: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: "You must be signed in to delete." }

  // Check admin status via ADMIN_EMAILS
  if (!isAdminEmail(user.email)) {
    return { error: "You do not have permission to delete threads." }
  }

  const { error } = await supabase
    .from("forum_threads")
    .delete()
    .eq("id", threadId)

  if (error) return { error: error.message }

  revalidatePath("/forum")
  revalidatePath("/admin/forum")
  return { error: null }
}

export async function lockThread(threadId: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user || !isAdminEmail(user.email)) {
    return { error: "You do not have permission." }
  }

  const { error } = await supabase
    .from("forum_threads")
    .update({ is_locked: true })
    .eq("id", threadId)

  if (error) return { error: error.message }
  revalidatePath(`/forum/${threadId}`)
  revalidatePath("/admin/forum")
  return { error: null }
}

export async function unlockThread(threadId: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user || !isAdminEmail(user.email)) {
    return { error: "You do not have permission." }
  }

  const { error } = await supabase
    .from("forum_threads")
    .update({ is_locked: false })
    .eq("id", threadId)

  if (error) return { error: error.message }
  revalidatePath(`/forum/${threadId}`)
  revalidatePath("/admin/forum")
  return { error: null }
}

export async function pinThread(threadId: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user || !isAdminEmail(user.email)) {
    return { error: "You do not have permission." }
  }

  const { error } = await supabase
    .from("forum_threads")
    .update({ is_pinned: true })
    .eq("id", threadId)

  if (error) return { error: error.message }
  revalidatePath("/forum")
  revalidatePath("/admin/forum")
  return { error: null }
}

export async function unpinThread(threadId: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user || !isAdminEmail(user.email)) {
    return { error: "You do not have permission." }
  }

  const { error } = await supabase
    .from("forum_threads")
    .update({ is_pinned: false })
    .eq("id", threadId)

  if (error) return { error: error.message }
  revalidatePath("/forum")
  revalidatePath("/admin/forum")
  return { error: null }
}

export async function softDeleteThread(threadId: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user || !isAdminEmail(user.email)) {
    return { error: "You do not have permission." }
  }

  const { error } = await supabase
    .from("forum_threads")
    .update({ is_soft_deleted: true })
    .eq("id", threadId)

  if (error) return { error: error.message }
  revalidatePath("/forum")
  revalidatePath("/admin/forum")
  return { error: null }
}

export async function restoreThread(threadId: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user || !isAdminEmail(user.email)) {
    return { error: "You do not have permission." }
  }

  const { error } = await supabase
    .from("forum_threads")
    .update({ is_soft_deleted: false })
    .eq("id", threadId)

  if (error) return { error: error.message }
  revalidatePath("/forum")
  revalidatePath("/admin/forum")
  return { error: null }
}

export async function voteOnReply(replyId: string, voteType: "up" | "down") {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: "You must be signed in to vote." }

  // Check if user already voted
  const { data: existing } = await supabase
    .from("reply_votes")
    .select("id, vote_type")
    .eq("reply_id", replyId)
    .eq("user_id", user.id)
    .maybeSingle()

  let error = null

  if (existing) {
    // Toggle or change vote
    if (existing.vote_type === voteType) {
      // Remove vote
      const { error: delError } = await supabase
        .from("reply_votes")
        .delete()
        .eq("id", existing.id)
      error = delError?.message || null
    } else {
      // Change vote type
      const { error: updateError } = await supabase
        .from("reply_votes")
        .update({ vote_type: voteType })
        .eq("id", existing.id)
      error = updateError?.message || null
    }
  } else {
    // Add new vote
    const { error: insertError } = await supabase
      .from("reply_votes")
      .insert({ reply_id: replyId, user_id: user.id, vote_type: voteType })
    error = insertError?.message || null
  }

  if (error) return { error }

  // Update author karma based on total votes on their reply
  const { data: votes } = await supabase
    .from("reply_votes")
    .select("vote_type")
    .eq("reply_id", replyId)

  const upVotes = votes?.filter((v) => v.vote_type === "up").length ?? 0
  const downVotes = votes?.filter((v) => v.vote_type === "down").length ?? 0
  const karma = upVotes - downVotes

  // Get reply author
  const { data: reply } = await supabase
    .from("forum_replies")
    .select("author_id")
    .eq("id", replyId)
    .maybeSingle()

  if (reply?.author_id) {
    // Calculate total karma for this user across all their replies
    const { data: allVotes } = await supabase
      .from("reply_votes")
      .select("vote_type, forum_replies(author_id)")
      .eq("forum_replies.author_id", reply.author_id)

    const totalKarma =
      allVotes?.filter((v) => v.vote_type === "up").length ?? 0 -
      (allVotes?.filter((v) => v.vote_type === "down").length ?? 0)

    await supabase.from("profiles").update({ karma: totalKarma }).eq("id", reply.author_id)
  }

  revalidatePath(`/forum/[slug]`)
  return { error: null }
}
