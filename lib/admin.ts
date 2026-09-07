import { createClient } from "@/lib/supabase/server"
import { validateDashboardAccess } from "@/lib/dashboard-auth"

/** Parse the ADMIN_EMAILS allowlist (comma-separated) into a lowercased set. */
function adminEmailSet(): Set<string> {
  return new Set(
    (process.env.ADMIN_EMAILS ?? "")
      .split(",")
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean),
  )
}

export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false
  return adminEmailSet().has(email.toLowerCase())
}

/**
 * Returns the signed-in user if they are an admin, otherwise null.
 * Use in server components / server actions to gate blog authoring.
 */
export async function getAdminUser() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null
  // Dashboard secret-key holders are full admins even when their email is not
  // listed in ADMIN_EMAILS. This matches the dashboard layout's admin role.
  if (isAdminEmail(user.email) || (await validateDashboardAccess())) return user
  return null
}

/**
 * Check if a user is admin or moderator (for client-side display).
 * Returns true if user is admin (in ADMIN_EMAILS allowlist).
 */
export async function checkAdminAccess(): Promise<boolean> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return false
  return isAdminEmail(user.email) || (await validateDashboardAccess())
}
