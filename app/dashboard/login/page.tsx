"use client"

import { useRouter } from "next/navigation"
import { Suspense, useEffect, useState } from "react"
import { Lock } from "lucide-react"

// Mark as dynamic since this is a client component with hooks
export const dynamic = "force-dynamic"

function DashboardLoginContent() {
  const router = useRouter()
  const [key, setKey] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  // If key is in URL, try to use it
  useEffect(() => {
    const urlKey = new URLSearchParams(window.location.search).get("key")
    if (urlKey) {
      setKey(urlKey)
      handleLogin(urlKey)
    }
  }, [])

  const handleLogin = async (keyToUse: string = key) => {
    if (!keyToUse.trim()) {
      setError("Please enter your secret key")
      return
    }

    setLoading(true)
    setError("")
    console.log("[v0] Attempting login with key:", keyToUse ? "***" : "empty")

    try {
      const res = await fetch("/api/dashboard/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: keyToUse }),
      })

      const data = await res.json()
      console.log("[v0] Auth response status:", res.status)
      console.log("[v0] Auth response:", data)

      if (!res.ok) {
        console.error("[v0] Auth failed:", data.error)
        setError(data.error || "Invalid key")
        setLoading(false)
        return
      }

      console.log("[v0] Auth successful, redirecting to dashboard")
      // Redirect to dashboard
      router.push("/dashboard")
    } catch (err) {
      console.error("[v0] Login error:", err)
      setError("An error occurred")
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md">
        <div className="border border-border bg-card p-8">
          <div className="mb-6 flex items-center justify-center gap-2">
            <Lock className="h-6 w-6 text-primary" />
            <h1 className="stencil text-2xl text-foreground">Dashboard Access</h1>
          </div>

          <p className="label-mono mb-6 text-center text-muted-foreground">
            Enter your secret key to access the admin dashboard
          </p>

          <form
            onSubmit={(e) => {
              e.preventDefault()
              handleLogin()
            }}
            className="space-y-4"
          >
            <div>
              <label className="label-mono block text-sm font-medium text-foreground">
                Secret Key
              </label>
              <input
                type="password"
                value={key}
                onChange={(e) => {
                  setKey(e.target.value)
                  setError("")
                }}
                placeholder="Enter your dashboard secret key"
                className="label-mono mt-2 w-full border border-border bg-background px-3 py-2 text-foreground placeholder-muted-foreground focus:border-primary focus:outline-none"
                disabled={loading}
              />
            </div>

            {error && (
              <div className="border border-red-500/50 bg-red-500/10 px-3 py-2">
                <p className="label-mono text-sm text-red-600">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="label-mono w-full bg-primary py-2 font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {loading ? "Verifying..." : "Access Dashboard"}
            </button>
          </form>

          <p className="label-mono mt-6 text-center text-xs text-muted-foreground">
            Contact your administrator if you don&apos;t have a secret key
          </p>
        </div>
      </div>
    </div>
  )
}

export default function DashboardLoginPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center bg-background">Loading...</div>}>
      <DashboardLoginContent />
    </Suspense>
  )
}
