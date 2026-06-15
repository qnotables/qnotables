import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"

export async function POST(req: NextRequest) {
  try {
    const { key } = await req.json()
    console.log("[v0] Dashboard auth attempt with key:", key ? "***" : "empty")

    const secretKey = process.env.DASHBOARD_SECRET_KEY
    console.log("[v0] DASHBOARD_SECRET_KEY configured:", !!secretKey)
    
    if (!secretKey) {
      console.error("[v0] DASHBOARD_SECRET_KEY not set in environment")
      return NextResponse.json(
        { error: "Dashboard access not configured" },
        { status: 500 }
      )
    }

    if (!key || key !== secretKey) {
      console.log("[v0] Key mismatch - provided:", key ? "***" : "empty", "expected:", secretKey ? "***" : "empty")
      return NextResponse.json(
        { error: "Invalid secret key" },
        { status: 401 }
      )
    }

    console.log("[v0] Key validated successfully, setting cookie")

    // Set cookie to remember authentication
    const cookieStore = await cookies()
    cookieStore.set("dashboard_key", key, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 24 * 60 * 60, // 24 hours
      path: "/"
    })

    console.log("[v0] Cookie set successfully")
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Dashboard auth error:", error)
    return NextResponse.json(
      { error: "Authentication failed" },
      { status: 500 }
    )
  }
}
