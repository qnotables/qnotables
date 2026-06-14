import { createClient } from "@/lib/supabase/server"

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
  if (!user || !isAdminEmail(user.email)) return null
  return user
}
