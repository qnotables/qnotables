import assert from "node:assert/strict"
import test from "node:test"
import { classifyStory } from "./story-classifier"

const cases = [
  ["Florida woman charged with murder", "CRIME"],
  ["Supreme Court justices visit Capitol Hill", "POLITICS"],
  ["Lindsey Graham's sister appointed to Senate", "POLITICS"],
  ["Federal judge handles IRS lawsuit", "POLITICS"],
  ["Deputy U.S. marshal fatally shot serving warrant", "CRIME"],
  ["Daylight Saving Time legislation advances", "POLITICS"],
  ["European purchases of Russian liquefied natural gas rise", "ENERGY"],
  ["Military deployment to the Middle East", "DEFENSE"],
  ["Voting-machine audit begins after recount", "ELECTION INTEGRITY"],
  ["AI company releases a new model", "TECH"],
] as const

for (const [headline, expected] of cases) {
  test(headline, () => assert.equal(classifyStory({ headline, description: "Full report and context." }).primaryCategory, expected))
}

test("violent crime overrides border context and keeps a border tag", () => {
  const result = classifyStory({
    headline: "Illegal immigrant involved in fatal incident",
    description: "Police opened a homicide criminal investigation after the border crossing.",
  })
  assert.equal(result.primaryCategory, "CRIME")
  assert.ok(result.secondaryTags.includes("BORDER SECURITY"))
})

test("negative words do not create false desks", () => {
  assert.notEqual(classifyStory({ headline: "Supreme Court post appears online" }).primaryCategory, "TECH")
  assert.notEqual(classifyStory({ headline: "Police security detail at Senate hearing" }).primaryCategory, "DEFENSE")
  assert.notEqual(classifyStory({ headline: "Supreme Court justice charged in current dispute" }).primaryCategory, "ENERGY")
})

test("uncertain stories go to Other and moderation", () => {
  const result = classifyStory({ headline: "Community group announces Tuesday gathering" })
  assert.equal(result.primaryCategory, "OTHER")
  assert.equal(result.reviewStatus, "moderation")
  assert.ok(result.confidence < 65)
})
