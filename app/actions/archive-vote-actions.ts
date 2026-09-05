"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"

/** Increment the view_count for a post. Fire-and-forget — never throws. */
export async function incrementArchiveViews(postId: string): Promise<void> {
  try {
    const admin = createAdminClient()
    const { error } = await admin.rpc("increment_post_view", { p_post_id: postId })
    if (error) throw error
  } catch {
    // Silently ignore — view tracking is non-critical
  }
}

/** Get vote counts and the current user's vote for a post. */
export async function getArchiveVotes(postId: string): Promise<{
  upVotes: number
  downVotes: number
  userVote: "up" | "down" | null
}> {
  const supabase = await createClient()
  const admin = createAdminClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Aggregate counts via admin client (bypasses RLS read restriction issues)
  const { data: votes } = await admin
    .from("archive_votes")
    .select("vote_type")
    .eq("post_id", postId)

  const upVotes = votes?.filter((v) => v.vote_type === "up").length ?? 0
  const downVotes = votes?.filter((v) => v.vote_type === "down").length ?? 0

  let userVote: "up" | "down" | null = null
  if (user) {
    const { data: existing } = await admin
      .from("archive_votes")
      .select("vote_type")
      .eq("post_id", postId)
      .eq("user_id", user.id)
      .maybeSingle()
    userVote = (existing?.vote_type as "up" | "down") ?? null
  }

  return { upVotes, downVotes, userVote }
}

/** Cast, change, or retract a vote on an archive post. */
export async function voteOnArchivePost(
  postId: string,
  slug: string,
  voteType: "up" | "down",
): Promise<{ error: string | null }> {
  const supabase = await createClient()
  const admin = createAdminClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: "You must be signed in to vote." }

  // Use the privileged server client only after authenticating the caller.
  // This keeps vote mutations reliable even when public RLS policies are read-only.
  const { data: existing, error: existingError } = await admin
    .from("archive_votes")
    .select("id, vote_type")
    .eq("post_id", postId)
    .eq("user_id", user.id)
    .maybeSingle()

  if (existingError) return { error: "Unable to load your vote. Please try again." }

  let error: string | null = null

  if (existing) {
    if (existing.vote_type === voteType) {
      // Toggle off — remove the vote
      const { error: delError } = await admin
        .from("archive_votes")
        .delete()
        .eq("id", existing.id)
      error = delError?.message ?? null
    } else {
      // Change vote
      const { error: updateError } = await admin
        .from("archive_votes")
        .update({ vote_type: voteType })
        .eq("id", existing.id)
      error = updateError?.message ?? null
    }
  } else {
    // New vote
    const { error: insertError } = await admin
      .from("archive_votes")
      .insert({ post_id: postId, user_id: user.id, vote_type: voteType })
    error = insertError?.message ?? null
  }

  if (error) return { error }

  revalidatePath(`/archives/${slug}`)
  return { error: null }
}
