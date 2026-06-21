import { NextRequest, NextResponse } from "next/server"
import { put } from "@vercel/blob"
import { createClient } from "@/lib/supabase/server"

export const runtime = "nodejs"

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get("file") as File

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ error: "File must be an image" }, { status: 400 })
    }

    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: "File too large (max 5MB)" }, { status: 400 })
    }

    // Upload to Vercel Blob under a stable per-user path
    const ext = file.name.split(".").pop() ?? "jpg"
    const filename = `avatars/${user.id}/avatar.${ext}`
    const blob = await put(filename, file, {
      access: "public",
      addRandomSuffix: false,
    })

    // Persist the URL back to the profiles table
    const { error } = await supabase
      .from("profiles")
      .update({ avatar_url: blob.url })
      .eq("id", user.id)

    if (error) {
      return NextResponse.json({ error: "Failed to save avatar" }, { status: 500 })
    }

    return NextResponse.json({ success: true, url: blob.url })
  } catch (err) {
    console.error("[avatar] upload error:", err)
    return NextResponse.json({ error: "Upload failed" }, { status: 500 })
  }
}
