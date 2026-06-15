import { NextRequest, NextResponse } from "next/server"
import { testPrintifyConnection } from "@/lib/shop/printify"

export async function POST(request: NextRequest) {
  try {
    const { apiKey, shopId } = await request.json()

    if (!apiKey || !shopId) {
      return NextResponse.json({ error: "Missing API key or Shop ID" }, { status: 400 })
    }

    const isConnected = await testPrintifyConnection(apiKey, shopId)

    if (isConnected) {
      return NextResponse.json({ success: true })
    } else {
      return NextResponse.json({ error: "Connection failed" }, { status: 401 })
    }
  } catch (error) {
    console.error("Printify test error:", error)
    return NextResponse.json({ error: "Test failed" }, { status: 500 })
  }
}
