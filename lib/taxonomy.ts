/**
 * lib/taxonomy.ts
 *
 * Single source of truth for the three-axis taxonomy:
 *   1. Desk      — primary subject area  (11 controlled values)
 *   2. ContentType — format of the record (13 controlled values)
 *   3. Tags       — normalized topic/subject labels (free-form, normalized)
 *
 * Also exports parseLegacyCategory() which converts raw, comma-separated
 * category strings from the old single-field model into structured taxonomy.
 */

// ---------------------------------------------------------------------------
// Desks
// ---------------------------------------------------------------------------

export const DESKS = [
  "notables",
  "world",
  "politics",
  "defense",
  "economy",
  "tech",
  "science",
  "energy",
  "culture",
  "crime",
  "other",
] as const

export type Desk = (typeof DESKS)[number]

export const DESK_LABELS: Record<Desk, string> = {
  notables: "Notables",
  world: "World",
  politics: "Politics",
  defense: "Defense",
  economy: "Economy",
  tech: "Tech",
  science: "Science",
  energy: "Energy",
  culture: "Culture",
  crime: "Crime",
  other: "Other",
}

// ---------------------------------------------------------------------------
// Content types
// ---------------------------------------------------------------------------

export const CONTENT_TYPES = [
  "news-brief",
  "field-note",
  "research-thread",
  "investigation",
  "explainer",
  "source-archive",
  "document-drop",
  "video",
  "show-notes",
  "live-stream",
  "opinion",
  "site-update",
  "other",
] as const

export type ContentType = (typeof CONTENT_TYPES)[number]

export const CONTENT_TYPE_LABELS: Record<ContentType, string> = {
  "news-brief": "News Brief",
  "field-note": "Field Note",
  "research-thread": "Research Thread",
  investigation: "Investigation",
  explainer: "Explainer",
  "source-archive": "Source Archive",
  "document-drop": "Document Drop",
  video: "Video",
  "show-notes": "Show Notes",
  "live-stream": "Live Stream",
  opinion: "Opinion",
  "site-update": "Site Update",
  other: "Other",
}

// ---------------------------------------------------------------------------
// Tag normalization
// ---------------------------------------------------------------------------

const MAX_TAGS = 12

/**
 * Normalize a single raw tag token into its slug form.
 * Returns null when the token normalizes to empty (should be discarded).
 */
export function normalizeTag(raw: string): string | null {
  const slug = raw
    .toLowerCase()
    .trim()
    // Remove characters that are not letters, digits, spaces, or hyphens
    .replace(/[^a-z0-9\s-]/g, "")
    // Collapse runs of spaces/hyphens
    .replace(/[\s-]+/g, "-")
    .replace(/^-+|-+$/g, "") // trim leading/trailing hyphens

  return slug.length > 0 ? slug : null
}

/**
 * Normalize, deduplicate, and limit an array of raw tag strings.
 */
export function normalizeTags(raws: string[]): string[] {
  const seen = new Set<string>()
  const result: string[] = []

  for (const raw of raws) {
    // Split on commas first — callers sometimes pass a CSV as one element
    const parts = raw.split(",")
    for (const part of parts) {
      const slug = normalizeTag(part)
      if (slug && !seen.has(slug)) {
        seen.add(slug)
        result.push(slug)
        if (result.length >= MAX_TAGS) return result
      }
    }
  }

  return result
}

// ---------------------------------------------------------------------------
// Validation helpers
// ---------------------------------------------------------------------------

const DESK_SET = new Set<string>(DESKS)
const CONTENT_TYPE_SET = new Set<string>(CONTENT_TYPES)

export function validateDesk(raw: unknown): Desk {
  if (typeof raw !== "string") return "other"
  const normalized = raw.trim().toLowerCase()
  return DESK_SET.has(normalized) ? (normalized as Desk) : "other"
}

export function validateContentType(raw: unknown): ContentType {
  if (typeof raw !== "string") return "other"
  const normalized = raw.trim().toLowerCase()
  return CONTENT_TYPE_SET.has(normalized) ? (normalized as ContentType) : "other"
}

// ---------------------------------------------------------------------------
// Legacy category → taxonomy mapping
// ---------------------------------------------------------------------------

export interface TaxonomyResult {
  desk: Desk
  contentType: ContentType
  tags: string[]
  confidence: number
  reasoning: string
  requiresReview: boolean
}

