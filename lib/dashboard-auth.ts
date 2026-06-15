import { cookies } from "next/headers"

/**
 * Validates dashboard access using secret key from environment variable.
 * Returns true if valid key is provided via cookie or query param.
 */
export async function validateDashboardAccess(): Promise<boolean> {
  try {
    const cookieStore = await cookies()
    const storedKey = cookieStore.get("dashboard_key")?.value

    const secretKey = process.env.DASHBOARD_SECRET_KEY
    console.log("[v0] validateDashboardAccess - Secret configured:", !!secretKey)
    console.log("[v0] validateDashboardAccess - Cookie value:", storedKey ? "***" : "not set")
    
    if (!secretKey) {
      console.error("[v0] DASHBOARD_SECRET_KEY not configured")
      return false
    }

    const isValid = storedKey === secretKey
    console.log("[v0] validateDashboardAccess result:", isValid)
    return isValid
  } catch (error) {
    console.error("[v0] validateDashboardAccess error:", error)
    return false
  }
}

/**
 * Get the secret key from environment (for comparison).
 * Use only server-side.
 */
export function getDashboardSecretKey(): string | undefined {
  return process.env.DASHBOARD_SECRET_KEY
}
