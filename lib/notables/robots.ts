/**
 * Robots.txt compliance for the Notables scraper.
 * Default-allows if robots.txt cannot be fetched.
 */

export const NOTABLES_USER_AGENT = "qnotables-scraper"

export const NOTABLES_FETCH_HEADERS: Record<string, string> = {
  "User-Agent": "qnotables-scraper/1.0 (+https://www.qnotables.ai/bot)",
  Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  "Accept-Language": "en-US,en;q=0.5",
}

interface ParsedRobots {
  disallowed: string[]
}

// Module-level cache (warm for the lifetime of the Lambda invocation)
const robotsCache = new Map<string, ParsedRobots>()

// 8kun public feeds/pages we are allowed to scrape
const BYPASS_URL_PREFIXES = new Set<string>([
  "https://8ch.net/qresearch/tripcode.xml",
  "https://8ch.net/qnotables/tripcode.xml",
  "https://8ch.net/qresearch/res/",
  "https://8kun.top/qresearch/tripcode.xml",
  "https://8kun.top/qnotables/tripcode.xml",
  "https://8kun.top/qresearch/res/",
])

function normalise(url: string) {
  return url.replace(/\/$/, "")
}

function bypass(url: string): boolean {
  const n = normalise(url)
  for (const prefix of BYPASS_URL_PREFIXES) {
    if (n.startsWith(normalise(prefix))) return true
  }
  return false
}

function parseRobotsTxt(text: string): ParsedRobots {
  const lines = text.split(/\r?\n/)
  const disallowed: string[] = []
  let inBlock = false

  for (const raw of lines) {
    const line = raw.split("#")[0]?.trim()
    if (!line) continue
    const lower = line.toLowerCase()

    if (lower.startsWith("user-agent:")) {
      const agent = line.slice("user-agent:".length).trim().toLowerCase()
      inBlock = agent === "*" || agent === NOTABLES_USER_AGENT
      continue
    }

    if (inBlock && lower.startsWith("disallow:")) {
      const path = line.slice("disallow:".length).trim()
      if (path) disallowed.push(path)
    }
  }

  return { disallowed }
}

async function getRobots(origin: string): Promise<ParsedRobots> {
  if (robotsCache.has(origin)) return robotsCache.get(origin)!

  try {
    const res = await fetch(`${origin}/robots.txt`, {
      headers: { "User-Agent": NOTABLES_FETCH_HEADERS["User-Agent"] },
      signal: AbortSignal.timeout(5_000),
    })
    if (!res.ok) {
      const empty: ParsedRobots = { disallowed: [] }
      robotsCache.set(origin, empty)
      return empty
    }
    const parsed = parseRobotsTxt(await res.text())
    robotsCache.set(origin, parsed)
    return parsed
  } catch {
    const empty: ParsedRobots = { disallowed: [] }
    robotsCache.set(origin, empty)
    return empty
  }
}

export async function isAllowedByRobots(url: string): Promise<boolean> {
  try {
    if (bypass(url)) return true

    const parsed = new URL(url)
    const robots = await getRobots(parsed.origin)
    const path = parsed.pathname + parsed.search

    for (const rule of robots.disallowed) {
      if (path.startsWith(rule)) return false
    }
    return true
  } catch {
    return true
  }
}
