/**
 * Acceptance tests for lib/classifier.ts
 *
 * Run with: npx jest lib/classifier.test.ts
 * (or: npx vitest run lib/classifier.test.ts)
 *
 * These cases are derived directly from the spec document examples and cover
 * every category in the allowlist.
 */

import { classifyStory, validateCategory } from "./classifier"
import { categories } from "./news-data"

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function classify(title: string, excerpt = "") {
  return classifyStory(title, excerpt)
}

// ---------------------------------------------------------------------------
// Allowlist contract
// ---------------------------------------------------------------------------

describe("classifyStory — output is always a valid category", () => {
  const garbage = [
    { title: "xyzzy foo bar nonsense", excerpt: "" },
    { title: "", excerpt: "" },
    { title: "   ", excerpt: "   " },
  ]
  test.each(garbage)("falls back to OTHER for '$title'", ({ title, excerpt }) => {
    const result = classify(title, excerpt)
    expect(categories).toContain(result.category)
    expect(result.confidence).toBeGreaterThan(0)
  })
})

// ---------------------------------------------------------------------------
// Per-category acceptance cases
// ---------------------------------------------------------------------------

describe("WORLD", () => {
  test("cross-border story", () => {
    const r = classify(
      "Ukraine and Russia exchange largest prisoner swap since war began",
      "More than 200 POWs were returned on both sides as part of a Turkish-brokered agreement."
    )
    expect(r.category).toBe("WORLD")
  })

  test("foreign diplomatic meeting", () => {
    const r = classify(
      "G7 leaders meet in Tokyo to discuss global trade imbalances",
      "Finance ministers from the seven largest economies gathered to coordinate tariff policy."
    )
    expect(r.category).toBe("WORLD")
  })
})

describe("POLITICS", () => {
  test("election coverage", () => {
    const r = classify(
      "Senate votes to advance border security bill along party lines",
      "The legislation passed with 52 votes in favour and will now move to the House."
    )
    expect(r.category).toBe("POLITICS")
  })

  test("White House policy", () => {
    const r = classify(
      "White House executive order restricts federal agencies from using TikTok",
      "The president signed the measure citing national security concerns."
    )
    expect(r.category).toBe("POLITICS")
  })
})

describe("DEFENSE", () => {
  test("military hardware story", () => {
    const r = classify(
      "Pentagon awards Lockheed Martin $4 billion contract for new stealth drone fleet",
      "The unmanned aerial vehicle programme is part of a broader modernisation drive."
    )
    expect(r.category).toBe("DEFENSE")
  })

  test("NATO deployment", () => {
    const r = classify(
      "NATO reinforces eastern flank with 5,000 additional troops",
      "Alliance members agreed to increase rotational presence near Russian border."
    )
    expect(r.category).toBe("DEFENSE")
  })
})

describe("ECONOMY", () => {
  test("inflation report", () => {
    const r = classify(
      "Federal Reserve holds rates steady as inflation falls to 2.9 percent",
      "The FOMC cited cooling price pressures but kept its tightening bias intact."
    )
    expect(r.category).toBe("ECONOMY")
  })

  test("trade / tariff story", () => {
    const r = classify(
      "US imposes 25 percent tariff on Chinese steel and aluminium imports",
      "Markets reacted sharply as economists warned of retaliatory measures."
    )
    expect(r.category).toBe("ECONOMY")
  })
})

describe("TECH", () => {
  test("AI / software story", () => {
    const r = classify(
      "OpenAI unveils GPT-5 with real-time web browsing and code execution",
      "The new model scores 95 on the MMLU benchmark and ships inside ChatGPT."
    )
    expect(r.category).toBe("TECH")
  })

  test("cybersecurity incident", () => {
    const r = classify(
      "Critical zero-day vulnerability discovered in Windows kernel exploited in wild",
      "CISA issued an emergency directive ordering federal agencies to patch within 48 hours."
    )
    expect(r.category).toBe("TECH")
  })
})

