"use server"

import { createClient } from "@/lib/supabase/server"

export type VoteType = "up" | "down"

export interface RecordVoteCounts {
  [recordId: string]: {
    up: number
    down: number
    userVote: VoteType | null
  }
}

/**
 * Fetch vote counts for a list of record slugs, and the current user's vote if signed in.
 */
export async function getRecordVotes(recordIds: string[]): Promise<RecordVoteCounts> {
  if (!recordIds.length) return {}

  const supabase = await createClient()

  const { data: votes, error } = await supabase
    .from("record_votes")
    .select("record_id, vote_type, user_id")
    .in("record_id", recordIds)

  if (error || !votes) return {}

  // Get current user id (null if anonymous)
  const {
    data: { user },
  } = await supabase.auth.getUser()
  const userId = user?.id ?? null

  // Aggregate counts
  const counts: RecordVoteCounts = {}

  for (const id of recordIds) {
    counts[id] = { up: 0, down: 0, userVote: null }
  }

  for (const vote of votes) {
    const c = counts[vote.record_id]
    if (!c) continue
    if (vote.vote_type === "up") c.up++
    else if (vote.vote_type === "down") c.down++
    if (userId && vote.user_id === userId) {
      c.userVote = vote.vote_type as VoteType
    }
  }

  return counts
}

/**
 * Toggle a vote on a record. Removes the vote if clicking the same type again.
 * Requires the user to be signed in.
 */
export async function voteOnRecord(
  recordId: string,
  voteType: VoteType,
): Promise<{ error?: string; counts?: { up: number; down: number } }> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: "You must be signed in to vote." }
  }

  // Check for an existing vote
  const { data: existing } = await supabase
    .from("record_votes")
    .select("id, vote_type")
    .eq("record_id", recordId)
    .eq("user_id", user.id)
    .maybeSingle()

  if (existing) {
    if (existing.vote_type === voteType) {
      // Same vote → retract it
      await supabase.from("record_votes").delete().eq("id", existing.id)
    } else {
      // Different vote → change it
      await supabase
        .from("record_votes")
        .update({ vote_type: voteType })
        .eq("id", existing.id)
    }
  } else {
    // New vote
    await supabase.from("record_votes").insert({
      record_id: recordId,
      user_id: user.id,
      vote_type: voteType,
    })
  }

  // Return fresh counts
  const { data: fresh } = await supabase
    .from("record_votes")
    .select("vote_type")
    .eq("record_id", recordId)

  const up = fresh?.filter((v: { vote_type: string }) => v.vote_type === "up").length ?? 0
  const down = fresh?.filter((v: { vote_type: string }) => v.vote_type === "down").length ?? 0

  return { counts: { up, down } }
}
