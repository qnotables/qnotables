import { cookies } from "next/headers"

/**
 * Validates dashboard access using secret key from environment variable.
 * Returns true if valid key is provided via cookie or query param.
 */
export async function validateDashboardAccess(): Promise<boolean> {
  const cookieStore = await cookies()
  const storedKey = cookieStore.get("dashboard_key")?.value

  const secretKey = process.env.DASHBOARD_SECRET_KEY
  if (!secretKey) {
    console.error("[v0] DASHBOARD_SECRET_KEY not configured")
    return false
  }

  return storedKey === secretKey
}

/**
 * Get the secret key from environment (for comparison).
 * Use only server-side.
 */
export function getDashboardSecretKey(): string | undefined {
  return process.env.DASHBOARD_SECRET_KEY
}
