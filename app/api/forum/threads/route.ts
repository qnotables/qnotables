import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getForumThreads, parseForumFilters } from "@/lib/forum"

export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const filters = parseForumFilters(url.searchParams)
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    const result = await getForumThreads(filters, user?.id)
    return NextResponse.json(result, {
      headers: { "Cache-Control": "private, max-age=0, must-revalidate" },
    })
  } catch (error) {
    console.error("[v0] Forum threads API failed:", error)
    return NextResponse.json({ error: "Unable to load forum threads." }, { status: 500 })
  }
}
