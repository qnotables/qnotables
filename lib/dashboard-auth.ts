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

    console.log("[v0] ===== Dashboard Auth Check =====")
    console.log("[v0] Secret Key Configured:", !!secretKey)
    console.log("[v0] Secret Key Value:", secretKey ? secretKey.substring(0, 3) + "..." : "NOT SET")
    console.log("[v0] Cookie Value:", storedKey ? storedKey.substring(0, 3) + "..." : "NOT SET")
    console.log("[v0] Cookies available:", Array.from(cookieStore.getAll() || []).map((c) => c.name))
    
    if (!secretKey) {
      console.error("[v0] CRITICAL: DASHBOARD_SECRET_KEY environment variable not set!")
      return false
    }

    if (!storedKey) {
      console.warn("[v0] No dashboard_key cookie found - user needs to login")
      return false
    }

    const isValid = storedKey === secretKey
    console.log("[v0] Key Match:", isValid)
    console.log("[v0] ===== End Auth Check =====")
    return isValid
  } catch (error) {
    console.error("[v0] Dashboard auth validation error:", error)
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
