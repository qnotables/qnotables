import { checkRateLimit, containsScriptTags, containsUnsafeHtml, flagBodyAutomatic, hasTooManyEmbeds } from "./forum-spam-guard"

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message)
}

for (const count of [18, 100]) {
  const markdown = Array.from({ length: count }, (_, i) => `[Source ${i}](https://example.com/source/${i})`).join("\n")
  assert(flagBodyAutomatic(markdown) === null, `${count} source links must not trigger moderation`)

  const richText = JSON.stringify({
    type: "doc",
    content: [{
      type: "paragraph",
      content: Array.from({ length: count }, (_, i) => ({
        type: "text",
        text: `Source ${i} `,
        marks: [{ type: "link", attrs: { href: `https://example.com/source/${i}` } }],
      })),
    }],
  })
  assert(flagBodyAutomatic(richText) === null, `${count} rich-text links must not trigger moderation`)
}

assert(containsScriptTags('<script>alert("unsafe")</script>'), "Script detection must remain enabled")
assert(flagBodyAutomatic('<script>alert("unsafe")</script>') !== null, "Scripts must still trigger moderation")
assert(containsUnsafeHtml('<img src="x" onclick="alert(1)">'), "Unsafe HTML detection must remain enabled")
assert(flagBodyAutomatic('<object data="https://example.com"></object>') !== null, "Unsafe HTML must still trigger moderation")

const embeds = JSON.stringify({ type: "doc", content: Array.from({ length: 5 }, () => ({ type: "embedBlock" })) })
assert(!hasTooManyEmbeds(embeds).ok, "The separate embed limit must remain enabled")
assert(flagBodyAutomatic(embeds) !== null, "Too many embeds must still trigger moderation")
assert(checkRateLimit("link-limit-regression", "post", 30_000, 1).allowed, "The first post should be allowed")
assert(!checkRateLimit("link-limit-regression", "post", 30_000, 1).allowed, "Posting rate limits must remain enabled")

console.log("forum-spam-guard tests passed")
