/**
 * lib/classifier.ts
 *
 * Deterministic, subject-based story classifier.
 * No AI/LLM calls — all rules are pure synchronous logic evaluated at
 * build and runtime with zero latency overhead.
 *
 * Design principles
 * -----------------
 * • Strong signals  (+4): highly specific phrases or terms that uniquely identify
 *   a subject area (e.g. "missile strike", "grammy award").
 * • Moderate signals (+2): directional single terms that are indicative but not
 *   conclusive on their own (e.g. "military", "entertainment").
 * • Weak signals    (+1): contextual words that provide supporting evidence only
 *   and can never produce a passing classification by themselves.
 *
 * Confidence formula: winner / (winner + runner-up + 1)
 * • Threshold: 0.75 — anything below is returned as "OTHER".
 * • A single strong hit with no competing signals yields 0.80, which passes.
 * • Tied categories or two competing signals force confidence below 0.75.
 */

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

export const ALLOWED_CATEGORIES = [
  "NOTABLES",
  "WORLD",
  "POLITICS",
  "DEFENSE",
  "ECONOMY",
  "TECH",
  "SCIENCE",
  "ENERGY",
  "CULTURE",
  "CRIME",
  "OTHER",
] as const

export type AllowedCategory = (typeof ALLOWED_CATEGORIES)[number]

export interface ClassificationResult {
  category: AllowedCategory
  confidence: number
  reasoning: string
}

// ---------------------------------------------------------------------------
// Signal weights
// ---------------------------------------------------------------------------

const S = 4 // strong
const M = 2 // moderate
const W = 1 // weak

// ---------------------------------------------------------------------------
// Rule definitions
// ---------------------------------------------------------------------------

type ClassifiableCategory = Exclude<AllowedCategory, "OTHER" | "NOTABLES">

interface Rule {
  strong: string[]
  moderate: string[]
  weak: string[]
}