// Words that indicate a content type rather than a subject desk
const FORMAT_MAP: Record<string, ContentType> = {
  // research variants
  research: "research-thread",
  "research thread": "research-thread",
  "research-thread": "research-thread",

  // show / podcast
  show: "show-notes",
  "show notes": "show-notes",
  "show-notes": "show-notes",
  podcast: "show-notes",
  episode: "show-notes",

  // video
  video: "video",
  videos: "video",
  "video archive": "video",
  "media clip": "video",

  // document
  document: "document-drop",
  documents: "document-drop",
  "document drop": "document-drop",
  "document-drop": "document-drop",
  "public record": "document-drop",

  // investigation
  investigation: "investigation",
  investigations: "investigation",
  "deep dive": "investigation",

  // explainer
  explainer: "explainer",
  explainers: "explainer",
  explainer: "explainer",

  // opinion
  opinion: "opinion",
  editorial: "opinion",
  commentary: "opinion",

  // site maintenance
  "site maintenance": "site-update",
  "site update": "site-update",
  "site-update": "site-update",
  maintenance: "site-update",

  // live stream
  "live stream": "live-stream",
  "live-stream": "live-stream",
  livestream: "live-stream",

  // field note
  "field note": "field-note",
  "field-note": "field-note",
  "field notes": "field-note",

  // news brief
  "news brief": "news-brief",
  "news-brief": "news-brief",
  brief: "news-brief",

  // source archive
  "source archive": "source-archive",
  "source-archive": "source-archive",
}

// Words that map to a desk
const DESK_MAP: Record<string, Desk> = {
  world: "world",
  international: "world",
  global: "world",
  foreign: "world",

  politics: "politics",
  political: "politics",
  government: "politics",
  congress: "politics",
  senate: "politics",

  defense: "defense",
  military: "defense",
  war: "defense",
  nato: "defense",
  army: "defense",
  navy: "defense",

  economy: "economy",
  economic: "economy",
  finance: "economy",
  financial: "economy",
  market: "economy",
  trade: "economy",

  tech: "tech",
  technology: "tech",
  cyber: "tech",
  digital: "tech",
  software: "tech",
  hardware: "tech",

  science: "science",
  scientific: "science",
  medicine: "science",
  medical: "science",
  health: "science",
  biology: "science",
  chemistry: "science",
  physics: "science",
  space: "science",
  nasa: "science",

  energy: "energy",
  oil: "energy",
  gas: "energy",
  nuclear: "energy",
  solar: "energy",
  wind: "energy",
  electric: "energy",
  grid: "energy",

  culture: "culture",
  entertainment: "culture",
  film: "culture",
  movie: "culture",
  music: "culture",
  sports: "culture",
  art: "culture",
  media: "culture",
  television: "culture",
  tv: "culture",

  crime: "crime",
  criminal: "crime",
  police: "crime",
  arrest: "crime",
  fraud: "crime",
  trafficking: "crime",
  murder: "crime",

  notables: "notables",
  qnotables: "notables",
  notable: "notables",
}

// Words that should always become tags (specific topics, never a desk or type)
const ALWAYS_TAG = new Set([
  "covid",
  "covid-19",
  "vaccines",
  "vaccine",
  "pharma",
  "wuhan",
  "virus",
  "viral",
  "pandemic",
  "elections",
  "election",
  "fraud",
  "law",
  "courts",
  "history",
  "psychology",
  "human-trafficking",
  "trafficking",
  "qresearch",
  "dark",
  "dark-research",
  "deep-state",
  "conspiracy",
  "censorship",
  "fauci",
  "nih",
  "cdc",
  "fda",
  "who",
  "big-pharma",
  "bioweapon",
  "5g",
  "surveillance",
  "propaganda",
  "disinfo",
])

/**
 * Parse a legacy category string (possibly a comma-separated mix of subjects,
 * formats, and tags) into structured taxonomy.
 *
 * The function uses three passes:
 *  1. Split on commas, normalize each token
 *  2. For each token, decide: format word → contentType, desk word → desk candidate,
 *     everything else → tag candidate
 *  3. Pick the best desk; derive confidence; flag ambiguous results
 */
