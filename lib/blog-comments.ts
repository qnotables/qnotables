/**
 * Blog Comments Library
 * Utilities for organizing and displaying nested comments
 */

import { BlogComment } from "@/app/actions/blog-comment-actions"

/**
 * Group comments into parent-child relationships
 */
export function buildCommentTree(comments: BlogComment[]): BlogComment[] {
  // Filter only top-level comments (no parent)
  return comments.filter(c => !c.parent_comment_id && !c.is_deleted)
}

/**
 * Get child comments (replies) for a parent comment
 */
export function getChildComments(parentId: string, comments: BlogComment[]): BlogComment[] {
  return comments.filter(c => c.parent_comment_id === parentId && !c.is_deleted)
}

/**
 * Format relative time (e.g., "2 hours ago")
 */
export function formatRelativeTime(dateString: string): string {
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
 * Check if comment is recent (less than 5 minutes old)
 */
export function isRecentComment(dateString: string): boolean {
  const date = new Date(dateString)
  const now = new Date()
  const minutes = Math.floor((now.getTime() - date.getTime()) / 60000)
  return minutes < 5
}

/**
 * Sanitize comment text (basic HTML escaping)
 */
export function sanitizeCommentText(text: string): string {
  const div = document.createElement("div")
  div.textContent = text
  return div.innerHTML
}
