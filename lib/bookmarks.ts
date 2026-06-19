/**
 * Validate if a URL is a valid HTTP/HTTPS URL
 */
export function isValidUrl(url: string): boolean {
  try {
    const parsedUrl = new URL(url)
    return parsedUrl.protocol === "http:" || parsedUrl.protocol === "https:"
  } catch {
    return false
  }
}

/**
 * Group bookmarks by category
 */
export function groupBookmarksByCategory(bookmarks: any[]): Record<string, any[]> {
  const grouped: Record<string, any[]> = {}

  for (const bookmark of bookmarks) {
    const category = bookmark.category || "Uncategorized"
    if (!grouped[category]) {
      grouped[category] = []
    }
    grouped[category].push(bookmark)
  }

  return grouped
}

/**
 * Get category color for badge styling
 */
export function getCategoryColor(category: string): string {
  const colors: Record<string, string> = {
    Business: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    Resource: "bg-green-500/20 text-green-400 border-green-500/30",
    Tool: "bg-purple-500/20 text-purple-400 border-purple-500/30",
    Service: "bg-amber-500/20 text-amber-400 border-amber-500/30",
    Community: "bg-pink-500/20 text-pink-400 border-pink-500/30",
    Education: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
    News: "bg-red-500/20 text-red-400 border-red-500/30",
  }

  return colors[category] || "bg-muted text-muted-foreground border-border"
}

/**
 * Format date to relative time string
 */
export function formatBookmarkTime(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000)

  if (seconds < 60) return "just now"
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`

  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
}

/**
 * Extract domain from URL for display
 */
export function getDomainFromUrl(url: string): string {
  try {
    const parsed = new URL(url)
    return parsed.hostname || url
  } catch {
    return url
  }
}