const RULES: Record<ClassifiableCategory, Rule> = {
  // ------------------------------------------------------------------
  DEFENSE: {
    strong: [
      "military strike",
      "air strike",
      "missile strike",
      "drone strike",
      "air force",
      "naval fleet",
      "ground troops",
      "armed forces",
      "pentagon",
      "joint chiefs",
      "aircraft carrier",
      "nuclear warhead",
      "special forces",
      "military operation",
      "combat mission",
      "troop deployment",
      "department of defense",
      "military base",
      "weapons system",
      "nuclear arsenal",
      "fighter jet",
      "stealth bomber",
      "military exercise",
      "war crime",
      "ceasefire declaration",
      "nato summit",
      "nato alliance",
      "defense contractor",
      "missile defense",
      "nuclear submarine",
      "armored vehicle",
    ],
    moderate: [
      "military",
      "troops",
      "warfare",
      "combat",
      "missile",
      "weapon",
      "battalion",
      "regiment",
      "artillery",
      "marines",
      "soldier",
      "veteran",
      "general",
      "admiral",
      "nato",
      "defense ministry",
      "armistice",
      "warship",
      "infantry",
      "navy seal",
    ],
    weak: ["war", "conflict", "security", "threat", "defense"],
  },

  // ------------------------------------------------------------------
  POLITICS: {
    strong: [
      "congressional bill",
      "senate vote",
      "house of representatives",
      "presidential election",
      "electoral college",
      "political party",
      "speaker of the house",
      "majority leader",
      "minority leader",
      "executive order",
      "legislative session",
      "campaign finance",
      "primary election",
      "midterm election",
      "supreme court ruling",
      "electoral vote",
      "ballot measure",
      "state department",
      "white house briefing",
      "senate hearing",
      "filibuster",
      "impeachment",
      "congressional hearing",
      "cabinet secretary",
      "secretary of state",
      "national security council",
    ],
    moderate: [
      "congress",
      "senate",
      "legislation",
      "parliament",
      "elected",
      "democrat",
      "republican",
      "election",
      "lawmaker",
      "governor",
      "mayor",
      "president",
      "policy",
      "amendment",
      "committee",
      "lobbying",
      "diplomat",
      "treaty",
      "veto",
      "confirmation hearing",
      "partisan",
      "bipartisan",
    ],
    weak: ["government", "official", "administration", "political"],
  },

  // ------------------------------------------------------------------
  ECONOMY: {
    strong: [
      "federal reserve",
      "interest rate hike",
      "interest rate cut",
      "gdp growth",
      "stock market",
      "trade deficit",
      "inflation rate",
      "unemployment rate",
      "wall street",
      "hedge fund",
      "quarterly earnings",
      "consumer price index",
      "cpi report",
      "jobs report",
      "labor department",
      "commerce department",
      "tariff hike",
      "trade agreement",
      "market crash",
      "market rally",
      "treasury secretary",
      "opec production",
      "bond yield",
      "venture capital",
    ],
    moderate: [
      "economy",
      "economic",
      "market",
      "financial",
      "banking",
      "investment",
      "investor",
      "stocks",
      "bonds",
      "trade",
      "revenue",
      "profit",
      "recession",
      "inflation",
      "gdp",
      "employment",
      "wage",
      "supply chain",
      "manufacturer",
      "commerce",
      "retail",
      "tariff",
    ],
    weak: ["money", "fund", "price", "cost", "budget"],
  },

  // ------------------------------------------------------------------
  TECH: {
    strong: [
      "artificial intelligence",
      "machine learning",
      "deep learning",
      "cybersecurity breach",
      "data breach",
      "open source software",
      "programming language",
      "cloud computing",
      "quantum computing",
      "semiconductor chip",
      "tech startup",
      "silicon valley",
      "computer science",
      "neural network",
      "cryptocurrency",
      "blockchain",
      "virtual reality",
      "augmented reality",
      "chatgpt",
      "large language model",
      "generative ai",
      "software vulnerability",
      "ransomware attack",
      "ai model",
      "language model",
    ],
    moderate: [
      "technology",
      "software",
      "hardware",
      "platform",
      "developer",
      "coding",
      "cybersecurity",
      "cyber",
      "digital",
      "smartphone",
      "computer",
      "robot",
      "automation",
      "algorithm",
      "database",
      "encryption",
      "hacking",
      "microchip",
      "broadband",
    ],
    // Note: "ai", "online", "website", "social media" are WEAK — they appear
    // in too many non-tech stories to be decisive on their own.
    weak: ["online", "website", "tech", "ai", "app", "data", "internet"],
  },

  // ------------------------------------------------------------------
  SCIENCE: {
    strong: [
      "clinical trial",
      "medical research",
      "peer-reviewed",
      "vaccine efficacy",
      "fda approval",
      "drug approval",
      "cdc study",
      "nih research",
      "cancer treatment",
      "gene therapy",
      "space mission",
      "nasa discovery",
      "spacex launch",
      "climate study",
      "geological survey",
      "weight-loss drug",
      "prescription drug",
      "pharmaceutical",
      "drug warning",
      "health warning",
      "medical device",
      "disease outbreak",
      "scientific discovery",
      "particle physics",
      "quantum physics",
      "marine biology",
      "species discovery",
      "fossil find",
    ],
    moderate: [
      "science",
      "scientist",
      "research",
      "discovery",
      "medicine",
      "medical",
      "virus",
      "bacteria",
      "vaccine",
      "treatment",
      "laboratory",
      "experiment",
      "biology",
      "chemistry",
      "physics",
      "astronomy",
      "ecology",
      "environment",
      "climate",
      "species",
      "fossil",
      "pandemic",
      "epidemic",
      "outbreak",
      "pathogen",
      "cdc",
      "nih",
      "nasa",
      "niaid",
    ],
    weak: ["study", "report", "health", "drug", "evidence"],
  },

  // ------------------------------------------------------------------
  ENERGY: {
    strong: [
      "oil production",
      "natural gas",
      "energy policy",
      "power grid",
      "solar panel",
      "wind turbine",
      "nuclear plant",
      "coal mine",
      "petroleum reserve",
      "energy department",
      "crude oil price",
      "eia report",
      "lng export",
      "pipeline project",
      "refinery",
      "electric vehicle",
      "battery storage",
      "renewable energy",
      "energy transition",
      "fossil fuel",
      "oil price",
      "gas price",
      "energy crisis",
      "carbon emissions",
    ],
    moderate: [
      "energy",
      "oil",
      "electricity",
      "fuel",
      "solar",
      "wind",
      "nuclear",
      "coal",
      "grid",
      "utility",
      "barrel",
      "kilowatt",
      "megawatt",
      "petroleum",
      "drilling",
      "emissions",
      "carbon",
    ],
    // "power", "gas", "electric" are too common in other contexts to be decisive
    weak: ["power", "gas", "electric", "plant", "station"],
  },

  // ------------------------------------------------------------------
  WORLD: {
    strong: [
      "united nations",
      "international treaty",
      "world bank",
      "foreign affairs",
      "diplomatic relations",
      "global summit",
      "g7 summit",
      "g20 summit",
      "bilateral talks",
      "sanctions against",
      "refugee crisis",
      "humanitarian aid",
      "international court",
      "foreign minister",
      "china relations",
      "russia sanctions",
      "iran nuclear deal",
    ],
    moderate: [
      "international",
      "global",
      "foreign",
      "diplomacy",
      "ambassador",
      "ukraine",
      "russia",
      "china",
      "taiwan",
      "middle east",
      "israel",
      "iran",
      "north korea",
      "european union",
      "asia pacific",
      "africa",
      "latin america",
    ],
    weak: ["world", "nation", "country", "global"],
  },

  // ------------------------------------------------------------------
  CULTURE: {
    strong: [
      "box office",
      "grammy award",
      "oscar nomination",
      "emmy award",
      "super bowl",
      "world series",
      "wwe",
      "ufc fight",
      "music video",
      "album release",
      "film premiere",
      "concert tour",
      "celebrity couple",
      "reality tv",
      "reality show",
      "streaming series",
      "movie premiere",
      "award show",
      "red carpet",
      "grammy",
      "oscar",
      "emmy",
      "tony award",
      "golden globe",
      "entertainment industry",
    ],
    moderate: [
      "entertainment",
      "celebrity",
      "sports",
      "music",
      "film",
      "movie",
      "television",
      "actor",
      "actress",
      "singer",
      "athlete",
      "festival",
      "award",
      "concert",
      "stadium",
      "cultural",
      "fashion",
      "theater",
      "nfl",
      "nba",
      "mlb",
      "nhl",
      "mls",
    ],
    // "game", "team", "show", "star" are too generic to be decisive alone
    weak: ["star", "fan", "show", "game", "team"],
  },

  // ------------------------------------------------------------------
  CRIME: {
    strong: [
      "arrested for",
      "charged with",
      "indicted on",
      "convicted of",
      "sentenced to",
      "murder suspect",
      "homicide investigation",
      "drug trafficking",
      "federal charges",
      "grand jury indictment",
      "criminal charges",
      "search warrant",
      "crime scene",
      "fraud scheme",
      "money laundering",
      "sex offender",
      "mass shooting",
      "robbery suspect",
      "fbi raid",
      "doj charges",
      "doj indictment",
      "drug bust",
    ],
    moderate: [
      "arrest",
      "arrested",
      "charged",
      "crime",
      "criminal",
      "investigation",
      "suspect",
      "convicted",
      "prison",
      "jail",
      "trial",
      "verdict",
      "prosecutor",
      "defendant",
      "trafficking",
      "smuggling",
      "theft",
      "assault",
      "murder",
      "kidnapping",
      "fraud",
      "homicide",
    ],
    weak: ["police", "officer", "law enforcement"],
  },
}

