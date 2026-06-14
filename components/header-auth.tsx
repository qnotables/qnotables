"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { LogIn, LogOut, UserRound } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

export function HeaderAuth() {
  const router = useRouter()
  const [email, setEmail] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => {
      setEmail(data.user?.email ?? null)
      setUserId(data.user?.id ?? null)
      setLoaded(true)
    })
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setEmail(session?.user?.email ?? null)
      setUserId(session?.user?.id ?? null)
    })
    return () => sub.subscription.unsubscribe()
  }, [])

  async function signOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.refresh()
  }

  if (!loaded) {
    return <span className="h-9 w-9" aria-hidden="true" />
  }

  if (email) {
    return (
      <div className="flex items-center gap-2">
        {userId ? (
          <Link
            href={`/u/${userId}`}
            className="flex items-center gap-2 border border-border px-3 py-2 text-muted-foreground transition-colors hover:border-primary hover:text-primary"
            aria-label="View your profile"
            title={email}
          >
            <UserRound className="h-4 w-4" />
            <span className="label-mono hidden md:inline">Profile</span>
          </Link>
        ) : null}
        <button
          type="button"
          onClick={signOut}
          className="flex items-center gap-2 border border-border px-3 py-2 text-muted-foreground transition-colors hover:border-primary hover:text-primary"
          aria-label="Sign out"
        >
          <LogOut className="h-4 w-4" />
          <span className="label-mono hidden md:inline">Sign Out</span>
        </button>
      </div>
    )
  }

  return (
    <Link
      href="/auth/login"
      className="flex items-center gap-2 border border-border px-3 py-2 text-muted-foreground transition-colors hover:border-primary hover:text-primary"
      aria-label="Sign in"
    >
      <LogIn className="h-4 w-4" />
      <span className="label-mono hidden md:inline">Sign In</span>
    </Link>
  )
}
