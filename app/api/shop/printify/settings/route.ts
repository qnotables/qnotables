import { NextRequest, NextResponse } from "next/server"
import { updatePrintifySettings, getPrintifySettings } from "@/lib/shop/printify"

export async function GET(request: NextRequest) {
  try {
    const settings = await getPrintifySettings()

    if (!settings) {
      return NextResponse.json({
        printify_api_key: process.env.PRINTIFY_API_KEY || "",
        printify_shop_id: process.env.PRINTIFY_SHOP_ID || "",
        auto_sync_enabled: false,
        sync_interval_hours: 24,
      })
    }

    return NextResponse.json(settings)
  } catch (error) {
    console.error("Settings fetch error:", error)
    return NextResponse.json({ error: "Failed to fetch settings" }, { status: 500 })
  }
}

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
