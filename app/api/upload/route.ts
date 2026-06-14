import { put } from "@vercel/blob"
import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  // Only signed-in users may upload
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const formData = await request.formData()
    const file = formData.get("file") as File | null
    if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 })

    // Restrict to images only
    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ error: "Only image files are allowed" }, { status: 400 })
    }

    // 5 MB cap
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: "File must be under 5 MB" }, { status: 400 })
    }

    const ext = file.name.split(".").pop() ?? "bin"
    const filename = `forum/${user.id}/${Date.now()}.${ext}`

    const blob = await put(filename, file, { access: "public" })

    return NextResponse.json({ url: blob.url })
  } catch (err) {
    console.error("[v0] upload error", err)
    return NextResponse.json({ error: "Upload failed" }, { status: 500 })
  }
}
