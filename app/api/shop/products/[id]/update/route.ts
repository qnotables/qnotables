import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

function getSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !key) {
    throw new Error("Supabase credentials not configured")
  }

  return createClient(url, key)
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id
    const supabase = getSupabaseClient()
    const formData = await request.formData()

    const name = formData.get("name") as string
    const slug = formData.get("slug") as string
    const category = formData.get("category") as string
    const short_description = formData.get("short_description") as string
    const description = formData.get("description") as string
    const price = formData.get("price") ? Math.round(parseFloat(formData.get("price") as string) * 100) : null
    const compare_at_price = formData.get("compare_at_price")
      ? Math.round(parseFloat(formData.get("compare_at_price") as string) * 100)
      : null
    const cost = formData.get("cost") ? Math.round(parseFloat(formData.get("cost") as string) * 100) : null
    const sku = formData.get("sku") as string
    const status = formData.get("status") as string
    const featured = formData.get("featured") === "true"
    const image_url = formData.get("image_url") as string
    const tags = formData.get("tags") ? (formData.get("tags") as string).split(",").map((t) => t.trim()).filter(t => t) : []
    const seo_title = formData.get("seo_title") as string
    const seo_description = formData.get("seo_description") as string

    const { data, error } = await supabase
      .from("products")
      .update({
        name,
        slug,
        category,
        short_description,
        description,
        price,
        compare_at_price,
        cost,
        sku,
        status,
        featured,
        image_url,
        tags,
        seo_title,
        seo_description,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ success: true, product: data })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update product" },
      { status: 500 }
    )
  }
}
