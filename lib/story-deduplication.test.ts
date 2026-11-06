import { deduplicateStories } from "./story-deduplication"

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message)
}

const original = { id: "politics-1", headline: "Today's hearing: New findings", url: "https://www.example.com/news/hearing/" }
const copies = [
  original,
  { id: "latest-1", headline: "An updated headline", url: "http://example.com/news/hearing?utm_source=rss&fbclid=123#story" },
  { id: "national-1", headline: "TODAY’S HEARING — new findings!", url: "https://other.example/story" },
  { id: "politics-1", headline: "Another title", url: "https://example.com/another" },
]
const unique = deduplicateStories(copies)
assert(unique.length === 1 && unique[0] === original, "Overlapping feeds must keep the first story and preserve its metadata")
assert(copies.length === 4, "Deduplication must not mutate the feed")

const distinct = deduplicateStories([
  { id: "1", headline: "Hearing starts today", url: "https://example.com/article?id=1" },
  { id: "2", headline: "Hearing concludes with a vote", url: "https://example.com/article?id=2" },
])
assert(distinct.length === 2, "Different article IDs and follow-up headlines must remain separate")

assert(deduplicateStories([
  { id: "1", headline: "First report", url: "https://example.com/story?b=2&a=1" },
  { id: "2", headline: "Renamed report", url: "https://example.com/story?a=1&b=2&utm_medium=feed" },
]).length === 1, "Query order and tracking parameters must not create duplicates")

assert(deduplicateStories([
  { id: "1", headline: "A &amp; B announce findings" },
  { id: "2", headline: "A & B announce findings" },
]).length === 1, "HTML entities must normalize consistently")

assert(deduplicateStories([
  { id: "1", headline: "First independent report", url: "invalid" },
  { id: "2", headline: "Second independent report", url: "invalid" },
  { id: "3", headline: "Third independent report" },
]).length === 3, "Missing and invalid URLs must not collapse unrelated reports")

const blog = { id: "blog", headline: original.headline, url: "https://qnotables.com/blog/hearing" }
const rss = deduplicateStories([blog, ...copies]).slice(1)
assert(rss.length === 0, "A featured blog story must not reappear in top stories, the wire, or trending")
assert(deduplicateStories([]).length === 0, "Empty feeds must stay empty")
console.log("story-deduplication tests passed")
