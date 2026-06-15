import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"

export async function POST(req: NextRequest) {
  try {
    const { key } = await req.json()
    const secretKey = process.env.DASHBOARD_SECRET_KEY

    if (!secretKey) {
      return NextResponse.json({ error: "Dashboard access not configured" }, { status: 500 })
    }

    if (!key || key !== secretKey) {
      return NextResponse.json({ error: "Invalid secret key" }, { status: 401 })
    }

    const cookieStore = await cookies()
    cookieStore.set("dashboard_key", key, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 24 * 60 * 60, // 24 hours
      path: "/",
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Dashboard auth API error:", error)
    return NextResponse.json({ error: "Authentication failed" }, { status: 500 })
  }
}

export async function DELETE() {
  const cookieStore = await cookies()
  cookieStore.delete("dashboard_key")
  return NextResponse.json({ success: true })
}
