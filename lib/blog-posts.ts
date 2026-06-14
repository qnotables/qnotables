export interface BlogPost {
  slug: string
  title: string
  excerpt: string
  author: string
  date: string // ISO
  readMinutes: number
  tag: string
  content: string // markdown
}

export const blogPosts: BlogPost[] = [
  {
    slug: "how-we-rank-the-wire",
    title: "How We Rank The Wire",
    excerpt:
      "A look under the hood at the signals we weigh when ordering headlines across the desks — recency, source spread, and corroboration.",
    author: "Editorial Command",
    date: "2026-06-10",
    readMinutes: 6,
    tag: "Methodology",
    content: `## The short version

Every headline that crosses **The Wire** is scored before it is placed. We are not trying to tell you what to think — we are trying to surface what the most credible sources are reporting, fastest, with the least noise.

## The signals we weigh

1. **Recency.** A report's age is the strongest single factor. Fresh dispatches rise; stale ones decay on a curve.
2. **Source spread.** When multiple independent outlets file the same story, confidence climbs. A lone report is flagged, not buried.
3. **Desk relevance.** Each item is routed to a desk based on its own category tags, with a keyword fallback.

> We would rather show you a corroborated story ten minutes late than an unverified one ten minutes early.

## What we deliberately avoid

- No engagement-bait ranking. Outrage does not move a story up.
- No hidden editorializing in the sort order.
- No rehosting of full articles — every card links back to the original publisher.

## What's next

We are working on real cross-source corroboration counts, so the "most reported" panel reflects genuine overlap rather than a synthesized estimate. More on that soon.`,
  },
  {
    slug: "reading-a-feed-critically",
    title: "Reading A Feed Critically",
    excerpt:
      "An aggregator is only as good as the reader operating it. A field guide to spotting thin sourcing, recycled wire copy, and missing context.",
    author: "Standards Desk",
    date: "2026-06-04",
    readMinutes: 8,
    tag: "Media Literacy",
    content: `## Start with the source, not the headline

A headline is an advertisement for a story. Before you react, look at **who** filed it and **when**. A single outlet running a dramatic claim that no one else has touched is a reason to wait, not to share.

## Three questions for every story

- **Who is reporting this, and what do they have access to?**
- **Is anyone else corroborating it independently?**
- **What is the story *not* telling me?**

## Recycled wire copy

Much of what looks like many outlets reporting a story is actually one wire service syndicated everywhere. That is not corroboration — it is duplication. We try to collapse those into a single entry, but the habit of checking is yours to keep.

## Context is a feature, not a delay

The fastest possible take is rarely the most useful one. A few minutes of context — a prior event, a base rate, a definition — changes how a story should land. Slow down by exactly that much.`,
  },
  {
    slug: "building-an-open-newsroom",
    title: "Building An Open Newsroom",
    excerpt:
      "Why we pair the feed with a public forum — and the ground rules that keep the conversation useful instead of toxic.",
    author: "Community Desk",
    date: "2026-05-28",
    readMinutes: 5,
    tag: "Community",
    content: `## The feed is one direction. The forum is the other.

A wire feed talks *at* you. The forum lets the readers talk *back* — to us and to each other. Both are better when they sit side by side.

## Ground rules

1. **Argue the claim, not the person.**
2. **Bring a source when you bring a correction.**
3. **Assume the other operator is acting in good faith until proven otherwise.**

## Moderation philosophy

We moderate for *signal*, not for agreement. You can be completely wrong and still be welcome, as long as you are arguing honestly and citing your reasoning. What gets removed is harassment, spam, and bad-faith manipulation.

## Get involved

Create an account, start a thread, and tell us what we are missing. The best corrections we have ever run started as a forum post.`,
  },
]

export function getPost(slug: string): BlogPost | undefined {
  return blogPosts.find((p) => p.slug === slug)
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  })
}
