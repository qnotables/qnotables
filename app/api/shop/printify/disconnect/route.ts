import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

export async function POST(request: NextRequest) {
  try {
    // Disconnect all products from Printify
    const { error } = await supabase
      .from("products")
      .update({
        printify_product_id: null,
        printify_blueprint_id: null,
        printify_print_provider_id: null,
      })
      .not("printify_product_id", "is", null)

    if (error) throw error

    // Clear settings
    await supabase
      .from("shop_settings")
      .update({
        printify_api_key: null,
        printify_shop_id: null,
        auto_sync_enabled: false,
      })
      .gte("created_at", "1900-01-01")

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Disconnect error:", error)
    return NextResponse.json({ error: "Failed to disconnect" }, { status: 500 })
  }
}
