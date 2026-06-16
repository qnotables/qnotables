/**
 * Shopify URL utilities.
 *
 * NEXT_PUBLIC_SHOP_URL may be a bare domain ("qnotables-ai.myshopify.com")
 * or a full URL ("https://shop.qnotables.ai"). This module normalises it to
 * a full https:// origin so every call site gets a proper URL.
 */

function getShopOrigin(): string {
  const raw = process.env.NEXT_PUBLIC_SHOP_URL ?? ""
  if (!raw) return ""
  if (/^https?:\/\//i.test(raw)) return raw.replace(/\/$/, "")
  return `https://${raw.replace(/\/$/, "")}`
}

/** Full https:// origin of the external Shopify store. */
export const SHOP_ORIGIN = getShopOrigin()

/** True when the Shopify store URL is configured. */
export const hasShopifyStore = SHOP_ORIGIN.length > 0

/**
 * Given a product's shopify_product_url (handle, path, or full URL),
 * return the canonical full URL. Falls back to the store homepage.
 */
export function shopifyProductUrl(
  productUrl?: string | null,
  variantId?: string | null,
): string {
  const origin = SHOP_ORIGIN || "https://shop.qnotables.ai"

  if (productUrl) {
    if (/^https?:\/\//i.test(productUrl)) {
      return appendVariant(productUrl, variantId)
    }
    if (productUrl.startsWith("/")) {
      return appendVariant(`${origin}${productUrl}`, variantId)
    }
    return appendVariant(`${origin}/products/${productUrl}`, variantId)
  }

  return origin
}

function appendVariant(url: string, variantId?: string | null): string {
  if (!variantId) return url
  const u = new URL(url)
  u.searchParams.set("variant", variantId)
  return u.toString()
}

/**
 * The storefront home (or any path), with channel=online_store to
 * bypass password screens in Shopify preview mode.
 */
export function shopifyStoreUrl(path = ""): string {
  const origin = SHOP_ORIGIN || "https://shop.qnotables.ai"
  const base = path ? `${origin}/${path.replace(/^\//, "")}` : origin
  const u = new URL(base)
  u.searchParams.set("channel", "online_store")
  return u.toString()
}