// ---------------------------------------------------------------------------
// Matching helpers
// ---------------------------------------------------------------------------

/**
 * Returns true if `term` appears in `text` as a proper word-boundary match.
 * For multi-word phrases, substring matching is sufficient because the phrase
 * itself is already specific enough to avoid false positives.
 *
 * For single words we require that neither the preceding nor the following
 * character is an alphanumeric so that "ai" doesn't match "said" or "email".
 */
function isWordChar(code: number): boolean {
  return (code >= 97 && code <= 122) || (code >= 48 && code <= 57)
}

function matchesTerm(text: string, term: string): boolean {
  const idx = text.indexOf(term)
  if (idx === -1) return false

  // Multi-word phrase — substring match is sufficient
  if (term.includes(" ")) return true

  // Single word — check all occurrences for a word boundary
  let pos = idx
  while (pos !== -1) {
    const before = pos === 0 ? -1 : text.charCodeAt(pos - 1)
    const after = pos + term.length >= text.length ? -1 : text.charCodeAt(pos + term.length)
    const boundaryBefore = before === -1 || !isWordChar(before)
    const boundaryAfter = after === -1 || !isWordChar(after)
    if (boundaryBefore && boundaryAfter) return true
    pos = text.indexOf(term, pos + 1)
  }
  return false
}

