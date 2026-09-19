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
    pronouns: String(body.pronouns ?? "").trim().slice(0, 40),
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
  return NextResponse.json({ profile: data })
}
