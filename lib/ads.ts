import { createClient } from "@/lib/supabase/server"

export interface Ad {
  id: string
  title: string
  description: string
  image_url: string | null
  button_text: string
  button_link: string
  placement: "top" | "sidebar" | "in-feed" | "bottom"
  type: "internal" | "sponsor" | "partner"
  is_active: boolean
  priority: number
}

export async function getAdsByPlacement(placement: "top" | "sidebar" | "in-feed" | "bottom") {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("ads")
    .select("*")
    .eq("placement", placement)
    .eq("is_active", true)
    .order("priority", { ascending: false })

  if (error) {
    console.error(`Error fetching ads for ${placement}:`, error)
    return []
  }

  return data as Ad[]
}

export async function getAllAds() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("ads")
    .select("*")
    .order("placement", { ascending: true })
    .order("priority", { ascending: false })

  if (error) {
    console.error("Error fetching all ads:", error)
    return []
  }

  return data as Ad[]
}

export async function createAd(
  ad: Omit<Ad, "id" | "is_active" | "created_at" | "updated_at">
): Promise<Ad | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("ads")
    .insert({
      ...ad,
      is_active: true,
    })
    .select()
    .single()

  if (error) {
    console.error("Error creating ad:", error)
    return null
  }

  return data as Ad
}

export async function updateAd(id: string, updates: Partial<Ad>): Promise<Ad | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("ads")
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single()

  if (error) {
    console.error("Error updating ad:", error)
    return null
  }

  return data as Ad
}

export async function deleteAd(id: string): Promise<boolean> {
  const supabase = await createClient()

  const { error } = await supabase.from("ads").delete().eq("id", id)

  if (error) {
    console.error("Error deleting ad:", error)
    return false
  }

  return true
}
