import type { Category } from "@/lib/news-data"

export const CLASSIFIER_VERSION = "2026.07.1"

export type ReviewStatus = "auto_published" | "review" | "moderation" | "reviewed"

export interface ClassificationInput {
  headline: string
  description?: string | null
  sourceCategory?: string | null
  articleUrl?: string | null
  keywords?: string[]
  namedEntities?: string[]
  articleText?: string | null
}

export interface ClassificationResult {
  primaryCategory: Category
  secondaryTags: Category[]
  confidence: number
  reviewStatus: ReviewStatus
  method: "deterministic" | "ai"
  rationale: string
  classifierVersion: string
}

type Rule = { category: Category; phrases: string[]; strong?: string[] }

const RULES: Rule[] = [
  { category: "CRIME", phrases: ["murder", "homicide", "assault", "robbery", "arrested", "arrest", "criminal investigation", "missing person", "fatally shot", "shot dead", "serving a warrant", "charged with", "manslaughter"], strong: ["murder", "homicide", "fatally shot", "robbery"] },
  { category: "BORDER SECURITY", phrases: ["ice agent", "immigration enforcement", "illegal entry", "illegal immigrant", "deportation", "deported", "asylum", "border crossing", "border patrol", "cbp", "southern border", "northern border"], strong: ["ice agent", "border patrol", "cbp", "deportation"] },
  { category: "ELECTION INTEGRITY", phrases: ["voting machine", "ballot", "election audit", "election law", "voter registration", "recount", "election security", "election misconduct", "vote tabulation"], strong: ["voting machine", "election audit", "recount"] },
  { category: "DEFENSE", phrases: ["military deployment", "armed conflict", "missile", "weapons system", "intelligence operation", "national security threat", "department of defense", "pentagon", "troops", "air strike", "naval", "army", "air force", "combat"], strong: ["military deployment", "department of defense", "pentagon", "troops"] },
  { category: "ENERGY", phrases: ["crude oil", "natural gas", "liquefied natural gas", "lng", "pipeline", "electricity", "power grid", "nuclear power", "utility rates", "energy market", "energy policy", "oil production", "gas production"], strong: ["liquefied natural gas", "pipeline", "power grid", "oil production"] },
  { category: "CORRUPTION", phrases: ["bribery", "conflict of interest", "misuse of public office", "government fraud", "influence scheme", "official misconduct", "kickback", "public corruption"], strong: ["bribery", "kickback", "public corruption"] },
  { category: "POLITICS", phrases: ["congress", "capitol hill", "white house", "governor", "legislation", "legislature", "senate", "senator", "political appointment", "appointed to senate", "campaign", "political party", "domestic policy", "federal judge", "supreme court", "daylight saving time", "irs lawsuit"], strong: ["congress", "white house", "legislation", "senate", "capitol hill"] },
  { category: "TECH", phrases: ["software", "artificial intelligence", "ai company", "ai model", "cybersecurity", "computer chip", "semiconductor", "telecommunications", "technology company", "data breach", "cloud computing", "operating system"], strong: ["artificial intelligence", "ai model", "cybersecurity", "software"] },
  { category: "SCIENCE", phrases: ["medical research", "peer-reviewed", "scientific study", "clinical trial", "space mission", "biology", "climate research", "discovery", "researchers found"], strong: ["peer-reviewed", "clinical trial", "space mission"] },
  { category: "ECONOMY", phrases: ["jobs report", "inflation", "housing market", "banking", "stock market", "federal spending", "business conditions", "interest rates", "tariff", "trade deficit", "unemployment", "federal reserve"], strong: ["inflation", "jobs report", "federal reserve"] },
  { category: "FAITH", phrases: ["religious liberty", "christianity", "church", "scripture", "faith-based", "religion", "pastor", "bible"], strong: ["religious liberty", "christianity", "scripture"] },
  { category: "WORLD", phrases: ["foreign government", "diplomacy", "united nations", "nato summit", "overseas election", "european union", "foreign minister", "international affairs", "global institution"], strong: ["united nations", "foreign government", "diplomacy"] },
  { category: "CULTURE", phrases: ["entertainment", "education", "school board", "sports", "social issue", "news media", "family policy", "cultural dispute", "film", "television", "celebrity"], strong: ["entertainment", "sports", "education"] },
]

