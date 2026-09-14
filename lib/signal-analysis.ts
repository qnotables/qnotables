import { getNews } from "@/lib/rss"
import { normalizeHttpUrl, normalizeSignal, type Signal } from "@/lib/signals"
import { createAdminClient } from "@/lib/supabase/admin"

export type SignalAnalysisStatus = "pending" | "approved" | "dismissed" | "archived"

export type SignalAnalysis = {
  score: number
  rationale: string
  matchedTerms: string[]
  recency: number
  sourceWeight: number
  categoryWeight: number
}

export type SignalAnalysisItem = {
  id: string
  signalKey: string
  sourceKind: string
  sourceId: string | null
  title: string
  excerpt: string
  source: string
  category: string
  url: string
  imageUrl: string | null
  publishedAt: string | null
  score: number
  status: SignalAnalysisStatus
  analysis: SignalAnalysis
  firstSeenAt: string
  lastSeenAt: string
  reviewedAt: string | null
  createdAt: string
}

export type SignalAnalysisSettings = {
  enabled: boolean
  previewEnabled: boolean
  minScore: number
  maxItems: number
}

export type SignalAnalysisRunResult = {
  success: boolean
  status: "completed" | "partial" | "disabled" | "failed"
  runId?: string
  scannedCount: number
  createdCount: number
  updatedCount: number
  approvedCount: number
  errorCount: number
  errors: string[]
}

type Candidate = {
  signal: Signal
  publishedAt: string | null
}

const DEFAULT_SETTINGS: SignalAnalysisSettings = {
  enabled: false,
  previewEnabled: false,
  minScore: 55,
  maxItems: 24,
}

const HIGH_SIGNAL_TERMS = [
  "breaking",
  "exclusive",
  "investigation",
  "investigates",
  "sanctions",
  "indictment",
  "indicted",
  "military",
  "missile",
  "election",
  "executive order",
  "emergency",
  "lawsuit",
  "audit",
  "surveillance",
  "classified",
  "intelligence",
]

const HIGH_SIGNAL_CATEGORIES = new Set([
  "POLITICS",
  "WORLD",
  "DEFENSE",
  "LAW",
  "ECONOMY",
  "NATIONAL SECURITY",
  "GOVERNMENT",
])

const INTERNAL_URL = "https://qnotables.ai/notables"

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, Math.round(value)))
}

function cleanText(value: unknown, fallback: string, maxLength: number): string {
  const text = typeof value === "string" ? value : ""
  const cleaned = text.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim().slice(0, maxLength)
  return cleaned || fallback
}

function safeDate(value: string | null | undefined): string | null {
  if (!value || !Number.isFinite(Date.parse(value))) return null
  return new Date(value).toISOString()
}

function safeImage(value: string | null | undefined): string | null {
  if (!value) return null
  if (value.startsWith("/")) return value
  return normalizeHttpUrl(value) ?? null
}

function candidateToSignalKey(candidate: Candidate): string {
  return candidate.signal.signalKey
}

function buildAnalysis(signal: Signal, publishedAt: string | null): SignalAnalysis {
  const text = `${signal.title} ${signal.excerpt}`.toLowerCase()
  const matchedTerms = HIGH_SIGNAL_TERMS.filter((term) => text.includes(term))
  const categoryWeight = HIGH_SIGNAL_CATEGORIES.has(signal.category.toUpperCase()) ? 14 : 0
  const sourceWeight = signal.sourceKind === "notable" ? 8 : 5
  const ageHours = publishedAt ? Math.max(0, (Date.now() - Date.parse(publishedAt)) / 3_600_000) : 72
  const recency = ageHours <= 6 ? 18 : ageHours <= 24 ? 12 : ageHours <= 72 ? 6 : 0
  const score = clamp(30 + categoryWeight + sourceWeight + recency + matchedTerms.length * 8, 0, 100)
  const rationale = matchedTerms.length > 0
    ? `${matchedTerms.slice(0, 3).join(", ")} language and ${signal.category.toLowerCase()} desk relevance raised this item for review.`
    : `${signal.category.toLowerCase()} desk item with ${recency > 0 ? "recent publication timing" : "source coverage"} supporting review.`

  return { score, rationale, matchedTerms, recency, sourceWeight, categoryWeight }
}

