"use server"

import { createClient } from "@supabase/supabase-js"
import { type Product, generateSlug } from "@/lib/shop/products"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

const DASHBOARD_SECRET_KEY = process.env.DASHBOARD_SECRET_KEY!

async function verifyAuth(secretKey: string) {
  if (secretKey !== DASHBOARD_SECRET_KEY) {
    throw new Error("Unauthorized: Invalid secret key")
  }
}

export async function createProduct(formData: FormData) {
  const secretKey = formData.get("secret_key") as string
  await verifyAuth(secretKey)

  const name = formData.get("name") as string
  const slug = (formData.get("slug") as string) || generateSlug(name)
  const category = formData.get("category") as string
  const short_description = formData.get("short_description") as string
  const description = formData.get("description") as string
  const price = formData.get("price") ? parseInt(formData.get("price") as string) * 100 : undefined
  const compare_at_price = formData.get("compare_at_price")
    ? parseInt(formData.get("compare_at_price") as string) * 100
    : undefined
  const cost = formData.get("cost") ? parseInt(formData.get("cost") as string) * 100 : undefined
  const sku = formData.get("sku") as string
  const status = (formData.get("status") as string) || "draft"
  const featured = formData.get("featured") === "true"
  const image_url = formData.get("image_url") as string
  const tags = formData.get("tags") ? (formData.get("tags") as string).split(",").map((t) => t.trim()) : []
  const seo_title = formData.get("seo_title") as string
  const seo_description = formData.get("seo_description") as string

  const { data, error } = await supabase
    .from("products")
    .insert([
      {
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
      },
    ])
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to create product: ${error.message}`)
  }

  return { success: true, product: data }
}

export async function updateProduct(productId: string, formData: FormData) {
  const secretKey = formData.get("secret_key") as string
  await verifyAuth(secretKey)

  const name = formData.get("name") as string
  const slug = formData.get("slug") as string
  const category = formData.get("category") as string
  const short_description = formData.get("short_description") as string
  const description = formData.get("description") as string
  const price = formData.get("price") ? parseInt(formData.get("price") as string) * 100 : undefined
  const compare_at_price = formData.get("compare_at_price")
    ? parseInt(formData.get("compare_at_price") as string) * 100
    : undefined
  const cost = formData.get("cost") ? parseInt(formData.get("cost") as string) * 100 : undefined
  const sku = formData.get("sku") as string
  const status = formData.get("status") as string
  const featured = formData.get("featured") === "true"
  const image_url = formData.get("image_url") as string
  const tags = formData.get("tags") ? (formData.get("tags") as string).split(",").map((t) => t.trim()) : []
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
    .eq("id", productId)
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to update product: ${error.message}`)
  }

  return { success: true, product: data }
}

export async function deleteProduct(productId: string, secretKey: string) {
  await verifyAuth(secretKey)

  const { error } = await supabase.from("products").delete().eq("id", productId)

  if (error) {
    throw new Error(`Failed to delete product: ${error.message}`)
  }

  return { success: true }
}

export async function toggleFeatured(productId: string, featured: boolean, secretKey: string) {
  await verifyAuth(secretKey)

  const { data, error } = await supabase
    .from("products")
    .update({ featured, updated_at: new Date().toISOString() })
    .eq("id", productId)
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to update product: ${error.message}`)
  }

  return { success: true, product: data }
}

export async function updateProductStatus(productId: string, status: string, secretKey: string) {
  await verifyAuth(secretKey)

  const { data, error } = await supabase
    .from("products")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", productId)
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to update product status: ${error.message}`)
  }

  return { success: true, product: data }
}
