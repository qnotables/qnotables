/**
 * lib/taxonomy.test.ts
 *
 * Acceptance tests for the taxonomy module. Covers every criterion from the spec:
 *   - All 11 desks and 13 content types are present and labelled
 *   - validateDesk / validateContentType: allowlist + fallback
 *   - normalizeTag / normalizeTags: slug, dedup, cap, CSV splitting
 *   - parseLegacyCategory: clean single desk, multi-token, format-word separation,
 *     ALWAYS_TAG passthrough, empty/null, confidence scoring, requiresReview flag
 *   - inferContentTypeFromPostType: known mappings + unknown fallback
 *   - legacyCategoryToDesk: direct match, synonym, unknown
 */

import {
  DESKS,
  CONTENT_TYPES,
  DESK_LABELS,
  CONTENT_TYPE_LABELS,
  validateDesk,
  validateContentType,
  normalizeTag,
  normalizeTags,
  parseLegacyCategory,
  inferContentTypeFromPostType,
  legacyCategoryToDesk,
} from "./taxonomy.ts"

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function expect(val: unknown) {
  return {
    toBe(expected: unknown) {
      if (val !== expected)
        throw new Error(`Expected ${JSON.stringify(expected)}, got ${JSON.stringify(val)}`)
    },
    toEqual(expected: unknown) {
      const a = JSON.stringify(val)
      const b = JSON.stringify(expected)
      if (a !== b)
        throw new Error(`Expected ${b}, got ${a}`)
    },
    toBeGreaterThanOrEqual(n: number) {
      if ((val as number) < n)
        throw new Error(`Expected >= ${n}, got ${val}`)
    },
    toBeLessThan(n: number) {
      if ((val as number) >= n)
        throw new Error(`Expected < ${n}, got ${val}`)
    },
    toContain(item: unknown) {
      if (!Array.isArray(val) || !val.includes(item))
        throw new Error(`Expected array to contain ${JSON.stringify(item)}, got ${JSON.stringify(val)}`)
    },
    toBeTruthy() {
      if (!val) throw new Error(`Expected truthy, got ${JSON.stringify(val)}`)
    },
    toBeFalsy() {
      if (val) throw new Error(`Expected falsy, got ${JSON.stringify(val)}`)
    },
    toHaveLength(n: number) {
      if (!Array.isArray(val) || val.length !== n)
        throw new Error(`Expected length ${n}, got ${(val as unknown[])?.length}`)
    },
  }
}

let passed = 0
let failed = 0

function test(name: string, fn: () => void) {
  try {
    fn()
    console.log(`  [PASS] ${name}`)
    passed++
  } catch (err: unknown) {
    console.error(`  [FAIL] ${name}`)
    console.error(`         ${(err as Error).message}`)
    failed++
  }
}

function describe(suite: string, fn: () => void) {
  console.log(`\n${suite}`)
  fn()
}

// ---------------------------------------------------------------------------
// Suite 1 — Constants completeness
// ---------------------------------------------------------------------------

describe("Constants completeness", () => {
  test("exports exactly 11 desks", () => {
    expect(DESKS).toHaveLength(11)
  })

  test("exports exactly 13 content types", () => {
    expect(CONTENT_TYPES).toHaveLength(13)
  })

  test("DESK_LABELS has a label for every desk", () => {
    for (const d of DESKS) {
      if (!DESK_LABELS[d]) throw new Error(`Missing label for desk: ${d}`)
    }
  })

  test("CONTENT_TYPE_LABELS has a label for every content type", () => {
    for (const ct of CONTENT_TYPES) {
      if (!CONTENT_TYPE_LABELS[ct]) throw new Error(`Missing label for content type: ${ct}`)
    }
  })

  test("notables, culture, and crime are present in DESKS", () => {
    expect(DESKS).toContain("notables")
    expect(DESKS).toContain("culture")
    expect(DESKS).toContain("crime")
  })

  test("investigation, document-drop, and live-stream are present in CONTENT_TYPES", () => {
    expect(CONTENT_TYPES).toContain("investigation")
    expect(CONTENT_TYPES).toContain("document-drop")
    expect(CONTENT_TYPES).toContain("live-stream")
  })
})

// ---------------------------------------------------------------------------
// Suite 2 — validateDesk
// ---------------------------------------------------------------------------

describe("validateDesk", () => {
  test("returns exact desk for a valid lowercase value", () => {
    expect(validateDesk("politics")).toBe("politics")
  })

  test("trims and lowercases before matching", () => {
    expect(validateDesk("  ENERGY  ")).toBe("energy")
  })

  test("returns 'other' for an unrecognized string", () => {
    expect(validateDesk("lifestyle")).toBe("other")
  })

  test("returns 'other' for null", () => {
    expect(validateDesk(null)).toBe("other")
  })

  test("returns 'other' for a number", () => {
    expect(validateDesk(42)).toBe("other")
  })
})