function scoreCategory(text: string, rule: Rule): { score: number; matches: string[] } {
  let score = 0
  const matches: string[] = []

  for (const phrase of rule.strong) {
    if (matchesTerm(text, phrase)) {
      score += S
      matches.push(phrase)
    }
  }
  for (const phrase of rule.moderate) {
    if (matchesTerm(text, phrase)) {
      score += M
      if (matches.length < 5) matches.push(phrase)
    }
  }
  for (const phrase of rule.weak) {
    if (matchesTerm(text, phrase)) {
      score += W
      if (matches.length < 5) matches.push(phrase)
    }
  }

  return { score, matches }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Classify a story by its headline and optional summary.
 *
 * Returns a `ClassificationResult` with `category`, `confidence` (0–1), and
 * a short `reasoning` string.  If confidence < 0.75 the category is "OTHER".
 */
export function classifyStory(headline: string, summary = ""): ClassificationResult {
  // Normalize: lowercase, collapse punctuation to spaces
  const raw = `${headline} ${summary}`
  const text = raw
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim()

  // Score every classifiable category
  const results: { cat: ClassifiableCategory; score: number; matches: string[] }[] = []

  for (const cat of Object.keys(RULES) as ClassifiableCategory[]) {
    const { score, matches } = scoreCategory(text, RULES[cat])
    results.push({ cat, score, matches })
  }

  // Sort descending by score
  results.sort((a, b) => b.score - a.score)

  const winner = results[0]
  const runnerUp = results[1]

  // No signals detected
  if (winner.score === 0) {
    return {
      category: "OTHER",
      confidence: 0,
      reasoning: "No subject-specific signals detected in headline or summary.",
    }
  }

  // Confidence = winner / (winner + runner-up + 1)
  // This ensures a single strong hit with no competition yields 0.80 (passes),
  // while a tie or strong competition yields < 0.75 (falls to OTHER).
  const confidence =
    Math.round((winner.score / (winner.score + runnerUp.score + 1)) * 100) / 100

  if (confidence < 0.75) {
    return {
      category: "OTHER",
      confidence,
      reasoning: `Confidence ${confidence} below threshold. Best candidate was ${winner.cat} (${winner.score} pts) via: ${winner.matches.slice(0, 3).join(", ")}. Runner-up: ${runnerUp.cat} (${runnerUp.score} pts).`,
    }
  }

  return {
    category: winner.cat,
    confidence,
    reasoning: `Classified as ${winner.cat} (confidence ${confidence}) via: ${winner.matches.slice(0, 3).join(", ")}.`,
  }
}

// ---------------------------------------------------------------------------
// Validation layer
// ---------------------------------------------------------------------------

/**
 * Normalise and validate a raw category value before writing it to the DB.
 *
 * - Accepts any casing (e.g. "defense", "DEFENSE", "Defense").
 * - Returns "OTHER" for any value that is not in the approved list.
 * - Always returns a non-empty string — the DB field is never left invalid.
 */
export function validateCategory(raw: unknown): AllowedCategory {
  if (typeof raw !== "string" || raw.trim() === "") return "OTHER"
  const normalized = raw.trim().toUpperCase() as AllowedCategory
  return ALLOWED_CATEGORIES.includes(normalized) ? normalized : "OTHER"
}
