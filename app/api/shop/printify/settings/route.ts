import { NextRequest, NextResponse } from "next/server"
import { updatePrintifySettings } from "@/lib/shop/printify"

export async function POST(request: NextRequest) {
  try {
    const settings = await request.json()

    if (!settings.printify_api_key || !settings.printify_shop_id) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const updated = await updatePrintifySettings(settings)

    return NextResponse.json(updated)
  } catch (error) {
    console.error("Settings update error:", error)
    return NextResponse.json({ error: "Failed to update settings" }, { status: 500 })
  }
}
