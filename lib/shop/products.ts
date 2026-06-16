import { createClient } from "@supabase/supabase-js"

function getSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !key) {
    throw new Error("Supabase credentials not configured")
  }

  return createClient(url, key)
}

export interface Product {
  id: string
  name: string
  slug: string
  product_type: "manual" | "printify" | "digital" | "membership"
  category?: string
  short_description?: string
  description?: string
  price?: number
  compare_at_price?: number
  cost?: number
  sku?: string
  status: "draft" | "active" | "hidden" | "sold_out" | "archived"
  featured: boolean
  image_url?: string
  gallery_images?: string[]
  tags?: string[]
  options?: any
  fulfillment_method?: string
  printify_product_id?: string
  printify_blueprint_id?: string
  printify_print_provider_id?: string
  printify_shop_id?: string
  stripe_product_id?: string
  stripe_price_id?: string
  seo_title?: string
  seo_description?: string
  og_image_url?: string
  last_printify_sync_at?: string
  // Shopify integration
  shopify_product_id?: string
  shopify_variant_id?: string
  shopify_product_url?: string
  external_checkout_url?: string
  purchase_button_label?: string
  created_at: string
  updated_at: string
}

export interface ProductVariant {
  id: string
  product_id: string
  name: string
  sku?: string
  price?: number
  compare_at_price?: number
  cost?: number
  image_url?: string
  option_values?: any
  stock_status?: string
  printify_variant_id?: string
  created_at: string
  updated_at: string
}

export interface Order {
  id: string
  order_number: string
  customer_email: string
  customer_name?: string
  status: "pending" | "paid" | "in_production" | "fulfilled" | "cancelled" | "refunded" | "failed"
  total_cents?: number
  fulfillment_method?: string
  printify_order_id?: string
  printify_status?: string
  stripe_payment_intent_id?: string
  created_at: string
  updated_at: string
}

export async function getAllProducts(): Promise<Product[]> {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .order("created_at", { ascending: false })

  if (error) throw new Error(`Failed to fetch products: ${error.message}`)
  return data || []
}

export async function getProductsByStatus(status: string): Promise<Product[]> {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("status", status)
    .order("created_at", { ascending: false })

  if (error) throw new Error(`Failed to fetch products: ${error.message}`)
  return data || []
}

export async function getFeaturedProducts(): Promise<Product[]> {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("featured", true)
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(5)

  if (error) throw new Error(`Failed to fetch featured products: ${error.message}`)
  return data || []
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("slug", slug)
    .single()

  if (error && error.code !== "PGRST116") throw error
  return data || null
}

export async function getProductVariants(productId: string): Promise<ProductVariant[]> {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase
    .from("product_variants")
    .select("*")
    .eq("product_id", productId)
    .order("created_at", { ascending: true })

  if (error) throw new Error(`Failed to fetch variants: ${error.message}`)
  return data || []
}

export async function getOrders(): Promise<Order[]> {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase
    .from("orders")
    .select("*")
    .order("created_at", { ascending: false })

  if (error) throw new Error(`Failed to fetch orders: ${error.message}`)
  return data || []
}

export async function getOrdersByStatus(status: string): Promise<Order[]> {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase
    .from("orders")
    .select("*")
    .eq("status", status)
    .order("created_at", { ascending: false })

  if (error) throw new Error(`Failed to fetch orders: ${error.message}`)
  return data || []
}

export async function getShopStats() {
  try {
    const supabase = getSupabaseClient()
    const [allProducts, activeProducts, featuredProducts, allOrders, paidOrders] = await Promise.all([
      supabase.from("products").select("id", { count: "exact" }).then((r) => r.count || 0),
      supabase.from("products").select("id", { count: "exact" }).eq("status", "active").then((r) => r.count || 0),
      supabase.from("products").select("id", { count: "exact" }).eq("featured", true).then((r) => r.count || 0),
      supabase.from("orders").select("id", { count: "exact" }).then((r) => r.count || 0),
      supabase.from("orders").select("total_cents").eq("status", "paid"),
    ])

    const totalRevenue = paidOrders.data?.reduce((sum: number, order: any) => sum + (order.total_cents || 0), 0) || 0

    return {
      total_products: allProducts,
      active_products: activeProducts,
      featured_products: featuredProducts,
      total_orders: allOrders,
      total_revenue: totalRevenue,
    }
  } catch (error) {
    console.error("Error fetching shop stats:", error)
    return {
      total_products: 0,
      active_products: 0,
      featured_products: 0,
      total_orders: 0,
      total_revenue: 0,
    }
  }
}

export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .substring(0, 100)
}

export function formatPrice(cents: number | undefined): string {
  if (!cents) return "$0.00"
  return `$${(cents / 100).toFixed(2)}`
}