export function parseLegacyCategory(
  raw: string | null | undefined,
  /** Extra context from post_type field (e.g. "Show Notes", "Research Thread") */
  postType?: string | null
): TaxonomyResult {
  // Treat null / empty as "needs review"
  if (!raw || raw.trim() === "") {
    return {
      desk: "other",
      contentType: inferContentTypeFromPostType(postType),
      tags: [],
      confidence: 0,
      reasoning: "Empty or missing category — defaulted to other / requires review.",
      requiresReview: true,
    }
  }

  // ---- Pass 1: tokenize ----
  const tokens = raw
    .split(",")
    .map(t => t.trim().toLowerCase().replace(/[^a-z0-9\s-]/g, "").trim())
    .filter(Boolean)

  if (tokens.length === 0) {
    return {
      desk: "other",
      contentType: inferContentTypeFromPostType(postType),
      tags: [],
      confidence: 0,
      reasoning: "Category contained only punctuation — defaulted to other.",
      requiresReview: true,
    }
  }

  // ---- Pass 2: classify each token ----
  const deskCandidates: Desk[] = []
  const contentTypeCandidates: ContentType[] = []
  const tagCandidates: string[] = []
  const unrecognized: string[] = []

  for (const token of tokens) {
    // Skip very short noise tokens
    if (token.length <= 1) continue

    // Always-tag set takes priority — prevents subject terms from becoming desks
    if (ALWAYS_TAG.has(token.replace(/\s+/g, "-"))) {
      tagCandidates.push(token)
      continue
    }

    // Check multi-word phrases first (longer match wins)
    const formatMatch = FORMAT_MAP[token]
    if (formatMatch) {
      contentTypeCandidates.push(formatMatch)
      continue
    }

    const deskMatch = DESK_MAP[token]
    if (deskMatch) {
      deskCandidates.push(deskMatch)
      continue
    }

    // Treat anything unrecognized as a tag candidate
    const slug = normalizeTag(token)
    if (slug) {
      tagCandidates.push(slug)
      unrecognized.push(token)
    }
  }

  // ---- Pass 3: resolve desk ----
  // Prefer the first recognized desk; if none, fall back to "other"
  const desk: Desk = deskCandidates[0] ?? "other"

  // Any extra desk candidates become tags (e.g. "World, Politics" → desk=world, tag=politics)
  if (deskCandidates.length > 1) {
    for (const extra of deskCandidates.slice(1)) {
      tagCandidates.push(extra)
    }
  }

  // ---- Content type ----
  // Priority: explicit format match > post_type inference > fallback
  const contentType: ContentType =
    contentTypeCandidates[0] ??
    inferContentTypeFromPostType(postType) ??
    "news-brief"

  // ---- Tags ----
  const tags = normalizeTags(tagCandidates)

  // ---- Confidence scoring ----
  // High confidence when: exactly one desk found, content type resolved, no unrecognized tokens
  // Medium when: desk found but also unrecognized tokens
  // Low when: no desk found
  let confidence: number
  let requiresReview = false
  let reasoning: string

  if (deskCandidates.length === 0 && tagCandidates.length === 0 && contentTypeCandidates.length === 0) {
    // Only unrecognized tokens — almost certainly a complex legacy string
    confidence = 0.3
    requiresReview = true
    reasoning = `Could not identify desk or format from "${raw}". All tokens were unrecognized: [${unrecognized.join(", ")}].`
  } else if (deskCandidates.length === 0) {
    confidence = 0.45
    requiresReview = true
    reasoning = `No desk identified in "${raw}". Content type: ${contentType}. Tags: [${tags.join(", ")}].`
  } else if (unrecognized.length > 0 && tokens.length > 2) {
    // Some tokens recognized, some not — moderate confidence
    confidence = 0.65
    requiresReview = false
    reasoning = `Desk: ${desk}. Unrecognized tokens moved to tags: [${unrecognized.join(", ")}].`
  } else if (deskCandidates.length > 1) {
    confidence = 0.7
    requiresReview = false
    reasoning = `Multiple desk candidates [${deskCandidates.join(", ")}]. Used "${desk}"; extras became tags.`
  } else {
    // Clean single-desk match
    confidence = 0.92
    requiresReview = false
    reasoning = `Clean mapping: desk=${desk}, contentType=${contentType}, tags=[${tags.join(", ")}].`
  }

  // Force review when confidence is below the safe threshold
  if (confidence < 0.6) requiresReview = true

  return { desk, contentType, tags, confidence, reasoning, requiresReview }
}

// ---------------------------------------------------------------------------
// Post-type inference helper
// ---------------------------------------------------------------------------

const POST_TYPE_TO_CONTENT_TYPE: Record<string, ContentType> = {
  "research thread": "research-thread",
  "research-thread": "research-thread",
  "source archive": "source-archive",
  "source-archive": "source-archive",
  "document drop": "document-drop",
  "document-drop": "document-drop",
  "video archive": "video",
  "show notes": "show-notes",
  "show-notes": "show-notes",
  "timeline entry": "field-note",
  "field note": "field-note",
  "field-note": "field-note",
  "news brief": "news-brief",
  "news-brief": "news-brief",
  explainer: "explainer",
  "media clip": "video",
  "external link": "source-archive",
  "public record": "document-drop",
}

export function inferContentTypeFromPostType(postType?: string | null): ContentType {
  if (!postType) return "other"
  const key = postType.trim().toLowerCase()
  return POST_TYPE_TO_CONTENT_TYPE[key] ?? "other"
}

// ---------------------------------------------------------------------------
// Legacy category → desk (used by RSS ingest for backward-compat)
// ---------------------------------------------------------------------------

/**
 * Quick single-value desk lookup — used when an RSS source already carries
 * a simple category string and we just need the desk slug.
 */
export function legacyCategoryToDesk(raw: string | null | undefined): Desk {
  if (!raw) return "other"
  const key = raw.trim().toLowerCase()
  // Exact desk match
  if (DESK_SET.has(key)) return key as Desk
  // Fallback: use DESK_MAP for common synonyms
  return DESK_MAP[key] ?? "other"
}
