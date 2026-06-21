import { createClient } from "@supabase/supabase-js"

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error("Supabase not configured")
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return createClient(url, key) as any
}

/**
 * Returns the set of canonical URLs that already exist in blog_posts.
 * Uses source_url column (which stores the original article URL for imported posts).
 */
export async function getExistingCanonicalUrls(urls: string[]): Promise<Set<string>> {
  if (urls.length === 0) return new Set()

  const supabase = getSupabaseClient()
  const { data, error } = await supabase
    .from("blog_posts")
    .select("source_url")
    .in("source_url", urls)

  if (error) throw new Error(`Dedup check failed: ${error.message}`)

  return new Set((data || []).map((r: { source_url: string }) => r.source_url))
}
