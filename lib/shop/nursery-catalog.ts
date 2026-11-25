export const nurseryStoreUrl = "https://roostersridgenursery.myshopify.com/collections/all"

export type NurseryProduct = {
  id: string
  title: string
  onlineStoreUrl: string | null
  availableForSale: boolean
  featuredImage: { url: string; altText: string | null } | null
  priceRange: { minVariantPrice: { amount: string; currencyCode: string } }
}

const catalogQuery = `
  query NurseryCatalog {
    products(first: 24, sortKey: BEST_SELLING) {
      nodes {
        id
        title
        onlineStoreUrl
        availableForSale
        featuredImage { url altText }
        priceRange { minVariantPrice { amount currencyCode } }
      }
    }
  }
`

export async function getNurseryCatalog(): Promise<NurseryProduct[] | null> {
  try {
    const response = await fetch("https://0gs1sv-jv.myshopify.com/api/2026-10/graphql.json", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query: catalogQuery }),
      next: { revalidate: 300 },
      signal: AbortSignal.timeout(8000),
    })

    if (!response.ok) return null

    const result: { data?: { products?: { nodes: NurseryProduct[] } }; errors?: unknown[] } = await response.json()
    return result.errors?.length ? null : result.data?.products?.nodes ?? null
  } catch {
    return null
  }
}
