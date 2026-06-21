"use server"

import { createClient } from "@supabase/supabase-js"
import { revalidatePath } from "next/cache"
import { validateDashboardAccess } from "@/lib/dashboard-auth"
import type { ScrapeLog } from "@/lib/scraper/types"
import { SCRAPER_SOURCES } from "@/lib/scraper/sources"

function getSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error("Supabase not configured")
  return createClient(url, key)
}

async function requireDashboard() {
  const ok = await validateDashboardAccess()
  if (!ok) throw new Error("Unauthorized")
}

// ── Trigger a manual scrape run ───────────────────────────────────────────────
export async function triggerManualScrape(): Promise<{ success: boolean; message: string }> {
  await requireDashboard()

  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret) {
    return { success: false, message: "CRON_SECRET environment variable is not set." }
  }

  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000")

  const res = await fetch(`${baseUrl}/api/scrape`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${cronSecret}`,
    },
  })

  if (!res.ok) {
    const body = await res.text()
    return { success: false, message: `Scrape failed (HTTP ${res.status}): ${body}` }
  }

  const data = await res.json()
  revalidatePath("/dashboard/scraper")

  return {
    success: true,
    message: `Scrape complete. ${data.newPosts} new post(s) created from ${data.totalSources} source(s).`,
  }
}

// ── Fetch scrape logs ─────────────────────────────────────────────────────────
export async function getScrapeLogs(limit = 20): Promise<ScrapeLog[]> {
  await requireDashboard()
  const supabase = getSupabaseClient()

  const { data, error } = await supabase
    .from("scrape_logs")
    .select("*")
    .order("started_at", { ascending: false })
    .limit(limit)

  if (error) throw new Error(`Failed to fetch scrape logs: ${error.message}`)
  return (data || []) as ScrapeLog[]
}

// ── Fetch scraped draft posts ─────────────────────────────────────────────────
export async function getScrapedDrafts() {
  await requireDashboard()
  const supabase = getSupabaseClient()

  const { data, error } = await supabase
    .from("blog_posts")
    .select("id, title, slug, excerpt, source_name, source_url, cover_image, imported_at, created_at, status, post_type")
    .eq("status", "draft")
    .not("imported_at", "is", null)
    .order("imported_at", { ascending: false })

  if (error) throw new Error(`Failed to fetch scraped drafts: ${error.message}`)
  return data || []
}

// ── Publish a scraped draft ───────────────────────────────────────────────────
export async function publishScrapedDraft(id: string): Promise<void> {
  await requireDashboard()
  const supabase = getSupabaseClient()
  const now = new Date().toISOString()

  const { error } = await supabase
    .from("blog_posts")
    .update({ status: "published", published_at: now, updated_at: now })
    .eq("id", id)

  if (error) throw new Error(`Failed to publish: ${error.message}`)
  revalidatePath("/dashboard/scraper")
  revalidatePath("/archives")
}

// ── Delete a scraped draft ────────────────────────────────────────────────────
export async function deleteScrapedDraft(id: string): Promise<void> {
  await requireDashboard()
  const supabase = getSupabaseClient()

  const { error } = await supabase.from("blog_posts").delete().eq("id", id)
  if (error) throw new Error(`Failed to delete: ${error.message}`)
  revalidatePath("/dashboard/scraper")
}

// ── Get configured sources (for display) ─────────────────────────────────────
export async function getScraperSources() {
  await requireDashboard()
  return SCRAPER_SOURCES
}
