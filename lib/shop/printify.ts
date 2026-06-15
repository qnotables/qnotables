import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

export interface PrintifySettings {
  printify_api_key?: string
  printify_shop_id?: string
  auto_sync_enabled: boolean
  sync_interval_hours: number
  created_at: string
  updated_at: string
}

export interface PrintifyProduct {
  id: string
  title: string
  description: string
  images: Array<{ src: string; variant_ids: number[] }>
  variants: Array<{
    id: number
    title: string
    sku: string
    price: number
    cost: number
    print_details: Array<{
      placement: string
      print_provider_id: number
    }>
  }>
}

export interface PrintifySyncLog {
  id: string
  action: string
  status: "pending" | "success" | "failed"
  message?: string
  details?: any
  created_at: string
}

/**
 * Fetch Printify settings for the shop
 */
export async function getPrintifySettings(): Promise<PrintifySettings | null> {
  const { data, error } = await supabase
    .from("shop_settings")
    .select("*")
    .single()

  if (error) {
    if (error.code === "PGRST116") return null
    throw new Error(`Failed to fetch Printify settings: ${error.message}`)
  }

  return data
}

/**
 * Update Printify settings
 */
export async function updatePrintifySettings(settings: Partial<PrintifySettings>) {
  const { data, error } = await supabase
    .from("shop_settings")
    .update({
      ...settings,
      updated_at: new Date().toISOString(),
    })
    .eq("id", settings.printify_shop_id || "default")
    .select()
    .single()

  if (error) throw new Error(`Failed to update settings: ${error.message}`)
  return data
}

/**
 * Log a Printify sync event
 */
export async function logPrintifySync(
  action: string,
  status: "pending" | "success" | "failed",
  message?: string,
  details?: any,
) {
  const { data, error } = await supabase
    .from("printify_sync_log")
    .insert([
      {
        action,
        status,
        message,
        details,
      },
    ])
    .select()
    .single()

  if (error) console.error("Failed to log sync:", error)
  return data
}

/**
 * Get recent Printify sync logs
 */
export async function getPrintifySyncLogs(limit = 20): Promise<PrintifySyncLog[]> {
  const { data, error } = await supabase
    .from("printify_sync_log")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit)

  if (error) throw new Error(`Failed to fetch sync logs: ${error.message}`)
  return data || []
}

/**
 * Check if Printify is configured
 */
export async function isPrintifyConfigured(): Promise<boolean> {
  const settings = await getPrintifySettings()
  return !!(settings?.printify_api_key && settings?.printify_shop_id)
}

/**
 * Simulate Printify API call - prepare for real integration
 * This is a placeholder that will be replaced with actual Printify API calls
 */
export async function syncProductsWithPrintify(printifyApiKey: string, shopId: string) {
  try {
    await logPrintifySync("sync_start", "pending", "Starting product sync with Printify")

    // Placeholder: In production, this would:
    // 1. Fetch products from Printify API
    // 2. Compare with local products
    // 3. Create/update mappings in products table
    // 4. Update printify_product_id, printify_blueprint_id, etc.

    const mockResponse = {
      products_synced: 0,
      products_created: 0,
      products_updated: 0,
    }

    await logPrintifySync("sync_complete", "success", "Product sync completed", mockResponse)
    return mockResponse
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : "Unknown error"
    await logPrintifySync("sync_failed", "failed", errorMsg)
    throw error
  }
}

/**
 * Test Printify API connection
 */
export async function testPrintifyConnection(apiKey: string, shopId: string): Promise<boolean> {
  try {
    await logPrintifySync("test_connection", "pending", "Testing Printify API connection")

    // Placeholder: In production, this would make an actual API call to verify credentials
    const response = await fetch(`https://api.printify.com/v1/shops/${shopId}/`, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
    })

    if (response.ok) {
      await logPrintifySync("test_connection", "success", "Printify API connection successful")
      return true
    } else {
      throw new Error(`API returned ${response.status}`)
    }
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : "Unknown error"
    await logPrintifySync("test_connection", "failed", `Connection test failed: ${errorMsg}`)
    return false
  }
}

/**
 * Get products that are connected to Printify
 */
export async function getPrintifyConnectedProducts() {
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .not("printify_product_id", "is", null)
    .order("updated_at", { ascending: false })

  if (error) throw new Error(`Failed to fetch Printify products: ${error.message}`)
  return data || []
}

/**
 * Disconnect a product from Printify
 */
export async function disconnectProductFromPrintify(productId: string) {
  const { data, error } = await supabase
    .from("products")
    .update({
      printify_product_id: null,
      printify_blueprint_id: null,
      printify_print_provider_id: null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", productId)
    .select()
    .single()

  if (error) throw new Error(`Failed to disconnect product: ${error.message}`)

  await logPrintifySync(
    "product_disconnected",
    "success",
    `Product ${productId} disconnected from Printify`,
  )

  return data
}
