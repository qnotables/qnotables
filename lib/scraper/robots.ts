//**
 * Minimal robots.txt checker.
 *
 * Rules:
 * - Default to ALLOWED if robots.txt cannot be fetched
 * - Respect Disallow directives for "qnotables-scraper" and "*"
 * - Cache parsed robots.txt per origin for the lifetime of the module
 * - Allow robots.txt bypass ONLY for explicitly approved origins
 */

export const SCRAPER_USER_AGENT = "qnotables-scraper"

export const SCRAPER_FETCH_HEADERS = {
  "User-Agent": `${SCRAPER_USER_AGENT}/1.0 (+https://qnotables.com/bot)`,
  Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
}

interface ParsedRobots {
  disallowed: string[]
}

// Simple in-process cache per cold start
const robotsCache = new Map<string, ParsedRobots>()

/**
 * Add only domains you own or have permission to scrape.
 *
 * In Vercel, add this environment variable:
 *
 * SCRAPER_ROBOTS_BYPASS_ORIGINS=https://qnotables.ai,https://www.qnotables.ai
 */
const ROBOTS_BYPASS_ORIGINS = new Set(
  (process.env.SCRAPER_ROBOTS_BYPASS_ORIGINS || "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean),
)

function shouldBypassRobots(origin: string): boolean {
  return ROBOTS_BYPASS_ORIGINS.has(origin)
}

function parseRobotsTxt(text: string, targetAgent: string): ParsedRobots {
  const lines = text.split(/\r?\n/)
  const disallowed: string[] = []

  let inRelevantBlock = false
  const target = targetAgent.toLowerCase()

  for (const raw of lines) {
    // Remove inline comments
    const line = raw.split("#")[0]?.trim()
    if (!line) continue

    const lower = line.toLowerCase()

    if (lower.startsWith("user-agent:")) {
      const agent = line.slice("user-agent:".length).trim().toLowerCase()

      inRelevantBlock = agent === "*" || agent === target
      continue
    }

    if (inRelevantBlock && lower.startsWith("disallow:")) {
      const path = line.slice("disallow:".length).trim()

      // Empty Disallow means allowed
      if (path) {
        disallowed.push(path)
      }
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
      headers: {
        "User-Agent": SCRAPER_FETCH_HEADERS["User-Agent"],
      },
      signal: AbortSignal.timeout(5_000),
    })

    if (!res.ok) {
      const parsed: ParsedRobots = { disallowed: [] }
      robotsCache.set(origin, parsed)
      return parsed
    }

    const text = await res.text()
    const parsed = parseRobotsTxt(text, SCRAPER_USER_AGENT)

    robotsCache.set(origin, parsed)
    return parsed
  } catch {
    const parsed: ParsedRobots = { disallowed: [] }
    robotsCache.set(origin, parsed)
    return parsed
  }
}

/**
 * Returns true if the scraper is allowed to fetch `url`.
 *
 * Robots.txt is bypassed only for origins listed in:
 * SCRAPER_ROBOTS_BYPASS_ORIGINS
 */
export async function isAllowedByRobots(url: string): Promise<boolean> {
  try {
    const parsed = new URL(url)
    const origin = parsed.origin
    const path = parsed.pathname + parsed.search

    // Explicit approved bypass
    if (shouldBypassRobots(origin)) {
      return true
    }

    const robots = await getRobotsForOrigin(origin)

    for (const rule of robots.disallowed) {
      if (path.startsWith(rule)) {
        return false
      }
    }

    return true
  } catch {
    // Malformed URL should not crash the scraper
    return true
  }
}