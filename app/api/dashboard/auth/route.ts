import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"

export async function POST(req: NextRequest) {
  try {
    const { key } = await req.json()
    console.log("[v0] ===== Dashboard Auth API =====")
    console.log("[v0] Received key:", key ? key.substring(0, 3) + "..." : "empty")

    const secretKey = process.env.DASHBOARD_SECRET_KEY
    console.log("[v0] Secret Key configured:", !!secretKey)
    console.log("[v0] Secret Key value:", secretKey ? secretKey.substring(0, 3) + "..." : "NOT SET")
    
    if (!secretKey) {
      console.error("[v0] CRITICAL: DASHBOARD_SECRET_KEY not set in environment")
      return NextResponse.json(
        { error: "Dashboard access not configured" },
        { status: 500 }
      )
    }

    if (!key || key !== secretKey) {
      console.warn("[v0] Key validation failed")
      console.warn("[v0] Provided key matches secret:", key === secretKey)
      return NextResponse.json(
        { error: "Invalid secret key" },
        { status: 401 }
      )
    }

    console.log("[v0] Key validated successfully, setting cookie...")

    // Set cookie to remember authentication
    const cookieStore = await cookies()
    cookieStore.set("dashboard_key", key, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 24 * 60 * 60, // 24 hours
      path: "/",
    })

    console.log("[v0] Cookie set. Verifying...")
    const checkCookie = cookieStore.get("dashboard_key")
    console.log("[v0] Cookie verification:", !!checkCookie?.value)
    console.log("[v0] ===== End Auth API =====")

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Dashboard auth API error:", error)
    return NextResponse.json(
      { error: "Authentication failed" },
      { status: 500 }
    )
  }
}
