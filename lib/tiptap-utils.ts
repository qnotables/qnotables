/**
 * Shared Tiptap utilities — no "use client" directive so these can be
 * imported from both Server Components and Client Components.
 */

/**
 * Detect whether a string is a Tiptap JSON doc (vs. legacy Markdown).
 */
export function isTiptapJson(content: string): boolean {
  if (!content || typeof content !== "string") return false
  try {
    const parsed = JSON.parse(content.trim())
    return parsed?.type === "doc"
  } catch {
    return false
  }
}
