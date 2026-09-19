import { NextRequest, NextResponse } from "next/server"
import { put } from "@vercel/blob"
import { createClient } from "@/lib/supabase/server"

export const runtime = "nodejs"

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const formData = await request.formData()
  const file = formData.get("file")
  if (!(file instanceof File) || !file.type.startsWith("image/")) return NextResponse.json({ error: "Choose an image file." }, { status: 400 })
  if (file.size > 8 * 1024 * 1024) return NextResponse.json({ error: "Banner must be smaller than 8MB." }, { status: 400 })

  const ext = file.name.split(".").pop() || "jpg"
  const blob = await put(`banners/${user.id}/banner.${ext}`, file, { access: "public", addRandomSuffix: false })
  const { error } = await supabase.from("profiles").update({ banner_url: blob.url }).eq("id", user.id)
  if (error) return NextResponse.json({ error: "Could not save banner." }, { status: 500 })
  return NextResponse.json({ url: blob.url })
}