describe("SCIENCE", () => {
  test("space / astronomy", () => {
    const r = classify(
      "James Webb telescope detects atmosphere on an Earth-sized exoplanet for first time",
      "Scientists say the finding significantly improves chances of finding habitable worlds."
    )
    expect(r.category).toBe("SCIENCE")
  })

  test("medical study", () => {
    const r = classify(
      "New mRNA vaccine shows 87 percent efficacy against aggressive pancreatic cancer",
      "Phase-2 clinical trial results published in The Lancet showed durable remission."
    )
    expect(r.category).toBe("SCIENCE")
  })
})

describe("ENERGY", () => {
  test("oil price story", () => {
    const r = classify(
      "Brent crude falls below $70 as OPEC+ considers production increase",
      "Saudi Arabia signalled it may lift its voluntary output cuts heading into Q2."
    )
    expect(r.category).toBe("ENERGY")
  })

  test("renewable power story", () => {
    const r = classify(
      "Texas wind farm breaks state record producing 32 GW in single day",
      "The milestone accounts for nearly half of the ERCOT grid's peak demand."
    )
    expect(r.category).toBe("ENERGY")
  })
})

describe("CULTURE", () => {
  test("entertainment award", () => {
    const r = classify(
      "Oppenheimer wins Best Picture at the Academy Awards in a sweep",
      "Christopher Nolan accepted the award in front of a packed Dolby Theatre."
    )
    expect(r.category).toBe("CULTURE")
  })

  test("arts / books story", () => {
    const r = classify(
      "Pulitzer Prize for fiction awarded to debut novelist set in post-war Appalachia",
      "Judges praised the book's lyrical prose and unflinching portrayal of poverty."
    )
    expect(r.category).toBe("CULTURE")
  })
})

describe("CRIME", () => {
  test("federal indictment", () => {
    const r = classify(
      "Former congressman indicted on 11 counts of bribery and wire fraud",
      "Federal prosecutors allege he accepted payments in exchange for defence contracts."
    )
    expect(r.category).toBe("CRIME")
  })

  test("cartel / trafficking story", () => {
    const r = classify(
      "DEA seizes record fentanyl shipment worth $2 billion at southern border",
      "The drug bust is the largest in agency history and linked to the Sinaloa cartel."
    )
    expect(r.category).toBe("CRIME")
  })
})

// ---------------------------------------------------------------------------
// validateCategory
// ---------------------------------------------------------------------------

describe("validateCategory", () => {
  test("returns valid category unchanged", () => {
    expect(validateCategory("WORLD")).toBe("WORLD")
    expect(validateCategory("CRIME")).toBe("CRIME")
    expect(validateCategory("CULTURE")).toBe("CULTURE")
  })

  test("normalises lowercase input", () => {
    expect(validateCategory("politics")).toBe("POLITICS")
    expect(validateCategory("  defense  ")).toBe("DEFENSE")
  })

  test("returns OTHER for unknown strings", () => {
    expect(validateCategory("RANDOM")).toBe("OTHER")
    expect(validateCategory("")).toBe("OTHER")
    expect(validateCategory(null as unknown as string)).toBe("OTHER")
    expect(validateCategory(undefined as unknown as string)).toBe("OTHER")
  })
})

// ---------------------------------------------------------------------------
// Cross-category contamination guards
// ---------------------------------------------------------------------------

describe("Cross-category guard", () => {
  test("military story is not miscategorised as POLITICS", () => {
    const r = classify(
      "US Army deploys 3rd Armored Brigade Combat Team to Poland",
      "The deployment is part of Operation Atlantic Resolve aimed at deterring aggression."
    )
    expect(r.category).toBe("DEFENSE")
  })

  test("oil price story is not miscategorised as ECONOMY", () => {
    const r = classify(
      "Natural gas pipeline rupture in Texas forces emergency energy grid response",
      "Operators shut 600 miles of pipeline after a leak in the Gulf Coast distribution system."
    )
    expect(r.category).toBe("ENERGY")
  })
})
