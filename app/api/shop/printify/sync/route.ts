import { NextRequest, NextResponse } from "next/server"
import { syncProductsWithPrintify } from "@/lib/shop/printify"

export async function POST(request: NextRequest) {
  try {
    const { apiKey, shopId } = await request.json()

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
