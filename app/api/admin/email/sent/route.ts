import { NextResponse } from "next/server"
import { getAdminUser } from "@/lib/admin"
import { createAdminClient } from "@/lib/supabase/admin"

export const runtime = "nodejs"

export async function GET() {
  if (!(await getAdminUser())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { data, error } = await createAdminClient()
    .from("activity_log")
    .select("id, actor_label, action, target_id, details, created_at")
    .in("action", ["email.send", "email.send.failed"])
    .order("created_at", { ascending: false })
    .limit(100)
  if (error) {
    console.error("[v0] sent email log query failed", error)
    return NextResponse.json({ error: "Unable to load sent email history" }, { status: 500 })
  }
  return NextResponse.json({ emails: data ?? [] })
}
