import "server-only"

import { generateText, jsonSchema, Output } from "ai"
import { categories, type Category } from "@/lib/news-data"
import {
  classifyStory,
  CLASSIFIER_VERSION,
  type ClassificationInput,
  type ClassificationResult,
} from "@/lib/story-classifier"

const automaticCategories = categories.filter(
  (category): category is Exclude<Category, "NOTABLES"> => category !== "NOTABLES",
)

interface AiClassification {
  primaryCategory: Exclude<Category, "NOTABLES">
  secondaryTags: Exclude<Category, "NOTABLES">[]
  confidence: number
  rationale: string
}

export interface CorrectionExample {
  headline: string
  previousCategory?: string | null
  correctedCategory: string
}

const classificationSchema = jsonSchema<AiClassification>({
  type: "object",
  additionalProperties: false,
  required: ["primaryCategory", "secondaryTags", "confidence", "rationale"],
  properties: {
    primaryCategory: { type: "string", enum: automaticCategories },
    secondaryTags: {
      type: "array",
      maxItems: 3,
      uniqueItems: true,
      items: { type: "string", enum: automaticCategories },
    },
    confidence: { type: "integer", minimum: 0, maximum: 100 },
    rationale: { type: "string", maxLength: 280 },
  },
})

function compactInput(input: ClassificationInput) {
  return {
    headline: input.headline,
    description: input.description?.slice(0, 2_000) ?? null,
    sourceCategory: input.sourceCategory ?? null,
    articleUrl: input.articleUrl ?? null,
    keywords: input.keywords?.slice(0, 20) ?? [],
    namedEntities: input.namedEntities?.slice(0, 20) ?? [],
    articleText: input.articleText?.slice(0, 6_000) ?? null,
  }
}

export async function classifyStoryWithFallback(
  input: ClassificationInput,
  corrections: CorrectionExample[] = [],
): Promise<ClassificationResult> {
  const deterministic = classifyStory(input)
  if (deterministic.confidence >= 65) return deterministic

  try {
    const { output } = await generateText({
      model: "google/gemini-3.5-flash",
      output: Output.object({ schema: classificationSchema }),
      system: `You classify news stories for an editorial desk. Choose exactly one primary category from: ${automaticCategories.join(", ")}. NOTABLES is manual-only and forbidden. Use all supplied context, not headline keywords alone. Violent crime is CRIME even when immigration is involved; BORDER SECURITY may be a secondary tag. TECH, DEFENSE, and ENERGY require the subject—not an incidental word—to centrally concern that desk. Return up to three distinct secondary tags, excluding the primary category. Confidence must reflect evidence quality.`,
      prompt: JSON.stringify({
        story: compactInput(input),
        recentAdministratorCorrections: corrections.slice(0, 12),
      }),
    })

    const confidence = Math.max(0, Math.min(100, Math.round(output.confidence)))
    const primaryCategory = confidence < 65 ? "OTHER" : output.primaryCategory
    const secondaryTags = output.secondaryTags
      .filter((tag) => tag !== primaryCategory)
      .filter((tag, index, all) => all.indexOf(tag) === index)
      .slice(0, 3)

    return {
      primaryCategory,
      secondaryTags,
      confidence,
      reviewStatus: confidence >= 85 ? "auto_published" : confidence >= 65 ? "review" : "moderation",
      method: "ai",
      rationale: output.rationale.trim() || deterministic.rationale,
      classifierVersion: CLASSIFIER_VERSION,
    }
  } catch {
    return deterministic
  }
}
