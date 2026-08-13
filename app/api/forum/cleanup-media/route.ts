import { del } from "@vercel/blob"
import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  const authorization = request.headers.get("authorization")
  if (!process.env.CRON_SECRET || authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const supabase = createAdminClient()
  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
  const { data: attachments, error } = await supabase
    .from("forum_attachments")
    .select("id, url")
    .eq("status", "orphaned")
    .lt("created_at", cutoff)
    .limit(100)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!attachments?.length) return NextResponse.json({ deleted: 0 })

  const deletedIds: string[] = []
  for (const attachment of attachments) {
    try {
      await del(attachment.url)
      deletedIds.push(attachment.id)
    } catch {
      // Keep the row so a later cron run can retry safely.
    }
  }

  if (deletedIds.length) {
    const { error: deleteError } = await supabase
      .from("forum_attachments")
      .delete()
      .in("id", deletedIds)
    if (deleteError) return NextResponse.json({ error: deleteError.message }, { status: 500 })
  }

  return NextResponse.json({ deleted: deletedIds.length })
}
