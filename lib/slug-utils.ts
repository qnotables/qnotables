// URL-safe slug generation and utilities
export function generateSlug(title: string): string {
  const slug = title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/--+/g, "-")
    .slice(0, 100)

  // Minimum length validation: slugs must be at least 3 characters
  if (slug.length < 3) {
    throw new Error("Title is too short to generate a meaningful slug (minimum 3 characters after sanitization)")
  }

  return slug
}

export function slugToTitle(slug: string): string {
  return slug
    .split("-")
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ")
}

export function isValidSlug(slug: string): boolean {
  // Must be at least 3 characters, only lowercase letters/numbers and hyphens, no leading/trailing hyphens
  return /^[a-z0-9]([a-z0-9-]{1,}[a-z0-9])?$/.test(slug) && slug.length >= 3
}
