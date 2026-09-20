import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: "Sign in to moderate chat messages." }, { status: 401 })

  const { data: profile } = await supabase.from("profiles").select("role, status").eq("id", user.id).maybeSingle()
  if (!profile || profile.status !== "active" || !["moderator", "admin"].includes(profile.role)) {
    return NextResponse.json({ error: "You do not have permission to delete messages." }, { status: 403 })
  }

  const { id } = await params
  const { error } = await supabase
    .from("chat_messages")
    .update({ deleted_at: new Date().toISOString(), deleted_by: user.id })
    .eq("id", id)
    .is("deleted_at", null)

  if (error) {
    console.error("[v0] Chat message deletion failed:", error)
    return NextResponse.json({ error: "Unable to delete that message." }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
