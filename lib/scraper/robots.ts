/**
 * Minimal robots.txt checker.
 * Fetches and parses a site's robots.txt to determine if our user-agent
 * is allowed to crawl a given path.
 *
 * Rules:
 * - Default to ALLOWED if robots.txt cannot be fetched (network error, 404, etc.)
 * - Respect Disallow directives for "qnotables-scraper" and "*" user-agents
 * - Cache parsed robots.txt per origin for the lifetime of the module (per cold start)
 */

export const SCRAPER_USER_AGENT = "qnotables-scraper"
export const SCRAPER_FETCH_HEADERS = {
  "User-Agent": `${SCRAPER_USER_AGENT}/1.0 (+https://qnotables.com/bot)`,
  Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
}

interface ParsedRobots {
  disallowed: string[]
}

// Simple in-process cache (per cold start)
const robotsCache = new Map<string, ParsedRobots>()

function parseRobotsTxt(text: string, targetAgent: string): ParsedRobots {
  const lines = text.split(/\r?\n/)
  const disallowed: string[] = []

  let inRelevantBlock = false

  for (const raw of lines) {
    const line = raw.trim()
    if (!line || line.startsWith("#")) continue

    if (line.toLowerCase().startsWith("user-agent:")) {
      const agent = line.slice("user-agent:".length).trim().toLowerCase()
      inRelevantBlock = agent === "*" || agent === targetAgent.toLowerCase()
    } else if (inRelevantBlock && line.toLowerCase().startsWith("disallow:")) {
      const path = line.slice("disallow:".length).trim()
      if (path) disallowed.push(path)
    }
  }

  return { disallowed }
}

async function getRobotsForOrigin(origin: string): Promise<ParsedRobots> {
  if (robotsCache.has(origin)) {
    return robotsCache.get(origin)!
  }

  const robotsUrl = `${origin}/robots.txt`
  try {
    const res = await fetch(robotsUrl, {
      headers: { "User-Agent": SCRAPER_FETCH_HEADERS["User-Agent"] },
      signal: AbortSignal.timeout(5_000),
    })

    if (!res.ok) {
      // 404 or any non-2xx → treat as no restrictions
      const parsed: ParsedRobots = { disallowed: [] }
      robotsCache.set(origin, parsed)
      return parsed
    }

    const text = await res.text()
    const parsed = parseRobotsTxt(text, SCRAPER_USER_AGENT)
    robotsCache.set(origin, parsed)
    return parsed
  } catch {
    // Network error → assume allowed
    const parsed: ParsedRobots = { disallowed: [] }
    robotsCache.set(origin, parsed)
    return parsed
  }
}

/**
 * Returns true if the scraper is allowed to fetch `url` per robots.txt.
 */
export async function isAllowedByRobots(url: string): Promise<boolean> {
  try {
    const parsed = new URL(url)
    const origin = parsed.origin
    const path = parsed.pathname + parsed.search

    const robots = await getRobotsForOrigin(origin)

    for (const rule of robots.disallowed) {
      if (path.startsWith(rule)) return false
    }

    return true
  } catch {
    return true // Malformed URL → don't crash, just allow and let the fetch fail
  }
}
