import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const q = (searchParams.get("q") ?? "").trim()

  if (q.length < 2) {
    return NextResponse.json({ threads: [], posts: [] })
  }

  const supabase = await createClient()
  const pattern = `%${q}%`

  const [{ data: threads }, { data: posts }] = await Promise.all([
    supabase
      .from("forum_threads")
      .select("id, title, body, created_at, profiles(display_name)")
      .or(`title.ilike.${pattern},body.ilike.${pattern}`)
      .order("created_at", { ascending: false })
      .limit(6),

    supabase
      .from("blog_posts")
      .select("id, slug, title, excerpt, tag, created_at")
      .eq("published", true)
      .or(`title.ilike.${pattern},excerpt.ilike.${pattern},body.ilike.${pattern}`)
      .order("created_at", { ascending: false })
      .limit(6),
  ])

  return NextResponse.json({ threads: threads ?? [], posts: posts ?? [] })
}
