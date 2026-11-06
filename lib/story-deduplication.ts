type StoryIdentity = { id: string; headline: string; url?: string }

function articleUrlKey(value?: string): string {
  if (!value) return ""
  try {
    const url = new URL(value)
    if (url.protocol !== "http:" && url.protocol !== "https:") return ""
    url.hash = ""
    for (const key of Array.from(url.searchParams.keys())) {
      if (/^(utm_.+|fbclid|gclid|dclid|msclkid|mc_cid|mc_eid|_ga|_gl)$/i.test(key)) {
        url.searchParams.delete(key)
      }
    }
    url.searchParams.sort()
    return `${url.host.toLowerCase().replace(/^www\./, "")}${url.pathname.replace(/\/+$/, "")}${url.search}`
  } catch {
    return ""
  }
}

function headlineKey(value: string): string {
  return value
    .normalize("NFKC")
    .toLowerCase()
    .replace(/&amp;/g, "&")
    .replace(/['’‘]/g, "")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim()
}

export function deduplicateStories<T extends StoryIdentity>(stories: readonly T[]): T[] {
  const seenIds = new Set<string>()
  const seenUrls = new Set<string>()
  const seenHeadlines = new Set<string>()

  return stories.filter((story) => {
    const url = articleUrlKey(story.url)
    const headline = headlineKey(story.headline)
    const duplicate = seenIds.has(story.id)
      || Boolean(url && seenUrls.has(url))
      || Boolean(headline && seenHeadlines.has(headline))

    seenIds.add(story.id)
    if (url) seenUrls.add(url)
    if (headline) seenHeadlines.add(headline)
    return !duplicate
  })
}
