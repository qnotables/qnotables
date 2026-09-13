import {
  compactSearchText,
  createSearchQuery,
  extractSearchText,
  getHighlightSegments,
  normalizeComparableText,
  searchTextMatches,
} from "./search-utils"

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message)
}

function assertEquivalent(values: string[], text: string): void {
  for (const value of values) {
    assert(searchTextMatches(value, text), `${value} should match ${text}`)
  }
}

assertEquivalent(["911", "9/11", "9-11", "9 11"], "The September 11 record")
assertEquivalent(["US", "U.S.", "United States", "USA"], "United States foreign policy")
assertEquivalent(["Bab al-Mandab", "Bab al Mandab"], "Ships crossed the Bab al-Mandab strait")
assertEquivalent(["O'Brien", "OBrien"], "O’Brien reported the finding")
assertEquivalent(["COVID-19", "COVID19"], "COVID-19 response")
assertEquivalent(["Houthi", "Houthis", "#Houthi"], "#Houthi forces issued a statement")

assert(!searchTextMatches("911", "1911"), "911 must not match the middle of 1911")
assert(!searchTextMatches("", "anything"), "empty queries must not match")
assert(!searchTextMatches("!!!", "anything"), "punctuation-only queries must not match")
assert(createSearchQuery("x".repeat(500)).raw.length === 160, "queries must be bounded")
assert(normalizeComparableText("Café — O’Brien") === "cafe obrien", "accent and punctuation folding should be stable")
assert(compactSearchText("9/11") === "911", "compact normalization should remove separators")
assert(searchTextMatches("select * from users --", "select from users"), "SQL-like input should be treated as text")

const highlighted = getHighlightSegments("The 9/11 record", "911")
assert(highlighted.some((part) => part.match && part.text === "9/11"), "variant matches should highlight original text")

const richText = extractSearchText('<p>Record <strong>with</strong> markup</p>')
assert(richText === "Record with markup", "HTML should be stripped from searchable text")
const tiptap = extractSearchText(JSON.stringify({ type: "doc", content: [{ type: "paragraph", content: [{ type: "text", text: "A field note" }] }] }))
assert(tiptap === "A field note", "Tiptap JSON should become readable text")

console.log("search-utils tests passed")
