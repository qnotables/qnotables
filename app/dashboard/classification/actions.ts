"use server"

import { revalidatePath } from "next/cache"
import { validateDashboardAccess } from "@/lib/dashboard-auth"
import { createAdminClient } from "@/lib/supabase/admin"
import { createClient } from "@/lib/supabase/server"
import { categories, type Category } from "@/lib/news-data"
import { classifyStory } from "@/lib/story-classifier"

export interface ClassificationFilters {
  from?: string
  to?: string
  publisher?: string
  category?: string
  confidence?: string
  reviewStatus?: string
}

export interface ProposedChange {
  id: string
  title: string
  publisher: string | null
  currentCategory: string
  proposedCategory: Category
  secondaryTags: Category[]
  confidence: number
  reviewStatus: string
  rationale: string
}

async function requireAccess() {
  if (!(await validateDashboardAccess())) throw new Error("Not authorized")
}

export async function previewReclassification(filters: ClassificationFilters): Promise<ProposedChange[]> {
  await requireAccess()
  const db = createAdminClient()
  let query = db.from("rss_items").select("id,title,description,link,source_name,source_url,category,source_category,source_keywords,article_text,primary_category,classification_confidence,review_status,manual_lock,published_at").eq("manual_lock", false).order("published_at", { ascending: false }).limit(250)
  if (filters.from) query = query.gte("published_at", filters.from)
  if (filters.to) query = query.lte("published_at", `${filters.to}T23:59:59.999Z`)
  if (filters.publisher) query = query.ilike("source_name", `%${filters.publisher}%`)
  if (filters.category) query = query.eq("primary_category", filters.category)
  if (filters.reviewStatus) query = query.eq("review_status", filters.reviewStatus)
  if (filters.confidence === "high") query = query.gte("classification_confidence", 85)
  if (filters.confidence === "medium") query = query.gte("classification_confidence", 65).lt("classification_confidence", 85)
  if (filters.confidence === "low") query = query.lt("classification_confidence", 65)
  const { data, error } = await query
  if (error) throw new Error(error.message)

  return (data ?? []).map((item) => {
    const result = classifyStory({
      headline: item.title,
      description: item.description,
      sourceCategory: item.source_category ?? item.category,
      articleUrl: item.link,
      keywords: item.source_keywords ?? [],
      articleText: item.article_text,
    })
    return { id: item.id, title: item.title, publisher: item.source_name, currentCategory: item.primary_category ?? item.category ?? "OTHER", proposedCategory: result.primaryCategory, secondaryTags: result.secondaryTags, confidence: result.confidence, reviewStatus: result.reviewStatus, rationale: result.rationale }
  })
}

export async function applyReclassification(changes: ProposedChange[]) {
  await requireAccess()
  const db = createAdminClient()
  for (const change of changes.slice(0, 250)) {
    if (!categories.includes(change.proposedCategory)) continue
    const { data } = await db.from("rss_items").select("manual_lock,primary_category").eq("id", change.id).single()
    if (!data || data.manual_lock) continue
    const { error } = await db.from("rss_items").update({ primary_category: change.proposedCategory, category: change.proposedCategory, secondary_tags: change.secondaryTags, classification_confidence: change.confidence, classification_method: "deterministic", classification_rationale: change.rationale, classifier_version: "2026.07.1", review_status: change.reviewStatus, updated_at: new Date().toISOString() }).eq("id", change.id).eq("manual_lock", false)
    if (error) throw new Error(error.message)
    await db.from("rss_classification_events").insert({ rss_item_id: change.id, event_type: "reclassification", previous_category: data.primary_category, proposed_category: change.proposedCategory, secondary_tags: change.secondaryTags, confidence: change.confidence, method: "deterministic", rationale: change.rationale, classifier_version: "2026.07.1", applied: true })
  }
  revalidatePath("/dashboard/classification")
  revalidatePath("/")
  return { success: true }
}

export async function setManualClassification(id: string, category: Category) {
  await requireAccess()
  if (!categories.includes(category)) throw new Error("Invalid category")
  const userClient = await createClient()
  const { data: { user } } = await userClient.auth.getUser()
  if (!user) throw new Error("Not authenticated")
  const db = createAdminClient()
  const { data: current, error: readError } = await db.from("rss_items").select("primary_category").eq("id", id).single()
  if (readError) throw new Error(readError.message)
  const { error } = await db.from("rss_items").update({ primary_category: category, category, manual_lock: true, manually_classified_by: user.id, manually_classified_at: new Date().toISOString(), review_status: "reviewed", classification_method: "manual", classification_confidence: 100, updated_at: new Date().toISOString() }).eq("id", id)
  if (error) throw new Error(error.message)
  await db.from("rss_classification_events").insert({ rss_item_id: id, event_type: "manual_correction", previous_category: current.primary_category, proposed_category: category, confidence: 100, method: "manual", classifier_version: "2026.07.1", applied: true, reviewer_id: user.id })
  revalidatePath("/dashboard/classification")
  revalidatePath("/")
  return { success: true }
}