async function collectCandidates(): Promise<Candidate[]> {
  const [{ featured, topStories, feed }, { data: notables }] = await Promise.all([
    getNews(),
    createAdminClient()
      .from("notables")
      .select("id, title, body, raw_text, source, board, thread_url, media, created_at_source, scraped_at")
      .order("scraped_at", { ascending: false })
      .limit(40),
  ])

  const stories = [featured, ...topStories, ...feed]
  const wireCandidates = stories.map((story, index) => {
    const publishedAt = safeDate(new Date(Date.now() - Math.max(0, story.minutesAgo) * 60_000).toISOString())
    const signal = normalizeSignal({
      id: story.id || `wire-${index}`,
      kind: "wire",
      title: cleanText(story.headline, "Untitled wire report", 240),
      excerpt: cleanText(story.summary, "Open the full wire report for additional context.", 1200),
      source: cleanText(story.source, "WIRE DESK", 120),
      category: cleanText(story.category, "WIRE", 80),
      url: normalizeHttpUrl(story.url) ?? INTERNAL_URL,
      imageUrl: safeImage(story.image) ?? undefined,
      publishedAt: publishedAt ?? undefined,
    })
    return { signal, publishedAt }
  })

  const notableCandidates = (notables ?? []).map((row: Record<string, unknown>) => {
    const media = Array.isArray(row.media) ? row.media : []
    const imageUrl = media.map((value) => safeImage(typeof value === "string" ? value : null)).find(Boolean) ?? null
    const publishedAt = safeDate(String(row.created_at_source ?? row.scraped_at ?? ""))
    const signal = normalizeSignal({
      id: String(row.id ?? row.hash_unique ?? "notable"),
      kind: "notable",
      title: cleanText(row.title, "Untitled notable", 240),
      excerpt: cleanText(row.raw_text ?? row.body, "Open the notable record for the source material.", 1200),
      source: cleanText(row.source, "NOTABLES DESK", 120),
      category: cleanText(row.board, "NOTABLES", 80),
      url: normalizeHttpUrl(String(row.thread_url ?? "")) ?? INTERNAL_URL,
      imageUrl: imageUrl ?? undefined,
      publishedAt: publishedAt ?? undefined,
    })
    return { signal, publishedAt }
  })

  const seen = new Set<string>()
  return [...wireCandidates, ...notableCandidates]
    .filter((candidate) => {
      const key = candidateToSignalKey(candidate)
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
    .sort((a, b) => {
      const scoreDifference = buildAnalysis(b.signal, b.publishedAt).score - buildAnalysis(a.signal, a.publishedAt).score
      return scoreDifference || a.signal.signalKey.localeCompare(b.signal.signalKey)
    })
}

export async function getSignalAnalysisSettings(): Promise<SignalAnalysisSettings> {
  try {
    const { data } = await createAdminClient()
      .from("site_settings")
      .select("signal_analysis_enabled, signal_preview_enabled, signal_analysis_min_score, signal_analysis_max_items")
      .eq("id", 1)
      .maybeSingle()

    return {
      enabled: data?.signal_analysis_enabled ?? DEFAULT_SETTINGS.enabled,
      previewEnabled: data?.signal_preview_enabled ?? DEFAULT_SETTINGS.previewEnabled,
      minScore: clamp(data?.signal_analysis_min_score ?? DEFAULT_SETTINGS.minScore, 0, 100),
      maxItems: clamp(data?.signal_analysis_max_items ?? DEFAULT_SETTINGS.maxItems, 1, 100),
    }
  } catch (error) {
    console.error("[signal-analysis] Settings lookup failed", error)
    return DEFAULT_SETTINGS
  }
}

function mapRow(row: Record<string, unknown>): SignalAnalysisItem {
  const rawAnalysis = row.analysis && typeof row.analysis === "object" ? row.analysis as Record<string, unknown> : {}
  return {
    id: String(row.id),
    signalKey: String(row.signal_key),
    sourceKind: String(row.source_kind),
    sourceId: typeof row.source_id === "string" ? row.source_id : null,
    title: String(row.title),
    excerpt: String(row.excerpt ?? ""),
    source: String(row.source ?? ""),
    category: String(row.category ?? "OTHER"),
    url: String(row.url),
    imageUrl: typeof row.image_url === "string" ? row.image_url : null,
    publishedAt: typeof row.published_at === "string" ? row.published_at : null,
    score: Number(row.score ?? 0),
    status: (String(row.status ?? "pending") as SignalAnalysisStatus),
    analysis: {
      score: Number(rawAnalysis.score ?? row.score ?? 0),
      rationale: String(rawAnalysis.rationale ?? "Queued for editorial review."),
      matchedTerms: Array.isArray(rawAnalysis.matchedTerms) ? rawAnalysis.matchedTerms.map(String) : [],
      recency: Number(rawAnalysis.recency ?? 0),
      sourceWeight: Number(rawAnalysis.sourceWeight ?? 0),
      categoryWeight: Number(rawAnalysis.categoryWeight ?? 0),
    },
    firstSeenAt: String(row.first_seen_at),
    lastSeenAt: String(row.last_seen_at),
    reviewedAt: typeof row.reviewed_at === "string" ? row.reviewed_at : null,
    createdAt: String(row.created_at),
  }
}

export async function getSignalAnalysisItems(options: { status?: SignalAnalysisStatus | "all"; limit?: number } = {}): Promise<SignalAnalysisItem[]> {
  const db = createAdminClient()
  let query = db
    .from("signal_analysis_items")
    .select("id, signal_key, source_kind, source_id, title, excerpt, source, category, url, image_url, published_at, score, status, analysis, first_seen_at, last_seen_at, reviewed_at, created_at")
    .order("score", { ascending: false })
    .order("published_at", { ascending: false, nullsFirst: false })
    .limit(Math.min(100, Math.max(1, options.limit ?? 50)))

  if (options.status && options.status !== "all") query = query.eq("status", options.status)
  const { data, error } = await query
  if (error) throw new Error("Unable to load signal analysis items.")
  return (data ?? []).map((row) => mapRow(row as Record<string, unknown>))
}

export async function getApprovedSignalAnalysisItems(limit = 8): Promise<SignalAnalysisItem[]> {
  const settings = await getSignalAnalysisSettings()
  if (!settings.previewEnabled) return []
  return getSignalAnalysisItems({ status: "approved", limit: Math.min(limit, settings.maxItems) })
}

export async function runSignalAnalysis(triggeredBy: "cron" | "manual"): Promise<SignalAnalysisRunResult> {
  const db = createAdminClient()
  const settings = await getSignalAnalysisSettings()
  const { data: run, error: runError } = await db
    .from("signal_analysis_runs")
    .insert({ triggered_by: triggeredBy })
    .select("id")
    .single()

  if (runError) throw new Error("Unable to start signal analysis run.")
  if (!settings.enabled) {
    await db.from("signal_analysis_runs").update({ status: "disabled", finished_at: new Date().toISOString() }).eq("id", run.id)
    return { success: true, status: "disabled", runId: run.id, scannedCount: 0, createdCount: 0, updatedCount: 0, approvedCount: 0, errorCount: 0, errors: [] }
  }

  let candidates: Candidate[] = []
  try {
    const collected = await collectCandidates()
    candidates = collected
      .filter((candidate) => buildAnalysis(candidate.signal, candidate.publishedAt).score >= settings.minScore)
      .slice(0, settings.maxItems)
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to collect source items."
    await db.from("signal_analysis_runs").update({ status: "failed", finished_at: new Date().toISOString(), error_count: 1, errors: [message] }).eq("id", run.id)
    return { success: false, status: "failed", runId: run.id, scannedCount: 0, createdCount: 0, updatedCount: 0, approvedCount: 0, errorCount: 1, errors: [message] }
  }

  let createdCount = 0
  let updatedCount = 0
  let approvedCount = 0
  const errors: string[] = []

  for (const candidate of candidates) {
    const analysis = buildAnalysis(candidate.signal, candidate.publishedAt)
    try {
      const { data: existing, error: lookupError } = await db
        .from("signal_analysis_items")
        .select("id, status")
        .eq("signal_key", candidate.signal.signalKey)
        .maybeSingle()
      if (lookupError) throw lookupError

      const basePayload = {
        signal_key: candidate.signal.signalKey,
        source_kind: candidate.signal.sourceKind,
        source_id: candidate.signal.sourceId ?? null,
        title: candidate.signal.title,
        excerpt: candidate.signal.excerpt,
        source: candidate.signal.source,
        category: candidate.signal.category,
        url: candidate.signal.url,
        image_url: candidate.signal.imageUrl ?? null,
        published_at: candidate.publishedAt,
        score: analysis.score,
        analysis,
        last_seen_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      if (existing) {
        const { error } = await db.from("signal_analysis_items").update(basePayload).eq("id", existing.id)
        if (error) throw error
        updatedCount += 1
        if (existing.status === "approved") approvedCount += 1
      } else {
        const { error } = await db.from("signal_analysis_items").insert({ ...basePayload, status: "pending" })
        if (error) throw error
        createdCount += 1
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown item error"
      errors.push(`${candidate.signal.title.slice(0, 80)}: ${message}`)
    }
  }

  const status = errors.length === 0 ? "completed" : candidates.length > errors.length ? "partial" : "failed"
  await db.from("signal_analysis_runs").update({
    status,
    finished_at: new Date().toISOString(),
    scanned_count: candidates.length,
    created_count: createdCount,
    updated_count: updatedCount,
    approved_count: approvedCount,
    error_count: errors.length,
    errors,
  }).eq("id", run.id)

  return {
    success: errors.length === 0,
    status,
    runId: run.id,
    scannedCount: candidates.length,
    createdCount,
    updatedCount,
    approvedCount,
    errorCount: errors.length,
    errors: errors.slice(0, 20),
  }
}

export function signalAnalysisToSignal(item: SignalAnalysisItem): Signal {
  return normalizeSignal({
    id: item.sourceId ?? item.id,
    kind: item.sourceKind,
    title: item.title,
    excerpt: item.excerpt,
    source: item.source,
    category: item.category,
    url: item.url,
    imageUrl: item.imageUrl ?? undefined,
    publishedAt: item.publishedAt ?? undefined,
    metadata: { score: item.score, analysisStatus: item.status },
  })
}
