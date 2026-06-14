"use client"

import { useState } from "react"
import { Mail, Check } from "lucide-react"

export function BriefSignup() {
  const [email, setEmail] = useState("")
  const [done, setDone] = useState(false)

  return (
    <section className="border border-border bg-secondary text-secondary-foreground">
      <div className="p-5">
        <div className="flex items-center gap-2">
          <Mail className="h-4 w-4" />
          <h2 className="stencil text-lg">Daily Briefing</h2>
        </div>
        <p className="mt-2 text-sm leading-relaxed text-secondary-foreground/80">
          One consolidated dispatch at 0600 local. Top signals, ranked. No noise.
        </p>

        {done ? (
          <div className="mt-4 flex items-center gap-2 border border-primary/50 bg-background px-3 py-3 text-foreground">
            <Check className="h-4 w-4 text-primary" />
            <span className="label-mono">YOU ARE ON THE LIST</span>
          </div>
        ) : (
          <form
            className="mt-4 flex flex-col gap-2 sm:flex-row"
            onSubmit={(e) => {
              e.preventDefault()
              if (email) setDone(true)
            }}
          >
            <label htmlFor="brief-email" className="sr-only">
              Email address
            </label>
            <input
              id="brief-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="operator@email.com"
              className="flex-1 border border-border bg-background px-3 py-2 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-primary"
            />
            <button
              type="submit"
              className="label-mono bg-primary px-4 py-2 font-semibold text-primary-foreground transition-opacity hover:opacity-90"
            >
              Enlist
            </button>
          </form>
        )}
      </div>
    </section>
  )
}
