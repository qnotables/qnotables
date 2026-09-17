import type { MetadataRoute } from "next"
import { getAllArchives } from "@/lib/archive"
import { getCategories, getTags, getAvailableMonths } from "@/lib/archives"
import { createAdminClient } from "@/lib/supabase/admin"
import { absoluteUrl } from "@/lib/seo"

export const revalidate = 3600

type SitemapEntry = MetadataRoute.Sitemap[number]

const VALID_SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
const INTERNAL_CATEGORIES = new Set(["site maintenance"])

function normalizeTaxonomy(values: string[]): string[] {
  const normalized = new Map<string, string>()
  for (const value of values.flatMap((item) => item.split(","))) {
    const clean = value.trim().toLowerCase().replace(/\s+/g, " ")
    if (!clean || INTERNAL_CATEGORIES.has(clean)) continue
    const slug = clean.replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")
    if (slug && !normalized.has(slug)) normalized.set(slug, clean)
  }
  return [...normalized.keys()]
}

const staticRoutes: Array<[string, SitemapEntry["changeFrequency"], number]> = [
  ["/", "hourly", 1],
  ["/notables", "hourly", 0.9],
  ["/archives", "daily", 0.9],
  ["/archives/timeline", "daily", 0.8],
  ["/archives/documents", "weekly", 0.7],
  ["/archives/videos", "daily", 0.8],
  ["/forum", "hourly", 0.8],
  ["/videos", "daily", 0.7],
  ["/about", "monthly", 0.5],
  ["/new-to-q", "monthly", 0.5],
  ["/team", "monthly", 0.4],
  ["/donate", "monthly", 0.3],
]

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date()
  const entries: SitemapEntry[] = staticRoutes.map(([path, changeFrequency, priority]) => ({
    url: absoluteUrl(path),
    lastModified: now,
    changeFrequency,
    priority,
  }))

  const [posts, categories, tags, months, threads] = await Promise.all([
    getAllArchives().catch(() => []),
    getCategories().catch(() => []),
    getTags().catch(() => []),
    getAvailableMonths().catch(() => []),
    (async () => {
      try {
        const admin = createAdminClient()
        const { data } = await admin
          .from("forum_threads")
          .select("id, slug, created_at, updated_at")
          .eq("status", "published")
          .eq("is_pending", false)
          .eq("is_soft_deleted", false)
        return data ?? []
      } catch {
        return []
      }
    })(),
  ])

  for (const post of posts) {
    const slug = typeof post.slug === "string" ? post.slug.trim().toLowerCase() : ""
    if (!VALID_SLUG.test(slug) || slug.length < 3 || new Set(["p", "w", "f"]).has(slug)) continue
    entries.push({
      url: absoluteUrl(`/archives/${encodeURIComponent(slug)}`),
      lastModified: new Date(post.updated_at || post.published_at || post.created_at),
      changeFrequency: "weekly",
      priority: 0.7,
    })
  }
  for (const thread of threads) {
    const slug = typeof thread.slug === "string" ? thread.slug.trim().toLowerCase() : ""
    if (!slug || slug.startsWith("testing-") || !VALID_SLUG.test(slug)) continue
    entries.push({
      url: absoluteUrl(`/forum/${encodeURIComponent(slug)}`),
      lastModified: new Date(thread.updated_at || thread.created_at),
      changeFrequency: "daily",
      priority: 0.6,
    })
  }
  for (const category of normalizeTaxonomy(categories)) {
    entries.push({ url: absoluteUrl(`/archives/category/${encodeURIComponent(category)}`), changeFrequency: "weekly", priority: 0.5 })
  }
  for (const tag of normalizeTaxonomy(tags)) {
    entries.push({ url: absoluteUrl(`/archives/tag/${encodeURIComponent(tag)}`), changeFrequency: "weekly", priority: 0.4 })
  }
  for (const { year, month } of months) {
    entries.push({ url: absoluteUrl(`/archives/year-month/${year}/${month}`), changeFrequency: "monthly", priority: 0.4 })
  }

  return Array.from(new Map(entries.map((entry) => [entry.url, entry])).values())
}
