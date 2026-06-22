/**
 * Minimal robots.txt checker.
 *
 * Rules:
 * - Default to ALLOWED if robots.txt cannot be fetched
 * - Respect Disallow directives for "qnotables-scraper" and "*"
 * - Cache parsed robots.txt per origin for the lifetime of the module
 * - Allow robots.txt bypass ONLY for explicitly approved origins or exact paths
 */

export const SCRAPER_USER_AGENT = "qnotables-scraper"

export const SCRAPER_FETCH_HEADERS = {
  "User-Agent": `${SCRAPER_USER_AGENT}/1.0 (+https://qnotables.com/bot)`,
  Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
}

interface ParsedRobots {
  disallowed: string[]
}

const robotsCache = new Map<string, ParsedRobots>()

/**
 * Bypass robots.txt for entire origins.
 * Use only for domains you own or have permission to scrape.
 *
 * Must be scheme + host only.
 * No trailing slash.
 */
const HARDCODED_BYPASS_ORIGINS = new Set<string>([
  "https://qnotables.com",
  "https://www.qnotables.com",
])

/**
 * Bypass robots.txt only for specific URLs or path prefixes.
 * This is better when you only need certain feeds/pages.
 */
const HARDCODED_BYPASS_URL_PREFIXES = new Set<string>([
  "https://www.qnotables.com/blog-feed.xml",
  "https://qnotables.com/archives",
  "https://sys.8ch.net/qresearch/tripcode.xml",
  "https://sys.8kun.top/qresearch/tripcode.xml",
])

/**
 * Optional Vercel env var:
 *
 * SCRAPER_ROBOTS_BYPASS_ORIGINS=https://qnotables.ai,https://www.qnotables.ai
 */
const ENV_BYPASS_ORIGINS = new Set(
  (process.env.SCRAPER_ROBOTS_BYPASS_ORIGINS || "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean),
)

/**
 * Optional Vercel env var:
 *
 * SCRAPER_ROBOTS_BYPASS_URL_PREFIXES=https://example.com/feed.xml,https://example.com/archive
 */
const ENV_BYPASS_URL_PREFIXES = new Set(
  (process.env.SCRAPER_ROBOTS_BYPASS_URL_PREFIXES || "")
    .split(",")
    .map((url) => url.trim())
    .filter(Boolean),
)

function normalizeUrlForCompare(url: string): string {
  return url.replace(/\/$/, "")
}

function shouldBypassRobots(url: string): boolean {
  const parsed = new URL(url)
  const origin = parsed.origin

  if (HARDCODED_BYPASS_ORIGINS.has(origin)) return true
  if (ENV_BYPASS_ORIGINS.has(origin)) return true

  const normalizedUrl = normalizeUrlForCompare(url)

  for (const prefix of HARDCODED_BYPASS_URL_PREFIXES) {
    if (normalizedUrl.startsWith(normalizeUrlForCompare(prefix))) {
      return true
    }
  }

  for (const prefix of ENV_BYPASS_URL_PREFIXES) {
    if (normalizedUrl.startsWith(normalizeUrlForCompare(prefix))) {
      return true
    }
  }

  return false
}

function parseRobotsTxt(text: string, targetAgent: string): ParsedRobots {
  const lines = text.split(/\r?\n/)
  const disallowed: string[] = []

  let inRelevantBlock = false
  const target = targetAgent.toLowerCase()

  for (const raw of lines) {
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
 */
export async function isAllowedByRobots(url: string): Promise<boolean> {
  try {
    const parsed = new URL(url)
    const origin = parsed.origin
    const path = parsed.pathname + parsed.search

    if (shouldBypassRobots(url)) {
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
    return true
  }
}