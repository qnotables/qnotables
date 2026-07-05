"use server"

import { createClient } from "@/lib/supabase/server"

export async function incrementPostView(postId: string): Promise<number> {
  const supabase = await createClient()
  const { data, error } = await supabase.rpc("increment_post_view", { p_post_id: postId })
  if (error) return 0
  return Number(data) ?? 0
}

export async function getPostViewCount(postId: string): Promise<number> {
  const supabase = await createClient()
  const { count, error } = await supabase
    .from("blog_post_views")
    .select("*", { count: "exact", head: true })
    .eq("post_id", postId)
  if (error) return 0
  return count ?? 0
}
