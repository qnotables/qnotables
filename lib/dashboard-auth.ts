import { cookies } from "next/headers"

/**
 * Validates dashboard access using a secret key stored in an HTTP-only cookie.
 * The key is compared against the DASHBOARD_SECRET_KEY environment variable.
 */
export async function validateDashboardAccess(): Promise<boolean> {
  try {
    const cookieStore = await cookies()
    const storedKey = cookieStore.get("dashboard_key")?.value
    const secretKey = process.env.DASHBOARD_SECRET_KEY

    if (!secretKey) {
      console.error("[v0] DASHBOARD_SECRET_KEY environment variable not set")
      return false
    }
    if (!storedKey) return false

    return storedKey === secretKey
  } catch (error) {
    console.error("[v0] Dashboard auth validation error:", error)
    return false
  }
}

/**
 * Get the secret key from environment (for comparison). Server-side only.
 */
export function getDashboardSecretKey(): string | undefined {
  return process.env.DASHBOARD_SECRET_KEY
}
