import { NextRequest, NextResponse } from "next/server"
import { syncProductsWithPrintify } from "@/lib/shop/printify"

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
      return NextResponse.json({ error: "Missing credentials" }, { status: 400 })
    }

    const result = await syncProductsWithPrintify(apiKey, shopId)

    return NextResponse.json(result)
  } catch (error) {
    console.error("Printify sync error:", error)
    return NextResponse.json({ error: "Sync failed" }, { status: 500 })
  }
}
