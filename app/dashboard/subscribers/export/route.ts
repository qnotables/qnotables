import { validateDashboardAccess } from "@/lib/dashboard-auth"
import { createAdminClient } from "@/lib/supabase/admin"

export const dynamic = "force-dynamic"

function csvCell(value: string) {
  return `"${value.replaceAll('"', '""')}"`
}

export async function GET() {
  const hasAccess = await validateDashboardAccess()
  if (!hasAccess) {
    return new Response("Unauthorized", {
      status: 401,
      headers: { "Cache-Control": "no-store" },
    })
  }

  try {
    const admin = createAdminClient()
    const { data, error } = await admin
      .from("newsletter_subscribers")
      .select("email, source, created_at")
      .order("created_at", { ascending: false })

    if (error) throw error

    const rows = [
      ["Email", "Source", "Subscribed At"],
      ...(data ?? []).map((subscriber) => [
        subscriber.email,
        subscriber.source,
        subscriber.created_at,
      ]),
    ]
    const csv = `\uFEFF${rows.map((row) => row.map(csvCell).join(",")).join("\r\n")}\r\n`
    const date = new Date().toISOString().slice(0, 10)

    return new Response(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="qnotables-newsletter-subscribers-${date}.csv"`,
        "Cache-Control": "private, no-store, max-age=0",
        "X-Content-Type-Options": "nosniff",
      },
    })
  } catch (error) {
    console.error("[v0] Failed to export newsletter subscribers:", error)
    return new Response("Unable to generate subscriber export.", {
      status: 500,
      headers: { "Cache-Control": "no-store" },
    })
  }
}
