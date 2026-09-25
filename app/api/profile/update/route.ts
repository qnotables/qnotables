import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

const USERNAME_PATTERN = /^[a-z0-9_]{3,20}$/

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await request.json()
  const username = String(body.username ?? "").trim().toLowerCase()
  const displayName = String(body.displayName ?? "").trim()
  if (!displayName) return NextResponse.json({ error: "Display name is required." }, { status: 400 })
  if (!USERNAME_PATTERN.test(username)) return NextResponse.json({ error: "Use 3–20 lowercase letters, numbers, or underscores." }, { status: 400 })

  const privacy = body.privacy && typeof body.privacy === "object" ? body.privacy : {}
  const payload = {
    display_name: displayName,
    username,
    bio: String(body.bio ?? "").trim().slice(0, 160),
      location: String(body.location ?? "").trim().slice(0, 80),
    website_url: String(body.website ?? "").trim().slice(0, 2048),
    social_links: Object.fromEntries(
      String(body.socialLinks ?? "").split(",").map((item: string) => item.trim()).filter(Boolean).slice(0, 6).map((item: string, index: number) => [`link_${index}`, item]),
    ),
    privacy: {
      show_location: Boolean(privacy.showLocation),
      show_website: Boolean(privacy.showWebsite),
      show_social: Boolean(privacy.showSocial),
      show_activity: Boolean(privacy.showActivity),
      show_followers: Boolean(privacy.showFollowers),
    },
  }

  const { data, error } = await supabase.from("profiles").update(payload).eq("id", user.id).select("*").single()
  if (error) {
    if (error.code === "23505") return NextResponse.json({ error: "That username is already taken." }, { status: 409 })
    return NextResponse.json({ error: "Could not save your profile." }, { status: 500 })
  }

  const requestedFeatured = Array.isArray(body.featuredThreadIds) ? body.featuredThreadIds.filter((id: unknown): id is string => typeof id === "string").slice(0, 3) : []
  if (requestedFeatured.length > 0) {
    const { data: publicThreads, error: threadError } = await supabase.from("forum_threads").select("id").in("id", requestedFeatured).eq("author_id", user.id).eq("status", "published").eq("is_soft_deleted", false).eq("is_pending", false)
    if (threadError || (publicThreads?.length ?? 0) !== requestedFeatured.length) return NextResponse.json({ error: "Featured contributions must be your own public threads." }, { status: 400 })
  }
  const { error: clearFeaturedError } = await supabase.from("profile_featured_items").delete().eq("profile_id", user.id)
  if (clearFeaturedError) return NextResponse.json({ error: "Could not update featured contributions." }, { status: 500 })
  if (requestedFeatured.length > 0) {
    const { error: insertFeaturedError } = await supabase.from("profile_featured_items").insert(requestedFeatured.map((sourceId: string, position: number) => ({ profile_id: user.id, source_type: "thread", source_id: sourceId, position })))
    if (insertFeaturedError) return NextResponse.json({ error: "Could not update featured contributions." }, { status: 500 })
  }

  return NextResponse.json({ profile: data })
}
