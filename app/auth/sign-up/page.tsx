"use client"

import { createClient } from "@/lib/supabase/client"
import { AuthShell } from "@/components/auth-shell"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"

const inputClass =
  "w-full border border-border bg-background px-3 py-2 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-primary"

export default function SignUpPage() {
  const [displayName, setDisplayName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [repeatPassword, setRepeatPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    const supabase = createClient()
    setIsLoading(true)
    setError(null)

    if (password !== repeatPassword) {
      setError("Passwords do not match")
      setIsLoading(false)
      return
    }

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            display_name: displayName,
          },
        },
      })
      if (error) throw error
      router.push("/auth/sign-up-success")
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AuthShell title="Enlist" subtitle="Create an account to join the discussion.">
      <form onSubmit={handleSignUp} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="displayName" className="label-mono text-muted-foreground">
            Display Name
          </label>
          <input
            id="displayName"
            type="text"
            placeholder="callsign"
            required
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className={inputClass}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="email" className="label-mono text-muted-foreground">
            Email
          </label>
          <input
            id="email"
            type="email"
            placeholder="operator@email.com"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={inputClass}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="password" className="label-mono text-muted-foreground">
            Password
          </label>
          <input
            id="password"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={inputClass}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="repeat-password" className="label-mono text-muted-foreground">
            Repeat Password
          </label>
          <input
            id="repeat-password"
            type="password"
            required
            value={repeatPassword}
            onChange={(e) => setRepeatPassword(e.target.value)}
            className={inputClass}
          />
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <div className="space-y-2 rounded border border-border bg-background/50 p-3 text-xs text-muted-foreground">
          <p className="font-semibold text-foreground">Development Mode</p>
          <p>
            {"Email verification is currently enabled in development. See "}
            <code className="bg-muted px-1 py-0.5 text-muted-foreground">SUPABASE_EMAIL_SETUP.md</code>
            {" to disable it for immediate access."}
          </p>
          <p className="italic">
            {"In production, email verification will be required to prevent spam."}
          </p>
        </div>
        <button
          type="submit"
          disabled={isLoading}
          className="label-mono bg-primary py-2.5 font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
        >
          {isLoading ? "Creating account..." : "Enlist"}
        </button>
      </form>
      <p className="mt-4 text-center text-sm text-muted-foreground">
        {"Already enlisted? "}
        <Link href="/auth/login" className="text-primary underline-offset-4 hover:underline">
          Sign in
        </Link>
      </p>
    </AuthShell>
  )
}
