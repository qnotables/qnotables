export function normalizeEmbedVideoUrl(value: string): string | null {
  const trimmed = value.trim()
  if (!trimmed) return null
  if (trimmed.length > 2048) throw new Error("Video URL must be 2048 characters or fewer.")

  try {
    const url = new URL(trimmed)
    if (!["http:", "https:"].includes(url.protocol) || url.username || url.password) throw new Error()
    return url.href
  } catch {
    throw new Error("Enter a valid HTTP or HTTPS video URL, or leave it blank.")
  }
}