// ---------------------------------------------------------------------------
// Suite 3 — validateContentType
// ---------------------------------------------------------------------------

describe("validateContentType", () => {
  test("returns exact content type for a valid value", () => {
    expect(validateContentType("news-brief")).toBe("news-brief")
  })

  test("trims and lowercases before matching", () => {
    expect(validateContentType("  EXPLAINER  ")).toBe("explainer")
  })

  test("returns 'other' for unrecognized string", () => {
    expect(validateContentType("press-release")).toBe("other")
  })

  test("returns 'other' for undefined", () => {
    expect(validateContentType(undefined)).toBe("other")
  })
})

// ---------------------------------------------------------------------------
// Suite 4 — normalizeTag / normalizeTags
// ---------------------------------------------------------------------------

describe("normalizeTag", () => {
  test("lowercases and trims", () => {
    expect(normalizeTag("  COVID-19  ")).toBe("covid-19")
  })

  test("converts spaces to hyphens", () => {
    expect(normalizeTag("deep state")).toBe("deep-state")
  })

  test("removes special characters", () => {
    expect(normalizeTag("C.I.A.")).toBe("cia")
  })

  test("returns null for empty input", () => {
    expect(normalizeTag("   ")).toBe(null)
  })
})

describe("normalizeTags", () => {
  test("deduplicates tags", () => {
    const result = normalizeTags(["covid", "covid", "vaccines"])
    expect(result).toHaveLength(2)
  })

  test("splits comma-separated values inside a single element", () => {
    const result = normalizeTags(["politics, world, defense"])
    expect(result).toHaveLength(3)
    expect(result).toContain("politics")
    expect(result).toContain("world")
  })

  test("caps output at 12 tags", () => {
    const many = Array.from({ length: 20 }, (_, i) => `tag-${i}`)
    const result = normalizeTags(many)
    expect(result).toHaveLength(12)
  })
})

// ---------------------------------------------------------------------------
// Suite 5 — parseLegacyCategory
// ---------------------------------------------------------------------------

describe("parseLegacyCategory — clean single-desk strings", () => {
  test("'World' maps to desk=world, high confidence", () => {
    const r = parseLegacyCategory("World")
    expect(r.desk).toBe("world")
    expect(r.requiresReview).toBeFalsy()
    expect(r.confidence).toBeGreaterThanOrEqual(0.75)
  })

  test("'Politics' maps to desk=politics", () => {
    const r = parseLegacyCategory("Politics")
    expect(r.desk).toBe("politics")
    expect(r.confidence).toBeGreaterThanOrEqual(0.75)
  })

  test("'Crime' maps to desk=crime", () => {
    const r = parseLegacyCategory("Crime")
    expect(r.desk).toBe("crime")
    expect(r.confidence).toBeGreaterThanOrEqual(0.75)
  })

  test("'Culture' maps to desk=culture", () => {
    const r = parseLegacyCategory("Culture")
    expect(r.desk).toBe("culture")
    expect(r.confidence).toBeGreaterThanOrEqual(0.75)
  })

  test("'Defense' maps to desk=defense", () => {
    const r = parseLegacyCategory("Defense")
    expect(r.desk).toBe("defense")
  })

  test("'Economy' maps to desk=economy", () => {
    const r = parseLegacyCategory("Economy")
    expect(r.desk).toBe("economy")
  })

  test("'Tech' maps to desk=tech", () => {
    const r = parseLegacyCategory("Tech")
    expect(r.desk).toBe("tech")
  })

  test("'Science' maps to desk=science", () => {
    const r = parseLegacyCategory("Science")
    expect(r.desk).toBe("science")
  })

  test("'Energy' maps to desk=energy", () => {
    const r = parseLegacyCategory("Energy")
    expect(r.desk).toBe("energy")
  })
})

describe("parseLegacyCategory — format words become contentType", () => {
  test("'Research Thread' produces contentType=research-thread, not a desk", () => {
    const r = parseLegacyCategory("Research Thread")
    expect(r.contentType).toBe("research-thread")
    // Should not be treated as a desk token
    expect(r.desk).toBe("other")
  })

  test("'Show Notes' produces contentType=show-notes", () => {
    const r = parseLegacyCategory("Show Notes")
    expect(r.contentType).toBe("show-notes")
  })

  test("'Document Drop' produces contentType=document-drop", () => {
    const r = parseLegacyCategory("Document Drop")
    expect(r.contentType).toBe("document-drop")
  })

  test("'Video' produces contentType=video", () => {
    const r = parseLegacyCategory("Video")
    expect(r.contentType).toBe("video")
  })

  test("'Investigation' produces contentType=investigation", () => {
    const r = parseLegacyCategory("Investigation")
    expect(r.contentType).toBe("investigation")
  })
})

