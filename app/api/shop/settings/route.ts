import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export async function POST(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ error: "Supabase not configured" }, { status: 500 })
    }

    const supabase = createClient(supabaseUrl, supabaseKey)
    const settings = await request.json()

    // Try to update existing settings, or create new ones
    const { data, error } = await supabase
      .from("shop_settings")
      .upsert(
        [
          {
            ...settings,
            updated_at: new Date().toISOString(),
          },
        ],
        { onConflict: "id" },
      )
      .select()
      .single()

    if (error) throw error

    return NextResponse.json(data)
  } catch (error) {
    console.error("Settings error:", error)
    return NextResponse.json({ error: "Failed to save settings" }, { status: 500 })
  }
}
