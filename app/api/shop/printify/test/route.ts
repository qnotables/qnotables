import { NextRequest, NextResponse } from "next/server"
import { testPrintifyConnection } from "@/lib/shop/printify"

export async function POST(request: NextRequest) {
  try {
    let apiKey = ""
    let shopId = ""

    try {
      const body = await request.json()
      apiKey = body.apiKey || ""
      shopId = body.shopId || ""
    } catch {
      // Body is optional, will use env vars
    }

    // Use environment variables as fallback
    apiKey = apiKey || process.env.PRINTIFY_API_KEY || ""
    shopId = shopId || process.env.PRINTIFY_SHOP_ID || ""

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