const priority: Category[] = ["CRIME", "BORDER SECURITY", "ELECTION INTEGRITY", "DEFENSE", "ENERGY", "CORRUPTION", "POLITICS", "TECH", "SCIENCE", "ECONOMY", "FAITH", "WORLD", "CULTURE", "OTHER"]
const normalize = (value: string) => value.toLowerCase().replace(/[’']/g, "'").replace(/\s+/g, " ")
const count = (text: string, phrase: string) => text.includes(phrase) ? 1 : 0

export function classifyStory(input: ClassificationInput): ClassificationResult {
  const headline = normalize(input.headline)
  const body = normalize([input.description, input.articleText, input.sourceCategory, input.articleUrl, ...(input.keywords ?? []), ...(input.namedEntities ?? [])].filter(Boolean).join(" "))
  const full = `${headline} ${body}`
  const scores = new Map<Category, { score: number; hits: string[] }>()

  for (const rule of RULES) {
    const hits = rule.phrases.filter((phrase) => full.includes(phrase))
    const headlineHits = rule.phrases.filter((phrase) => headline.includes(phrase)).length
    const strongHits = (rule.strong ?? []).filter((phrase) => full.includes(phrase)).length
    if (hits.length) scores.set(rule.category, { score: hits.length * 14 + headlineHits * 9 + strongHits * 16, hits })
  }

  const crime = scores.get("CRIME")?.score ?? 0
  const border = scores.get("BORDER SECURITY")?.score ?? 0
  if (crime >= 30 && border > 0) scores.set("CRIME", { ...scores.get("CRIME")!, score: crime + 25 })
  if ((scores.get("DEFENSE")?.score ?? 0) > 0 && !/(military|troops|pentagon|missile|armed conflict|intelligence operation|national security threat|combat|naval|air force)/.test(full)) scores.delete("DEFENSE")
  if ((scores.get("ENERGY")?.score ?? 0) > 0 && !/(oil|gas|lng|pipeline|electricity|grid|nuclear power|utility|energy market|energy policy)/.test(full)) scores.delete("ENERGY")
  if ((scores.get("TECH")?.score ?? 0) > 0 && !/(software|artificial intelligence|ai company|ai model|cyber|computer|semiconductor|telecommunication|technology company|data breach|cloud computing|operating system)/.test(full)) scores.delete("TECH")

  const ranked = [...scores.entries()].sort((a, b) => b[1].score - a[1].score || priority.indexOf(a[0]) - priority.indexOf(b[0]))
  const winner = ranked[0]
  const runnerUp = ranked[1]
  let confidence = winner ? Math.min(98, 58 + winner[1].score) : 35
  if (winner && runnerUp && winner[1].score - runnerUp[1].score < 12) confidence = Math.min(confidence, 78)

  const secondaryTags = ranked.slice(1).filter(([, value]) => value.score >= 20).slice(0, 3).map(([category]) => category)
  if (winner?.[0] === "CRIME" && border >= 20 && !secondaryTags.includes("BORDER SECURITY")) secondaryTags.unshift("BORDER SECURITY")

  const reliableCategory = confidence >= 65 && winner ? winner[0] : "OTHER"
  return {
    primaryCategory: reliableCategory,
    secondaryTags: secondaryTags.slice(0, 3),
    confidence,
    reviewStatus: confidence >= 85 ? "auto_published" : confidence >= 65 ? "review" : "moderation",
    method: "deterministic",
    rationale: winner ? `Matched ${winner[1].hits.slice(0, 5).join(", ")}; evaluated headline and ${body ? "available context" : "no additional context"}.` : "No category had enough supporting evidence.",
    classifierVersion: CLASSIFIER_VERSION,
  }
}