describe("parseLegacyCategory — mixed desk + format", () => {
  test("'Politics, Research Thread' → desk=politics, contentType=research-thread", () => {
    const r = parseLegacyCategory("Politics, Research Thread")
    expect(r.desk).toBe("politics")
    expect(r.contentType).toBe("research-thread")
    expect(r.confidence).toBeGreaterThanOrEqual(0.75)
  })

  test("'World, Defense' → desk=world, extra desk becomes tag", () => {
    const r = parseLegacyCategory("World, Defense")
    expect(r.desk).toBe("world")
    expect(r.tags).toContain("defense")
  })

  test("'Crime, Investigation' → desk=crime, contentType=investigation", () => {
    const r = parseLegacyCategory("Crime, Investigation")
    expect(r.desk).toBe("crime")
    expect(r.contentType).toBe("investigation")
  })
})

describe("parseLegacyCategory — ALWAYS_TAG passthrough", () => {
  test("'vaccines' stays as a tag, never becomes a desk", () => {
    const r = parseLegacyCategory("vaccines")
    expect(r.desk).toBe("other")
    expect(r.tags).toContain("vaccines")
    expect(r.requiresReview).toBeTruthy()
  })

  test("'covid' stays as a tag", () => {
    const r = parseLegacyCategory("covid")
    expect(r.tags).toContain("covid")
  })

  test("'Science, covid-19' → desk=science, tag=covid-19", () => {
    const r = parseLegacyCategory("Science, covid-19")
    expect(r.desk).toBe("science")
    expect(r.tags).toContain("covid-19")
    expect(r.confidence).toBeGreaterThanOrEqual(0.75)
  })
})

describe("parseLegacyCategory — empty / null input", () => {
  test("null returns desk=other, requiresReview=true, confidence=0", () => {
    const r = parseLegacyCategory(null)
    expect(r.desk).toBe("other")
    expect(r.requiresReview).toBeTruthy()
    expect(r.confidence).toBe(0)
  })

  test("empty string returns desk=other, requiresReview=true", () => {
    const r = parseLegacyCategory("")
    expect(r.desk).toBe("other")
    expect(r.requiresReview).toBeTruthy()
  })

  test("whitespace-only string is treated as empty", () => {
    const r = parseLegacyCategory("   ")
    expect(r.desk).toBe("other")
    expect(r.requiresReview).toBeTruthy()
  })
})

describe("parseLegacyCategory — confidence & requiresReview thresholds", () => {
  test("clean single-desk match: confidence >= 0.9", () => {
    const r = parseLegacyCategory("Politics")
    expect(r.confidence).toBeGreaterThanOrEqual(0.9)
    expect(r.requiresReview).toBeFalsy()
  })

  test("no desk found: confidence < 0.6 and requiresReview=true", () => {
    const r = parseLegacyCategory("Research Thread")
    expect(r.confidence).toBeLessThan(0.6)
    expect(r.requiresReview).toBeTruthy()
  })

  test("postType hint is used when category has no format word", () => {
    const r = parseLegacyCategory("World", "Show Notes")
    expect(r.contentType).toBe("show-notes")
    expect(r.desk).toBe("world")
  })
})

// ---------------------------------------------------------------------------
// Suite 6 — inferContentTypeFromPostType
// ---------------------------------------------------------------------------

describe("inferContentTypeFromPostType", () => {
  test("'Show Notes' → show-notes", () => {
    expect(inferContentTypeFromPostType("Show Notes")).toBe("show-notes")
  })

  test("'Research Thread' → research-thread", () => {
    expect(inferContentTypeFromPostType("Research Thread")).toBe("research-thread")
  })

  test("'Video Archive' → video", () => {
    expect(inferContentTypeFromPostType("Video Archive")).toBe("video")
  })

  test("'Public Record' → document-drop", () => {
    expect(inferContentTypeFromPostType("Public Record")).toBe("document-drop")
  })

  test("unknown string → other", () => {
    expect(inferContentTypeFromPostType("Misc")).toBe("other")
  })

  test("null → other", () => {
    expect(inferContentTypeFromPostType(null)).toBe("other")
  })
})

// ---------------------------------------------------------------------------
// Suite 7 — legacyCategoryToDesk
// ---------------------------------------------------------------------------

describe("legacyCategoryToDesk", () => {
  test("direct desk slug 'world' → world", () => {
    expect(legacyCategoryToDesk("world")).toBe("world")
  })

  test("synonym 'military' → defense", () => {
    expect(legacyCategoryToDesk("military")).toBe("defense")
  })

  test("synonym 'technology' → tech", () => {
    expect(legacyCategoryToDesk("technology")).toBe("tech")
  })

  test("unrecognized string → other", () => {
    expect(legacyCategoryToDesk("unknown-desk")).toBe("other")
  })

  test("null → other", () => {
    expect(legacyCategoryToDesk(null)).toBe("other")
  })
})

// ---------------------------------------------------------------------------
// Results
// ---------------------------------------------------------------------------

console.log(`\nResults: ${passed} passed, ${failed} failed out of ${passed + failed} tests.\n`)
if (failed > 0) process.exit(1)
